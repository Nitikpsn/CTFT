from typing import Any


def validate_records(records: list[dict[str, Any]]) -> list[dict[str, str]]:
    errors = []
    for i, r in enumerate(records):
        if not r.get("admission_no"):
            errors.append({"row": i + 1, "field": "admission_no", "message": "Missing admission number"})
        if r.get("admission_no") and len(str(r["admission_no"])) > 30:
            errors.append({"row": i + 1, "field": "admission_no", "message": "Admission number too long"})
        if not r.get("student_name"):
            errors.append({"row": i + 1, "field": "student_name", "message": "Missing student name"})
    return errors


def validate_columns(df_columns: list[str]) -> list[str]:
    lower_cols = [c.strip().lower() for c in df_columns]
    required_hints = ["admission", "name"]
    missing = []
    for hint in required_hints:
        if not any(hint in c for c in lower_cols):
            missing.append(hint)
    return missing