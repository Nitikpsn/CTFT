import json
import re
from google import genai
from config import settings


class GeminiService:
    def __init__(self):
        self.client = None
        self.model = "gemini-2.5-flash-preview-05-07"
        if settings.ai_api_key:
            self.client = genai.Client(api_key=settings.ai_api_key)

    def column_mapping(self, columns: list[str]) -> dict[str, str]:
        if not self.client:
            return self._fallback_mapping(columns)

        prompt = (
            "Map these Excel column names to standard fields: admission_no, student_name, "
            "class_name, gender, category, language. Return ONLY a JSON object like "
            '{"admission_no": "original_col", ...}. Skip unmappable columns.\n\n'
            f"Columns: {columns}"
        )
        response = self.client.models.generate_content(
            model=self.model, contents=prompt
        )
        return self._parse_json(response.text)

    def normalize_query(self, query_text: str) -> str:
        if not self.client:
            return query_text

        prompt = (
            "Normalize this school query to English using standard terms "
            "(boy, girl, SC, ST, OBC, GEN, EWS, class 1-12). "
            "Return only the normalized query.\n\n"
            f"Query: {query_text}"
        )
        response = self.client.models.generate_content(
            model=self.model, contents=prompt
        )
        return response.text.strip()

    def query_to_filter(self, query_text: str, classes: list[str]) -> dict:
        if not self.client:
            return {}

        prompt = (
            "Convert this school query into a JSON filter object. "
            "Available classes: " + ", ".join(classes) + ". "
            'Return like: {"gender": "boy", "category": "SC", "class_name": "6"}. '
            "Skip fields not mentioned. Return ONLY valid JSON.\n\n"
            f"Query: {query_text}"
        )
        response = self.client.models.generate_content(
            model=self.model, contents=prompt
        )
        return self._parse_json(response.text)

    def generate_report_summary(self, stats: dict) -> str:
        if not self.client:
            return "Report generated successfully."

        prompt = (
            "Summarize this school data report in simple English for a teacher:\n"
            f"{stats}"
        )
        response = self.client.models.generate_content(
            model=self.model, contents=prompt
        )
        return response.text.strip()

    def _fallback_mapping(self, columns: list[str]) -> dict[str, str]:
        mapping = {}
        lower_cols = {c: c.strip().lower() for c in columns}
        for raw, lower in lower_cols.items():
            if "admission" in lower or "roll" in lower or "id" in lower:
                mapping["admission_no"] = raw
            elif "name" in lower:
                mapping["student_name"] = raw
            elif "class" in lower or "grade" in lower or "standard" in lower:
                mapping["class_name"] = raw
            elif "gender" in lower or "sex" in lower:
                mapping["gender"] = raw
            elif "category" in lower or "caste" in lower:
                mapping["category"] = raw
            elif "language" in lower or "medium" in lower:
                mapping["language"] = raw
        return mapping

    def explain_difference(
        self, school_record: dict, portal_record: dict, field: str,
        old_val: str, new_val: str
    ) -> dict:
        if not self.client:
            return {
                "type": "unknown",
                "explanation": "AI not configured. Manual review needed.",
                "confidence": 0.0,
                "action": "review",
            }

        prompt = (
            "You are a school data reconciliation expert. Analyze this change in a student record.\n\n"
            f"Student: {portal_record.get('student_name', '')} (ID: {portal_record.get('admission_no', '')})\n"
            f"Field changed: {field}\n"
            f"Old value (school record): {old_val}\n"
            f"New value (portal record): {new_val}\n\n"
            "Classify this change into one of:\n"
            "- 'correction': Fixing a data entry error (e.g. spelling fix, wrong class)\n"
            "- 'rename': Student name changed legitimately\n"
            "- 'reclassification': Category/gender changed (possible miscategorization)\n"
            "- 'data_entry_error': Likely someone typed wrong data\n"
            "- 'unknown': Cannot determine\n\n"
            "Return ONLY a JSON object with keys: type, explanation (1 sentence), confidence (0-1), action (accept/skip/review)."
        )
        try:
            response = self.client.models.generate_content(
                model=self.model, contents=prompt
            )
            result = self._parse_json(response.text)
            if isinstance(result, dict) and result.get("type"):
                return result
            return {"type": "unknown", "explanation": "Could not classify.", "confidence": 0.0, "action": "review"}
        except Exception:
            return {"type": "unknown", "explanation": "Could not analyze.", "confidence": 0.0, "action": "review"}

    def suggest_best_match(
        self, unmatched_record: dict, candidates: list[dict], top_n: int = 3
    ) -> list[dict]:
        if not self.client or not candidates:
            return []

        rec_str = (
            f"Record to match:\n"
            f"  Name: {unmatched_record.get('student_name', '')}\n"
            f"  Class: {unmatched_record.get('class_name', '')}\n"
            f"  Gender: {unmatched_record.get('gender', '')}\n"
            f"  Category: {unmatched_record.get('category', '')}\n"
        )
        cand_str = "\n".join(
            f"  {i+1}. Name: {c.get('student_name', '')} | Class: {c.get('class_name', '')} "
            f"| Gender: {c.get('gender', '')} | Category: {c.get('category', '')}"
            for i, c in enumerate(candidates[:10])
        )

        prompt = (
            "You are matching student records across two school data sources. "
            "The record below has no exact ID match in the other sheet. "
            "Find the best matches from the candidate list. Consider name similarity, class, gender, and category.\n\n"
            f"{rec_str}\nCandidates:\n{cand_str}\n\n"
            "Return ONLY a JSON array of objects with keys: candidate_index (0-based), score (0-1), reason (short). "
            "Sort by score descending. Max 3 results."
        )
        try:
            response = self.client.models.generate_content(
                model=self.model, contents=prompt
            )
            result = self._parse_json(response.text, allow_array=True)
            if isinstance(result, list):
                return result
            if isinstance(result, dict) and "matches" in result:
                return result["matches"]
            return []
        except Exception:
            return []

    def _parse_json(self, text: str, allow_array: bool = False) -> dict | list:
        if not text:
            return {} if not allow_array else []

        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
            text = text.strip()

        if allow_array:
            array_match = re.search(r"\[.*\]", text, re.DOTALL)
            if array_match:
                try:
                    return json.loads(array_match.group())
                except json.JSONDecodeError:
                    pass

        obj_match = re.search(r"\{.*\}", text, re.DOTALL)
        if obj_match:
            try:
                return json.loads(obj_match.group())
            except json.JSONDecodeError:
                pass

        if allow_array:
            return []
        return {}


gemini_service = GeminiService()
