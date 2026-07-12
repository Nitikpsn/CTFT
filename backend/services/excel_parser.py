import pandas as pd
import os
from typing import Any
from utils.normalize import normalize_gender, normalize_category, normalize_language


def infer_columns(df: pd.DataFrame) -> dict[str, str]:
    col_map = {}
    lower_cols = {c: str(c).strip().lower() for c in df.columns}

    admission_keywords = ["admission", "admn", "adm", "roll", "student id", "student_id", "enrollment", "enrol"]
    name_keywords = ["name", "student", "student_name", "child", "full name"]
    class_keywords = ["class", "grade", "standard", "cls"]
    gender_keywords = ["gender", "sex"]
    category_keywords = ["category", "caste", "community"]
    lang_keywords = ["language", "medium", "lang", "hindi", "english"]

    for raw_col, lower_col in lower_cols.items():
        if any(k in lower_col for k in admission_keywords):
            col_map["admission_no"] = raw_col
        elif any(k in lower_col for k in name_keywords):
            col_map["student_name"] = raw_col
        elif any(k in lower_col for k in class_keywords):
            col_map["class_name"] = raw_col
        elif any(k in lower_col for k in gender_keywords):
            col_map["gender"] = raw_col
        elif any(k in lower_col for k in category_keywords):
            col_map["category"] = raw_col
        elif any(k in lower_col for k in lang_keywords):
            col_map["language"] = raw_col

    return col_map


def read_file(filepath: str) -> pd.DataFrame:
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".csv":
        return pd.read_csv(filepath, dtype=str)
    return pd.read_excel(filepath, dtype=str)


def parse_excel(filepath: str, source_sheet: str) -> list[dict[str, Any]]:
    df = read_file(filepath)
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x).fillna("")
    col_map = infer_columns(df)

    records = []
    for _, row in df.iterrows():
        record = {
            "admission_no": str(row.get(col_map.get("admission_no", ""), "")).strip(),
            "student_name": str(row.get(col_map.get("student_name", ""), "")).strip(),
            "class_name": str(row.get(col_map.get("class_name", ""), "")).strip(),
            "gender": normalize_gender(str(row.get(col_map.get("gender", ""), "")).strip()),
            "category": normalize_category(str(row.get(col_map.get("category", ""), "")).strip()),
            "language": normalize_language(str(row.get(col_map.get("language", ""), "")).strip()),
            "source_sheet": source_sheet,
        }
        if record["admission_no"]:
            records.append(record)

    return records


def export_excel(data: list[dict], output_path: str):
    df = pd.DataFrame(data)
    df.to_excel(output_path, index=False)