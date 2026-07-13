import pandas as pd
import numpy as np
from typing import Any

TOTAL_KEYWORDS = [
    "total", "grand", "subtotal", "students",
    "योग", "संख्या", "कुल", "strength", "count",
    "enrolled", "enrollment", "sum",
]


def find_total_students_column(df: pd.DataFrame) -> str | None:
    """
    Dynamically identify the 'Total Students' column by data profiling:
    1. Check header keywords as a heuristic hint
    2. Verify the candidate is numeric with reasonable student counts
    3. Fallback: column with highest sum that isn't a sequential ID
    """
    # Step 1: keyword match on headers
    for col in df.columns:
        lower = str(col).strip().lower()
        if any(kw in lower for kw in TOTAL_KEYWORDS):
            col_vals = pd.to_numeric(df[col], errors="coerce").dropna()
            if len(col_vals) > 0:
                median = col_vals.median()
                max_val = col_vals.max()
                # A total column should have reasonable student-range values
                if 1 <= median <= 5000 and max_val < 50000:
                    return col

    # Step 2: profile numeric columns
    numeric_cols = []
    for col in df.columns:
        col_vals = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(col_vals) < 2:
            continue
        numeric_cols.append({
            "name": col,
            "sum": col_vals.sum(),
            "median": col_vals.median(),
            "mean": col_vals.mean(),
            "max": col_vals.max(),
            "is_monotonic": col_vals.is_monotonic_increasing,
            "unique_diffs": col_vals.diff().dropna().nunique() if len(col_vals) > 1 else 0,
        })

    if not numeric_cols:
        return None

    # Sort by sum descending
    numeric_cols.sort(key=lambda x: x["sum"], reverse=True)

    for nc in numeric_cols:
        # Skip auto-incrementing ID columns (1, 2, 3...)
        if nc["is_monotonic"] and nc["unique_diffs"] <= 1:
            continue
        # Skip columns that look like row indices (values match row number)
        if nc["mean"] < 50 and nc["is_monotonic"]:
            continue
        return nc["name"]

    return numeric_cols[0]["name"]


def clean_grand_total_rows(df: pd.DataFrame, total_col: str) -> pd.DataFrame:
    """
    Remove summary/total rows by statistical outlier detection.
    A grand total row will have a value in the total column that is
    several times larger than a typical class-level row.
    """
    if total_col not in df.columns:
        return df

    values = pd.to_numeric(df[total_col], errors="coerce")
    median_val = values.median()

    if pd.isna(median_val) or median_val == 0:
        return df

    outlier_threshold = median_val * 2.5
    clean_mask = values < outlier_threshold
    cleaned = df[clean_mask].copy()

    return cleaned if len(cleaned) > 0 else df


def detect_class_column(df: pd.DataFrame) -> str | None:
    """Find the class/grade column by profiling."""
    CLASS_KEYWORDS = ["class", "grade", "standard", "cls", "कक्षा", "क्लास"]

    for col in df.columns:
        lower = str(col).strip().lower()
        if any(kw in lower for kw in CLASS_KEYWORDS):
            return col

    # Fallback: find a column with few unique values that look like class identifiers
    for col in df.columns:
        unique_vals = df[col].dropna().unique()
        if 3 <= len(unique_vals) <= 20:
            sample = {str(v).strip().upper() for v in unique_vals}
            has_class_indicators = any(
                v.isdigit() or v in {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
                                     "LKG", "UKG", "NURSERY", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"}
                for v in sample
            )
            if has_class_indicators:
                return col

    return df.columns[0] if len(df.columns) > 0 else None


def detect_section_column(df: pd.DataFrame) -> str | None:
    """Find the section column by profiling."""
    SECTION_KEYWORDS = ["section", "अनुभाग", "सेक्शन", "sec", "भाग"]

    for col in df.columns:
        lower = str(col).strip().lower()
        if any(kw in lower for kw in SECTION_KEYWORDS):
            return col

    # Fallback: find a column with single-letter values (A, B, C...)
    for col in df.columns:
        unique_vals = df[col].dropna().unique()
        if 2 <= len(unique_vals) <= 10:
            sample = {str(v).strip().upper() for v in unique_vals}
            if all(len(v) <= 2 and v.isalpha() for v in sample if v):
                return col

    return None


def detect_category_columns(df: pd.DataFrame, class_col: str | None, section_col: str | None, total_col: str | None) -> dict[str, str]:
    """
    Identify category columns (SC, ST, OBC, General, etc.).
    These are numeric columns with small-ish values that aren't class, section, or total.
    """
    exclude = {str(c) for c in [class_col, section_col, total_col] if c}
    category_map: dict[str, str] = {}

    CATEGORY_ALIASES: dict[str, list[str]] = {
        "general": ["general", "gen", "सामान्य", "general category"],
        "obc": ["obc", "other backward class", "o.b.c.", "अन्य पिछड़ा वर्ग"],
        "obc_cl": ["obc cl", "obc-cl", "obc (cl)"],
        "obc_ncl": ["obc ncl", "obc-ncl", "obc (ncl)"],
        "sc": ["sc", "scheduled caste", "s.c.", "एस.सी.", "अनुसूचित जाति"],
        "st": ["st", "scheduled tribe", "s.t.", "एस.टी.", "अनुसूचित जनजाति"],
        "muslim": ["muslim", "मुस्लिम"],
        "christian": ["christian", "क्रिस्चियन"],
        "sikh": ["sikh", "सिख"],
        "buddhist": ["buddhist", "बुद्धिस्ट"],
        "parsi": ["parsi", "पारसी"],
        "jain": ["jain", "जैन"],
        "minority_total": ["minority", "अल्पसंख्यक"],
        "cwsn": ["cwsn", "divyang", "disabled", "विकलांग"],
        "rte": ["rte"],
        "sgc": ["sgc"],
        "boys": ["boys", "male", "बालक", "छात्र"],
        "girls": ["girls", "female", "बालिका", "छात्रा"],
    }

    # First pass: keyword match headers
    for col in df.columns:
        if col in exclude:
            continue
        lower = str(col).strip().lower()
        for canonical, aliases in CATEGORY_ALIASES.items():
            if any(alias in lower for alias in aliases):
                category_map[col] = canonical
                break

    # Second pass: profile remaining unmapped columns
    mapped = set(category_map.keys()) | exclude
    for col in df.columns:
        if col in mapped:
            continue
        col_vals = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(col_vals) < 2:
            continue
        median = col_vals.median()
        max_val = col_vals.max()
        # Category columns typically have small non-negative integers
        if 0 <= median <= 2000 and 0 <= max_val <= 10000:
            category_map[col] = str(col).strip().lower().replace(" ", "_")

    return category_map


def profile_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    """
    Profile a dataframe to detect all relevant columns dynamically.
    Returns a col_map dict (like resolve_columns) and detected metadata.
    """
    df_str = df.map(lambda x: str(x).strip() if isinstance(x, str) else x)

    total_col = find_total_students_column(df_str)
    class_col = detect_class_column(df_str)
    section_col = detect_section_column(df_str)

    col_map: dict[str, str] = {}
    if class_col:
        col_map[class_col] = "class"
    if section_col:
        col_map[section_col] = "section"
    if total_col:
        col_map[total_col] = "total"

    cat_map = detect_category_columns(df_str, class_col, section_col, total_col)
    col_map.update(cat_map)

    return {
        "col_map": col_map,
        "detected_total_col": total_col,
        "detected_class_col": class_col,
        "detected_section_col": section_col,
        "total_rows_before_clean": len(df_str),
    }
