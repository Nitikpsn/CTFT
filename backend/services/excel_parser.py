import pandas as pd
import os
import re
from collections import Counter
from typing import Any, Optional
from utils.normalize import normalize_gender, normalize_category, normalize_language

CRITICAL_FIELDS = {"admission_no", "student_name"}

SUBTOTAL_KEYWORDS = ["योग", "कुल", "subtotal", "total", "grand total", "संख्या", "sum"]
CLASS_KEYWORDS = ["class", "grade", "standard", "cls", "कक्षा", "क्लास", "वर्ग"]
SECTION_KEYWORDS = ["section", "अनुभाग", "सेक्शन", "sec", "भाग"]
CATEGORY_KEYWORDS = [
    "sc", "st", "obc", "general", "सामान्य", "एस.सी.", "एस.टी.", "ओ.बी.सी.",
    "scheduled caste", "scheduled tribe", "minority", "cwsn", "rte", "sgc",
    "muslim", "christian", "sikh", "buddhist", "parsi", "jain", "अल्पसंख्यक",
    "बालक", "बालिका", "boys", "girls", "छात्र", "छात्रा",
]
STUDENT_KEYWORDS = [
    "admission", "admn", "adm", "roll", "enrol", "student name", "student_name",
    "child name", "childs name", "full name",
]


def _normalize_admission(val: str) -> str:
    v = val.strip()
    v = re.sub(r'^(admn?|adm|roll|enrol|reg)[/\s\-]*', '', v, flags=re.IGNORECASE)
    v = re.sub(r'[^0-9a-zA-Z]', '', v)
    v = v.lstrip('0') or v or '0'
    return v


