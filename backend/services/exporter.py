import pandas as pd
from typing import Any
from services.stats_engine import class_wise_stats, language_wise_stats, compute_stats


def build_report_data(portal_records: list[dict], comparison: dict) -> dict[str, Any]:
    portal_stats = compute_stats(portal_records)
    class_stats = class_wise_stats(portal_records)
    lang_stats = language_wise_stats(portal_records)

    missing_records = comparison.get("missing_records", [])
    modifications = comparison.get("modifications", [])

    return {
        "class_wise": class_stats,
        "category_wise": {
            "SC": portal_stats["sc"],
            "ST": portal_stats["st"],
            "OBC": portal_stats["obc"],
            "EWS": portal_stats["ews"],
            "GEN": portal_stats["gen"],
        },
        "gender_wise": {
            "Boys": portal_stats["boys"],
            "Girls": portal_stats["girls"],
        },
        "language_wise": lang_stats,
        "missing_records": missing_records,
        "mismatch_report": modifications,
    }


def export_report_to_excel(report_data: dict[str, Any], output_path: str):
    writer = pd.ExcelWriter(output_path, engine="openpyxl")

    # Class-wise
    cw = report_data.get("class_wise", {})
    if cw:
        df_class = pd.DataFrame.from_dict(cw, orient="index")
        df_class.index.name = "Class"
        df_class.to_frame().to_excel(writer, sheet_name="Class Wise")

    # Category-wise
    cat = report_data.get("category_wise", {})
    if cat:
        df_cat = pd.DataFrame(list(cat.items()), columns=["Category", "Count"])
        df_cat.to_excel(writer, sheet_name="Category Wise", index=False)

    # Gender-wise
    gen = report_data.get("gender_wise", {})
    if gen:
        df_gen = pd.DataFrame(list(gen.items()), columns=["Gender", "Count"])
        df_gen.to_excel(writer, sheet_name="Gender Wise", index=False)

    # Language-wise
    lang = report_data.get("language_wise", {})
    if lang:
        df_lang = pd.DataFrame(list(lang.items()), columns=["Language", "Count"])
        df_lang.to_excel(writer, sheet_name="Language Wise", index=False)

    # Missing records
    missing = report_data.get("missing_records", [])
    if missing:
        df_missing = pd.DataFrame(missing)
        df_missing.to_excel(writer, sheet_name="Missing Records", index=False)

    # Mismatch report
    mismatches = report_data.get("mismatch_report", [])
    if mismatches:
        df_mismatch = pd.DataFrame(mismatches)
        df_mismatch.to_excel(writer, sheet_name="Mismatch Report", index=False)

    writer.close()