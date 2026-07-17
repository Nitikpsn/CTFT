import os
import re
import pandas as pd
import numpy as np
from collections import defaultdict
from typing import Any
from utils.normalize import (
    CATEGORY_ALIASES,
    resolve_alias,
    normalize_class_label,
)
from services.data_profiler import profile_dataframe, clean_grand_total_rows

GENDER_SUFFIX_PATTERNS: list[tuple[str, list[str]]] = [
    ("boys", ["(b)", "(ब)", "boys", "boy", "बालक"]),
    ("girls", ["(g)", "(ल)", "girls", "girl", "बालिका"]),
]

# Regex patterns for dynamic category column detection (language-agnostic)
CATEGORY_REGEX_PATTERNS: dict[str, str] = {
    "sc": r"(एस\.सी\.|sc|scheduled\s*caste|अनुसूचित\s*जाति)",
    "st": r"(एस\.टी\.|st|scheduled\s*tribe|अनुसूचित\s*जनजाति)",
    "obc": r"(obc|ओ\.बी\.सी\.|पिछड़ा|अन्य\s*पिछड़ा|other\s*backward)",
    "general": r"(general|सामान्य|gen|ur|unreserved)",
    "minority": r"(minority|अल्पसंख्यक|muslim|मुस्लिम|christian|क्रिश्चियन|sikh|सिख|buddhist|बौद्ध)",
    "cwsn": r"(cwsn|divyang|disabled|विकलांग|special\s*need)",
    "rte": r"(rte|आरटीई)",
    "sgc": r"(sgc|एसजीसी)",
    "boys": r"(boys|बालक|male|पुरुष|छात्र)", 
    "girls": r"(girls|बालिका|female|महिला|छात्रा)",
}

CATEGORY_COMPARE_FIELDS = [
    "general", "obc", "obc_cl", "obc_ncl", "sc", "st",
    "muslim", "christian", "sikh", "buddhist", "parsi", "jain",
    "minority_total", "cwsn", "rte", "sgc",
]

CLASS_KEYWORDS = ["class", "grade", "standard", "cls", "कक्षा", "क्लास", "वर्ग"]

SECTION_KEYWORDS = ["section", "अनुभाग", "सेक्शन", "sec", "section_name", "भाग"]

SUBTOTAL_KEYWORDS = ["योग", "कुल", "subtotal", "total", "grand total", "संख्या", "sum"]

TOTAL_KEYWORDS = [
    "योग", "कुल योग", "कुल",
    "total", "grand total", "subtotal",
    "total students", "total student",
    "संख्या", "sum",
]

TOTAL_COL_KEYWORDS = [
    "योग", "कुल योग", "कुल", "total", "subtotal",
    "संख्या", "total students", "total student", "sum",
    "strength", "enrolled", "enrollment", "count",
]


def read_file(filepath: str) -> pd.DataFrame:
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".csv":
        return pd.read_csv(filepath, dtype=str)
    return pd.read_excel(filepath, dtype=str)


def _looks_like_header_row(row: pd.Series) -> bool:
    """
    Check if a row looks like column headers (labels/descriptions) rather than data.
    Header rows have: long textual labels, NaN values, or category/class keywords.
    Data rows have: short values, numbers, or known class identifiers.
    """
    text_vals = []
    for v in row.values:
        s = str(v).strip() if isinstance(v, str) else ""
        if not s or s.lower() in ("nan", ""):
            text_vals.append("")
        else:
            text_vals.append(s)

    non_empty = [t for t in text_vals if t]
    if not non_empty:
        return True

    # If most values are NaN, it's a header (merged cells)
    nan_ratio = sum(1 for t in text_vals if not t) / len(text_vals)
    if nan_ratio > 0.2:
        return True

    # If most values are long descriptive strings (>4 chars), it's a header
    long_strs = sum(1 for t in non_empty if len(t) > 4)
    if long_strs > len(non_empty) * 0.5:
        return True

    # If values look like class/category keywords rather than data
    class_keywords = {"class", "grade", "section", "total", "name", "general", "कक्षा", "अनुभाग", "सामान्य", "योग"}
    keyword_matches = sum(1 for t in non_empty if t.lower() in class_keywords or any(kw in t.lower() for kw in class_keywords))
    if keyword_matches > len(non_empty) * 0.3:
        return True

    return False


