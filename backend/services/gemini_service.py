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
            return {"error": "AI not configured"}

        prompt = (
            "Convert this school query into a JSON filter object. "
            "Available classes: " + ", ".join(classes) + ". "
            "Return like: {\"gender\": \"boy\", \"category\": \"SC\", \"class_name\": \"6\"}. "
            "Skip fields not mentioned.\n\n"
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

    def _parse_json(self, text: str) -> dict:
        import json, re
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {}


gemini_service = GeminiService()