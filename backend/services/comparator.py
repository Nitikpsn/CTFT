from collections import defaultdict
from typing import Any
from utils.fuzzy_match import is_fuzzy_match


def compare(
    school_records: list[dict[str, Any]],
    portal_records: list[dict[str, Any]],
    threshold: float = 0.85,
) -> dict[str, Any]:
    school_by_id = {r["admission_no"]: r for r in school_records}
    portal_by_id = {r["admission_no"]: r for r in portal_records}

    school_ids = set(school_by_id.keys())
    portal_ids = set(portal_by_id.keys())

    matched_ids = school_ids & portal_ids
    new_ids = portal_ids - school_ids
    missing_ids = school_ids - portal_ids

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
                    break

    new_ids -= fuzzy_matched
    missing_ids -= fuzzy_matched

    modifications = []
    modified_count = 0
    for sid in matched_ids & school_ids & portal_ids:
        s = school_by_id[sid]
        p = portal_by_id[sid]
        fields = ["student_name", "class_name", "gender", "category", "language"]
        for field in fields:
            if s.get(field, "").strip().lower() != p.get(field, "").strip().lower():
                if not is_fuzzy_match(s.get(field, ""), p.get(field, ""), threshold):
                    modifications.append({
                        "admission_no": sid,
                        "field_name": field,
                        "old_value": s.get(field, ""),
                        "new_value": p.get(field, ""),
                        "student_name": p.get("student_name", ""),
                    })
                    modified_count += 1

    # Mark diff_type
    modified_admissions = {m["admission_no"] for m in modifications}
    for m in modifications:
        m["difference_type"] = "modified"

    new_records = []
    for pid in new_ids:
        r = portal_by_id[pid]
        r["difference_type"] = "new"
        new_records.append(r)

    missing_records = []
    for sid in missing_ids:
        r = school_by_id[sid]
        r["difference_type"] = "missing"
        missing_records.append(r)

    matched_count = len(matched_ids)

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