def flatten_nested_headers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Detect and flatten multi-row headers (e.g. merged cells in Hindi school sheets).
    Transforms: ['एस.सी.', NaN] + [NaN, 'बालक'] → 'एस.सी._बालक'
    Returns a DataFrame with single-row headers and data rows only.
    """
    if len(df) < 2:
        return df

    # Check if the first row looks like header text (labels) rather than data
    if not _looks_like_header_row(df.iloc[0]):
        return df

    # Consume all consecutive header rows at the top
    header_rows = 0
    while header_rows < min(3, len(df)) and _looks_like_header_row(df.iloc[header_rows]):
        header_rows += 1

    if header_rows < 2:
        return df

    # Flatten: combine header rows into single column names
    # Row 0 = parent categories, row 1 (and later) = sub-categories
    combined = df.iloc[:header_rows].ffill(axis=0).fillna("").astype(str)

    new_columns = []
    for col_idx in range(len(df.columns)):
        parts = [combined.iloc[r, col_idx].strip().strip("_") for r in range(header_rows)]
        parts = [p for p in parts if p]
        new_columns.append("_".join(parts) if parts else "")

    df = df.iloc[header_rows:].copy().reset_index(drop=True)
    df.columns = new_columns
    return df


def _detect_gender_from_text(text: str) -> str | None:
    """Detect gender from text like 'बालक', 'बालिका', 'boys', 'girls'."""
    lower = text.strip().lower()
    for gender, suffixes in GENDER_SUFFIX_PATTERNS:
        for sfx in suffixes:
            if sfx.lower() in lower:
                return gender
    return None


def resolve_columns_by_regex(df: pd.DataFrame) -> dict[str, str]:
    """
    Map columns to canonical types using regex patterns instead of keyword matching.
    Handles flattened nested headers like 'एस.सी._बालक' → 'sc_boys'.
    """
    col_map: dict[str, str] = {}

    for raw_col in df.columns:
        col_str = str(raw_col).strip()
        if _is_nan_column(raw_col) or not col_str:
            continue
        lower = col_str.lower()

        # 1. Check total column keywords first
        if any(kw in lower for kw in TOTAL_COL_KEYWORDS):
            col_map[raw_col] = "total"
            continue

        # 2. Check section column keywords
        if any(kw in lower for kw in SECTION_KEYWORDS):
            col_map[raw_col] = "section"
            continue

        # 3. Check class column keywords
        if _is_class_column(col_str):
            col_map[raw_col] = "class"
            continue

        # 4. Handle flattened headers with underscore separator (e.g. 'एस.सी._बालक')
        parts = col_str.split("_")
        if len(parts) >= 2:
            parent_part = parts[0]
            child_part = "_".join(parts[1:])
            parent_lower = parent_part.lower()
            child_lower = child_part.lower()

            # Check if parent matches a category
            for canonical, pattern in CATEGORY_REGEX_PATTERNS.items():
                if re.search(pattern, parent_lower):
                    gender = _detect_gender_from_text(child_lower)
                    if gender:
                        col_map[raw_col] = f"{canonical}_{gender}"
                    else:
                        col_map[raw_col] = canonical
                    break
            else:
                # Check if child matches a category (reversed order)
                for canonical, pattern in CATEGORY_REGEX_PATTERNS.items():
                    if re.search(pattern, child_lower):
                        gender = _detect_gender_from_text(parent_lower)
                        if gender:
                            col_map[raw_col] = f"{canonical}_{gender}"
                        else:
                            col_map[raw_col] = canonical
                        break
            continue

        # 5. Single-column regex-based category matching
        for canonical, pattern in CATEGORY_REGEX_PATTERNS.items():
            if re.search(pattern, lower):
                col_map[raw_col] = canonical
                break

    return col_map


def _is_nan_column(col: Any) -> bool:
    if pd.isna(col):
        return True
    if isinstance(col, str) and (col.strip().lower() == "nan" or col.startswith("Unnamed")):
        return True
    return False


def _exact_category_match(label: str) -> str | None:
    clean = label.strip().lower()
    if not clean:
        return None
    for canonical, aliases in CATEGORY_ALIASES.items():
        if clean == canonical.lower():
            return canonical
        for alias in aliases:
            if clean == alias.lower():
                return canonical
    return None


def _is_class_column(col_str: str) -> bool:
    lower = col_str.strip().lower()
    for kw in CLASS_KEYWORDS:
        if kw in lower:
            return True
    return False


def _parse_gender_suffix(col: str) -> tuple[str | None, str | None]:
    lower = re.sub(r"[\s\-_]+", " ", col.strip().lower())
    for gender, suffixes in GENDER_SUFFIX_PATTERNS:
        for sfx in suffixes:
            sfx_clean = re.sub(r"[\s\-_]+", " ", sfx.lower())
            if sfx_clean not in lower:
                continue
            base = lower.replace(sfx_clean, "").strip()
            base = re.sub(r"[\s\-_]+", " ", base).strip()
            base = re.sub(r"[\(\)\[\]]", "", base).strip()
            if not base:
                continue
            cat = _exact_category_match(base)
            if cat:
                return cat, gender
    return None, None


def _resolve_nan_columns(df: pd.DataFrame, col_map: dict[str, str]) -> None:
    for i, raw_col in enumerate(df.columns):
        if not _is_nan_column(raw_col):
            continue
        if i == 0:
            continue
        prev_raw = df.columns[i - 1]
        prev_mapped = col_map.get(prev_raw)
        if prev_mapped and prev_mapped not in ("class", "total", "boys", "girls", "section"):
            if not prev_mapped.endswith("_boys") and not prev_mapped.endswith("_girls"):
                col_map[i] = f"{prev_mapped}_girls"


def resolve_columns(df: pd.DataFrame) -> dict[str, str]:
    col_map: dict[str, str] = {}
    gender_split_cols: dict[str, list[str]] = defaultdict(list)
    combined_cats: set[str] = set()

    for raw_col in df.columns:
        col_str = str(raw_col)
        if _is_nan_column(raw_col):
            continue

        cat, gender = _parse_gender_suffix(col_str)
        if cat:
            gender_split_cols[(cat, gender)].append(raw_col)
            continue

        # Check total column BEFORE category aliases — "Total Students" contains "st" substring
        lower = col_str.strip().lower()
        if any(kw in lower for kw in TOTAL_COL_KEYWORDS):
            col_map[raw_col] = "total"
            continue

        # Resolve category aliases BEFORE class — "अन्य पिछड़ा वर्ग" is OBC, not a class column
        cat, _ = resolve_alias(col_str)
        if cat:
            combined_cats.add(cat)
            col_map[raw_col] = cat
            continue

        if _is_class_column(col_str) or _is_class_column(col_str.replace(" ", "")):
            col_map[raw_col] = "class"
            continue

        if any(kw in lower for kw in SECTION_KEYWORDS):
            col_map[raw_col] = "section"
            continue

    # Map NaN columns (from merged-cell headers) as _girls of the preceding category
    _resolve_nan_columns(df, col_map)

    # If a category has both combined and gender-split columns,
    # prefer the gender-split (more granular) and drop the combined
    split_cats: set[str] = set()
    for (cat, _gender), _cols in gender_split_cols.items():
        split_cats.add(cat)

    for raw_col in list(col_map.keys()):
        mapped = col_map[raw_col]
        if mapped in split_cats and mapped not in ("class", "total"):
            del col_map[raw_col]

    # Write gender-split columns into col_map
    for (cat, gender), cols in gender_split_cols.items():
        for raw in cols:
            col_map[raw] = f"{cat}_{gender}"

    return col_map


def _is_subtotal_row(row: pd.Series) -> bool:
    for col_val in row.values:
        val = str(col_val).strip().lower()
        if any(kw in val for kw in SUBTOTAL_KEYWORDS):
            return True
    return False


def _get_class_value(row: pd.Series, class_col: str | None) -> int | str | None:
    if class_col is None:
        return None
    val = str(row[class_col]).strip()
    if not val or val.lower() == "nan":
        return None
    nv = val.lower()
    if any(kw in nv for kw in SUBTOTAL_KEYWORDS):
        return None
    return normalize_class_label(val)


def _parse_numeric(val: Any) -> int:
    try:
        return int(float(str(val)))
    except (ValueError, TypeError):
        return 0


def _col_val(row: pd.Series, raw_key: Any) -> Any:
    if isinstance(raw_key, int):
        return row.iloc[raw_key]
    return row[raw_key]


def _find_section_col(df: pd.DataFrame, col_map: dict) -> str | None:
    for raw, mapped in col_map.items():
        if mapped == "section":
            return raw
    for c in df.columns:
        lower = str(c).strip().lower()
        if any(kw in lower for kw in SECTION_KEYWORDS):
            return c
    return None


def _normalize_key(val: Any) -> str:
    return str(val).strip().upper()


def _is_total_row(row: pd.Series) -> bool:
    for cell in row.values:
        v = str(cell).strip().lower()
        if any(kw in v for kw in SUBTOTAL_KEYWORDS):
            return True
    return False


def aggregate_by_class(
    df: pd.DataFrame, col_map: dict[str | int, str]
) -> dict[int | str, dict[str, int]]:
    class_col = next((r for r, m in col_map.items() if m == "class"), None)
    section_col = _find_section_col(df, col_map)

    # Filter out total/summary rows — check every cell in the row
    mask = df.apply(_is_total_row, axis=1)
    df_clean = df[~mask].copy()

    # Drop rows where class column is empty/NaN (likely formatting rows)
    if class_col:
        df_clean = df_clean.dropna(subset=[class_col])
        df_clean = df_clean[df_clean[class_col].astype(str).str.strip() != ""]

    if df_clean.empty:
        return {}

    # Normalize class & section keys — Roman numerals BEFORE groupby
    if class_col:
        df_clean["_match_class"] = df_clean[class_col].astype(str).str.upper().str.strip()
        df_clean["_match_class"] = df_clean["_match_class"].apply(normalize_class_label).astype(str)
    else:
        df_clean["_match_class"] = "?"
    if section_col:
        df_clean["_match_section"] = df_clean[section_col].astype(str).str.upper().str.strip()
    else:
        df_clean["_match_section"] = ""

    # Gather category columns (exclude class, section, boys, girls, but INCLUDE total)
    category_raw_cols = [
        raw for raw, mapped in col_map.items()
        if mapped not in ("class", "section", "boys", "girls")
    ]

    if not category_raw_cols or df_clean.empty:
        return {}

    # Identify the dedicated total column (योग / Total Students)
    total_raw_col = next((raw for raw, mapped in col_map.items() if mapped == "total"), None)
    cat_raw_cols_no_total = [c for c in category_raw_cols if c != total_raw_col]

    if not cat_raw_cols_no_total and not total_raw_col:
        return {}

    # Build category mapping: raw_col -> canonical category name
    cat_rename = {}
    for raw in cat_raw_cols_no_total:
        mapped = col_map[raw]
        if mapped.endswith("_boys") or mapped.endswith("_girls"):
            cat_rename[raw] = mapped.rsplit("_", 1)[0]
        else:
            cat_rename[raw] = mapped

    # Convert category columns to numeric (file was read with dtype=str)
    numeric_cols = list(cat_raw_cols_no_total)
    if total_raw_col:
        numeric_cols.append(total_raw_col)
    for c in numeric_cols:
        if c in df_clean.columns:
            df_clean[c] = pd.to_numeric(df_clean[c], errors="coerce").fillna(0)

    # Drop rows where ALL category values are 0 (likely formatting/decoration rows)
    if cat_raw_cols_no_total:
        cat_bool_mask = df_clean[cat_raw_cols_no_total].sum(axis=1) > 0
        df_clean = df_clean[cat_bool_mask]

    if df_clean.empty:
        return {}

    # Group by class+section and sum
    group_keys = ["_match_class", "_match_section"]
    numeric_subset = [c for c in numeric_cols if c in df_clean.columns]
    if not numeric_subset:
        return {}

    grouped = df_clean.groupby(group_keys)[numeric_subset].sum(min_count=1).reset_index()

    # Rename category columns (not the total column)
    rename_map = {k: v for k, v in cat_rename.items() if k in grouped.columns}
    if rename_map:
        grouped = grouped.rename(columns=rename_map)
    if total_raw_col and total_raw_col in grouped.columns:
        grouped = grouped.rename(columns={total_raw_col: "_row_total"})

    # Aggregate across sections per class
    cat_cols = list(set(cat_rename.values()))
    available_cats = [c for c in cat_cols if c in grouped.columns]

    result = {}
    for cls_val, grp in grouped.groupby("_match_class"):
        row = {}
        if available_cats:
            cat_sums = grp[available_cats].sum().to_dict()
            row.update({k: _parse_numeric(v) for k, v in cat_sums.items()})
        # Use the dedicated total column as the authoritative student count
        if "_row_total" in grp.columns:
            row["total"] = _parse_numeric(grp["_row_total"].sum())
        result[normalize_class_label(cls_val)] = row

    return result


def aggregate_by_section(
    df: pd.DataFrame, col_map: dict[str | int, str]
) -> dict[str, dict[str, int]]:
    """
    Aggregate at the class+section level (e.g. \"1-A\", \"2-B\").
    Returns {class_id: {category: count, total: count}}.
    """
    class_col = next((r for r, m in col_map.items() if m == "class"), None)
    section_col = _find_section_col(df, col_map)

    mask = df.apply(_is_total_row, axis=1)
    df_clean = df[~mask].copy()

    if class_col:
        df_clean = df_clean.dropna(subset=[class_col])
        df_clean = df_clean[df_clean[class_col].astype(str).str.strip() != ""]

    if df_clean.empty:
        return {}

    if class_col:
        df_clean["_cls"] = df_clean[class_col].astype(str).str.upper().str.strip()
        df_clean["_cls"] = df_clean["_cls"].apply(normalize_class_label).astype(str)
    else:
        df_clean["_cls"] = "?"
    if section_col:
        df_clean["_sec"] = df_clean[section_col].astype(str).str.upper().str.strip()
    else:
        df_clean["_sec"] = ""

    category_raw_cols = [
        raw for raw, mapped in col_map.items()
        if mapped not in ("class", "section", "boys", "girls")
    ]
    if not category_raw_cols or df_clean.empty:
        return {}

    total_raw_col = next((raw for raw, mapped in col_map.items() if mapped == "total"), None)
    cat_raw_cols_no_total = [c for c in category_raw_cols if c != total_raw_col]

    if not cat_raw_cols_no_total and not total_raw_col:
        return {}

    cat_rename = {}
    for raw in cat_raw_cols_no_total:
        mapped = col_map[raw]
        if mapped.endswith("_boys") or mapped.endswith("_girls"):
            cat_rename[raw] = mapped.rsplit("_", 1)[0]
        else:
            cat_rename[raw] = mapped

    numeric_cols = list(cat_raw_cols_no_total)
    if total_raw_col:
        numeric_cols.append(total_raw_col)
    for c in numeric_cols:
        if c in df_clean.columns:
            df_clean[c] = pd.to_numeric(df_clean[c], errors="coerce").fillna(0)

    if cat_raw_cols_no_total:
        cat_bool_mask = df_clean[cat_raw_cols_no_total].sum(axis=1) > 0
        df_clean = df_clean[cat_bool_mask]

    if df_clean.empty:
        return {}

    group_keys = ["_cls", "_sec"]
    numeric_subset = [c for c in numeric_cols if c in df_clean.columns]
    if not numeric_subset:
        return {}

    grouped = df_clean.groupby(group_keys)[numeric_subset].sum(min_count=1).reset_index()

    rename_map = {k: v for k, v in cat_rename.items() if k in grouped.columns}
    if rename_map:
        grouped = grouped.rename(columns=rename_map)
    if total_raw_col and total_raw_col in grouped.columns:
        grouped = grouped.rename(columns={total_raw_col: "_row_total"})

    cat_cols = list(set(cat_rename.values()))
    available_cats = [c for c in cat_cols if c in grouped.columns]

    result = {}
    for _, row in grouped.iterrows():
        cls = str(row["_cls"])
        sec = str(row["_sec"]) if str(row["_sec"]) else ""
        class_id = f"{cls}-{sec}" if sec else cls
        entry = {}
        if available_cats:
            for c in available_cats:
                entry[c] = _parse_numeric(row.get(c, 0))
        if "_row_total" in grouped.columns:
            entry["total"] = _parse_numeric(row.get("_row_total", 0))
        result[class_id] = entry
    return result


def has_gender_split(df: pd.DataFrame, col_map: dict[str, str]) -> bool:
    for mapped in col_map.values():
        if mapped.endswith("_boys") or mapped.endswith("_girls"):
            return True
    return False


def internal_consistency_check(
    aggregated: dict[int | str, dict[str, int]],
    file_label: str,
) -> list[dict]:
    checks: list[dict] = []
    for cls, cats in aggregated.items():
        category_sum = sum(cats.get(c, 0) for c in CATEGORY_COMPARE_FIELDS)
        students_total = cats.get("total", 0)
        if students_total > 0 and category_sum != students_total:
            gap = students_total - category_sum
            checks.append({
                "file": file_label,
                "class": cls,
                "category_sum": category_sum,
                "students_total": students_total,
                "gap": gap,
                "severity": "warning" if abs(gap) / students_total < 0.1 else "error",
            })
    return checks


def parse_category_file(
    filepath: str, file_label: str
) -> dict[str, Any]:
    df = read_file(filepath)
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)

    # Phase 0: Flatten multi-row headers (merged cells in Hindi/English sheets)
    df = flatten_nested_headers(df)

    # Phase 1: Regex-based column resolution (language-agnostic pattern matching)
    col_map = resolve_columns_by_regex(df)
    class_col = next((r for r, m in col_map.items() if m == "class"), None)
    total_col = next((r for r, m in col_map.items() if m == "total"), None)
    section_col = next((r for r, m in col_map.items() if m == "section"), None)

    # Phase 2: If regex missed key columns, try data profiling (statistical detection)
    if class_col is None or total_col is None:
        profiled = profile_dataframe(df)
        for k, v in profiled["col_map"].items():
            if k not in col_map:
                col_map[k] = v
        if class_col is None:
            class_col = profiled["detected_class_col"]
        if total_col is None:
            total_col = profiled["detected_total_col"]
        if section_col is None:
            section_col = profiled["detected_section_col"]

    # Phase 3: Fallback to keyword-based column resolution for remaining unmapped columns
    if class_col is None or not any(v not in ("class", "section", "total") for v in col_map.values()):
        kw_col_map = resolve_columns(df)
        for k, v in kw_col_map.items():
            if k not in col_map:
                col_map[k] = v
        if class_col is None:
            class_col = next((r for r, m in col_map.items() if m == "class"), None)
        if total_col is None:
            total_col = next((r for r, m in col_map.items() if m == "total"), None)

    # Phase 4: Statistically clean grand total rows before aggregation
    if total_col:
        df = clean_grand_total_rows(df, total_col)
        df[total_col] = pd.to_numeric(df[total_col], errors="coerce").fillna(0)
        df = df[df[total_col] > 0]

    aggregated = aggregate_by_class(df, col_map)
    section_agg = aggregate_by_section(df, col_map)

    # Phase 5: Detect subtotal rows, consistency checks
    has_subtotal = False
    for _, row in df.iterrows():
        if _is_subtotal_row(row):
            has_subtotal = True
            break

    checks = internal_consistency_check(aggregated, file_label)
    gender_split = has_gender_split(df, col_map)

    return {
        "file_label": file_label,
        "aggregated": {str(k): v for k, v in aggregated.items()},
        "section_aggregated": section_agg,
        "col_map": col_map,
        "has_subtotal_rows": has_subtotal,
        "has_gender_split": gender_split,
        "consistency_checks": checks,
        "total_classes": len(aggregated),
    }