def detect_data_type(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(filepath, dtype=str, nrows=20)
    else:
        df = pd.read_excel(filepath, dtype=str, nrows=20)

    df.columns = [str(c).strip() for c in df.columns]
    lower_cols = [str(c).strip().lower() for c in df.columns]

    student_score = 0
    for col_lower in lower_cols:
        for kw in STUDENT_KEYWORDS:
            if kw in col_lower:
                student_score += 2
                break

    aggregate_score = 0

    for col_lower in lower_cols:
        for kw in CATEGORY_KEYWORDS:
            if kw in col_lower:
                aggregate_score += 1
                break

    for _, row in df.iterrows():
        row_text = " ".join(str(v).strip().lower() for v in row.values if pd.notna(v))
        for kw in SUBTOTAL_KEYWORDS:
            if kw in row_text:
                aggregate_score += 3
                break

    numeric_cols = 0
    for col in df.columns:
        vals = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(vals) >= 3:
            numeric_cols += 1
    if numeric_cols >= 4:
        aggregate_score += 2

    for col_lower in lower_cols:
        for kw in CLASS_KEYWORDS:
            if kw in col_lower:
                aggregate_score += 1
                break
        for kw in SECTION_KEYWORDS:
            if kw in col_lower:
                aggregate_score += 1
                break

    row_count = len(df)
    if row_count <= 30:
        aggregate_score += 1
    elif row_count > 100:
        student_score += 1

    if aggregate_score > student_score:
        return "aggregate"
    return "student"


def infer_columns(df: pd.DataFrame, ai_fallback: Optional[Any] = None) -> dict[str, str]:
    col_map = {}
    lower_cols = {c: str(c).strip().lower() for c in df.columns}

    admission_exact = [
        "admission_no", "admission number", "admn no", "adm no", "roll no", "roll number",
        "student id", "student_id", "enrollment no", "reg no", "registration no",
        "admission no", "admn. no", "adm. no", "roll no.", "admission no.",
    ]
    name_exact = [
        "student_name", "student name", "name", "child name", "full name", "childs name",
        "pupil name", "name of pupil", "name of student", "candidate name",
    ]
    class_exact = ["class_name", "class name", "class", "grade", "standard", "cls"]
    gender_exact = ["gender", "sex", "gender of student", "student gender"]
    category_exact = ["category", "caste", "community", "cat", "social category", "student category"]
    lang_exact = ["language", "medium", "lang", "language medium", "medium of instruction"]

    admission_sub = ["admission", "admn", "adm", "roll", "enrol", "reg no"]
    name_sub = ["student name", "child", "full name", "pupil", "candidate name"]
    class_sub = ["class", "grade", "standard", "cls"]

    for raw_col, lower_col in lower_cols.items():
        clean = lower_col.strip()

        if clean in admission_exact or any(k == clean for k in admission_exact):
            col_map["admission_no"] = raw_col
        elif clean in name_exact:
            col_map["student_name"] = raw_col
        elif clean in class_exact:
            col_map["class_name"] = raw_col
        elif clean in gender_exact:
            col_map["gender"] = raw_col
        elif clean in category_exact:
            col_map["category"] = raw_col
        elif clean in lang_exact:
            col_map["language"] = raw_col

    if "admission_no" not in col_map:
        for raw_col, lower_col in lower_cols.items():
            if any(k in lower_col for k in admission_sub):
                col_map["admission_no"] = raw_col
                break

    if "student_name" not in col_map:
        for raw_col, lower_col in lower_cols.items():
            if raw_col == col_map.get("admission_no"):
                continue
            if any(k in lower_col for k in name_sub):
                col_map["student_name"] = raw_col
                break
        if "student_name" not in col_map:
            for raw_col, lower_col in lower_cols.items():
                if raw_col == col_map.get("admission_no"):
                    continue
                if "name" in lower_col and "admission" not in lower_col:
                    col_map["student_name"] = raw_col
                    break

    if "class_name" not in col_map:
        for raw_col, lower_col in lower_cols.items():
            if raw_col in col_map.values():
                continue
            if any(k in lower_col for k in class_sub):
                col_map["class_name"] = raw_col
                break

    if "gender" not in col_map:
        for raw_col, lower_col in lower_cols.items():
            if raw_col in col_map.values():
                continue
            if "gender" in lower_col or "sex" in lower_col:
                col_map["gender"] = raw_col
                break

    if "category" not in col_map:
        for raw_col, lower_col in lower_cols.items():
            if raw_col in col_map.values():
                continue
            if "category" in lower_col or "caste" in lower_col or "community" in lower_col:
                col_map["category"] = raw_col
                break

    if "language" not in col_map:
        for raw_col, lower_col in lower_cols.items():
            if raw_col in col_map.values():
                continue
            if "language" in lower_col or "medium" in lower_col:
                col_map["language"] = raw_col
                break

    mapped_fields = set(col_map.keys())
    missing_critical = CRITICAL_FIELDS - mapped_fields

    if missing_critical and ai_fallback is not None:
        try:
            ai_map = ai_fallback.column_mapping(list(df.columns))
            for field in missing_critical:
                if field in ai_map and ai_map[field] in df.columns:
                    if field not in col_map:
                        col_map[field] = ai_map[field]
        except Exception:
            pass

    return col_map


def read_file(filepath: str) -> pd.DataFrame:
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".csv":
        return pd.read_csv(filepath, dtype=str)
    return pd.read_excel(filepath, dtype=str)


def parse_excel(filepath: str, source_sheet: str, ai_fallback: Optional[Any] = None) -> list[dict[str, Any]]:
    df = read_file(filepath)
    df.columns = [str(c).strip() for c in df.columns]
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x).fillna("")
    col_map = infer_columns(df, ai_fallback=ai_fallback)

    raw_adm_col = col_map.get("admission_no", "")
    raw_name_col = col_map.get("student_name", "")

    records = []
    seen_ids: Counter = Counter()

    for _, row in df.iterrows():
        raw_adm = str(row.get(raw_adm_col, "")).strip() if raw_adm_col else ""
        normalized_adm = _normalize_admission(raw_adm)

        if not normalized_adm or normalized_adm == "0":
            continue

        if seen_ids[normalized_adm] > 0:
            suffix = seen_ids[normalized_adm] + 1
            normalized_adm = f"{normalized_adm}_dup{suffix}"
        seen_ids[normalized_adm] += 1

        record = {
            "admission_no_raw": raw_adm,
            "admission_no": normalized_adm,
            "student_name": str(row.get(raw_name_col, "")).strip() if raw_name_col else "",
            "class_name": str(row.get(col_map.get("class_name", ""), "")).strip(),
            "gender": normalize_gender(str(row.get(col_map.get("gender", ""), "")).strip()),
            "category": normalize_category(str(row.get(col_map.get("category", ""), "")).strip()),
            "language": normalize_language(str(row.get(col_map.get("language", ""), "")).strip()),
            "source_sheet": source_sheet,
        }

        extra = {}
        for col in df.columns:
            if col in col_map.values():
                continue
            val = str(row.get(col, "")).strip()
            if val:
                extra[col] = val
        record["extra_fields"] = extra

        records.append(record)

    return records


def export_excel(data: list[dict], output_path: str):
    df = pd.DataFrame(data)
    df.to_excel(output_path, index=False)
