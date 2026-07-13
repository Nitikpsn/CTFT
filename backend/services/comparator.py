from collections import defaultdict
from typing import Any, Optional
from utils.fuzzy_match import is_fuzzy_match


def compare(
    school_records: list[dict[str, Any]],
    portal_records: list[dict[str, Any]],
    threshold: float = 0.85,
    ai_service: Optional[Any] = None,
    stream_callback: Optional[callable] = None,
) -> dict[str, Any]:
    school_by_id = {r["admission_no"]: r for r in school_records}
    portal_by_id = {r["admission_no"]: r for r in portal_records}

    school_ids = set(school_by_id.keys())
    portal_ids = set(portal_by_id.keys())

    matched_ids = school_ids & portal_ids
    new_ids = portal_ids - school_ids
    missing_ids = school_ids - portal_ids

    total_steps = len(matched_ids) + len(new_ids) + len(missing_ids)
    step = 0

    def _progress(msg: str):
        if stream_callback:
            step_ = min(step, total_steps) if total_steps > 0 else 1
            stream_callback("progress", {
                "message": msg,
                "current": step_,
                "total": total_steps,
            })

    _progress("Running fuzzy matching for unmatched records...")

    fuzzy_matched = set()
    if missing_ids:
        missing_names = {school_by_id[i]["student_name"].strip().lower(): i for i in missing_ids}
        for pid in new_ids.copy():
            pname = portal_by_id[pid]["student_name"].strip().lower()
            for sname, sid in missing_names.items():
                if is_fuzzy_match(pname, sname, threshold):
                    fuzzy_matched.add(sid)
                    fuzzy_matched.add(pid)
                    matched_ids.add(sid)
                    matched_ids.add(pid)
                    if stream_callback:
                        stream_callback("fuzzy_match", {
                            "school_id": sid,
                            "portal_id": pid,
                            "school_name": school_by_id[sid]["student_name"],
                            "portal_name": portal_by_id[pid]["student_name"],
                        })
                    break

    new_ids -= fuzzy_matched
    missing_ids -= fuzzy_matched

    if ai_service and (new_ids or missing_ids):
        _progress("AI matching remaining unmatched records...")
        unmatched_portal = [portal_by_id[pid] for pid in new_ids]
        unmatched_school = [school_by_id[sid] for sid in missing_ids]

        for pu in unmatched_portal[:5]:
            suggestions = ai_service.suggest_best_match(pu, unmatched_school[:20])
            if suggestions:
                best = suggestions[0]
                if isinstance(best, dict) and best.get("score", 0) >= 0.7:
                    sidx = best.get("candidate_index", -1)
                    if 0 <= sidx < len(unmatched_school):
                        matched_sid = unmatched_school[sidx]["admission_no"]
                        fuzzy_matched.add(matched_sid)
                        fuzzy_matched.add(pu["admission_no"])
                        matched_ids.add(matched_sid)
                        matched_ids.add(pu["admission_no"])
                        if stream_callback:
                            stream_callback("ai_match", {
                                "school_id": matched_sid,
                                "portal_id": pu["admission_no"],
                                "school_name": unmatched_school[sidx]["student_name"],
                                "portal_name": pu["student_name"],
                                "reason": best.get("reason", ""),
                                "score": best.get("score", 0),
                            })

    new_ids -= fuzzy_matched
    missing_ids -= fuzzy_matched

    modifications = []
    modified_count = 0
    modified_admissions = set()
    fields = ["student_name", "class_name", "gender", "category", "language"]

    _progress("Comparing matched records...")
    for sid in sorted(matched_ids & school_ids & portal_ids):
        s = school_by_id[sid]
        p = portal_by_id[sid]
        step += 1
        for field in fields:
            if s.get(field, "").strip().lower() != p.get(field, "").strip().lower():
                if not is_fuzzy_match(s.get(field, ""), p.get(field, ""), threshold):
                    diff = {
                        "admission_no": sid,
                        "field_name": field,
                        "old_value": s.get(field, ""),
                        "new_value": p.get(field, ""),
                        "student_name": p.get("student_name", ""),
                        "difference_type": "modified",
                    }
                    if ai_service:
                        _progress(f"AI analyzing diff: {p.get('student_name', '')} - {field}")
                        ai_insight = ai_service.explain_difference(s, p, field, s.get(field, ""), p.get(field, ""))
                        diff["ai_insight"] = ai_insight
                        if stream_callback:
                            stream_callback("diff_analyzed", {
                                **diff,
                                "ai_insight": ai_insight,
                            })
                    modifications.append(diff)
                    modified_count += 1
                    modified_admissions.add(sid)

        _progress(f"Progress: {step}/{total_steps}")

    for m in modifications:
        m["difference_type"] = "modified"

    new_records = []
    for pid in new_ids:
        r = dict(portal_by_id[pid])
        r["difference_type"] = "new"
        new_records.append(r)
        if stream_callback:
            stream_callback("new_record", r)

    missing_records = []
    for sid in missing_ids:
        r = dict(school_by_id[sid])
        r["difference_type"] = "missing"
        missing_records.append(r)
        if stream_callback:
            stream_callback("missing_record", r)

    matched_count = len(matched_ids)

    _progress("Comparison complete!")

    return {
        "matched": matched_count,
        "missing": len(missing_ids),
        "modified": len(modified_admissions),
        "new": len(new_ids),
        "matched_admissions": list(matched_ids),
        "modifications": modifications,
        "new_records": new_records,
        "missing_records": missing_records,
    }