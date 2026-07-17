import pandas as pd
from typing import Any
from services.stats_engine import class_wise_stats, language_wise_stats, compute_stats


def build_report_data(portal_records: list[dict], comparison: dict) -> dict[str, Any]:
    portal_stats = compute_stats(portal_records)
    class_stats = class_wise_stats(portal_records)
    lang_stats = language_wise_stats(portal_records)

    missing_records = comparison.get("missing_records", [])
    modifications = comparison.get("modifications", [])
    new_records = comparison.get("new_records", [])
    fuzzy_matched = comparison.get("fuzzy_matched", [])

    summary = {
        "total_school": comparison.get("matched", 0) + comparison.get("missing", 0),
        "total_portal": comparison.get("matched", 0) + comparison.get("new", 0),
        "matched": comparison.get("matched", 0),
        "missing": comparison.get("missing", 0),
        "modified": comparison.get("modified", 0),
        "new": comparison.get("new", 0),
        "fuzzy_matched": len(fuzzy_matched),
    }

    return {
        "summary": summary,
        "class_wise": class_stats,
        "category_wise": {
            "SC": portal_stats.get("sc", 0),
            "ST": portal_stats.get("st", 0),
            "OBC": portal_stats.get("obc", 0),
            "EWS": portal_stats.get("ews", 0),
            "GEN": portal_stats.get("gen", 0),
        },
        "gender_wise": {
            "Boys": portal_stats.get("boys", 0),
            "Girls": portal_stats.get("girls", 0),
        },
        "language_wise": lang_stats,
        "missing_records": missing_records,
        "new_records": new_records,
        "mismatch_report": modifications,
        "fuzzy_matched": fuzzy_matched,
    }


def export_report_to_excel(report_data: dict[str, Any], output_path: str):
    writer = pd.ExcelWriter(output_path, engine="openpyxl")

    summary = report_data.get("summary", {})
    if summary:
        df_summary = pd.DataFrame(
            list(summary.items()), columns=["Metric", "Count"]
        )
        df_summary.to_excel(writer, sheet_name="Summary", index=False)

    cw = report_data.get("class_wise", {})
    if cw:
        df_class = pd.DataFrame.from_dict(cw, orient="index")
        df_class.index.name = "Class"
        df_class.to_excel(writer, sheet_name="Class Wise")

    cat = report_data.get("category_wise", {})
    if cat:
        df_cat = pd.DataFrame(list(cat.items()), columns=["Category", "Count"])
        df_cat.to_excel(writer, sheet_name="Category Wise", index=False)

    gen = report_data.get("gender_wise", {})
    if gen:
        df_gen = pd.DataFrame(list(gen.items()), columns=["Gender", "Count"])
        df_gen.to_excel(writer, sheet_name="Gender Wise", index=False)

    lang = report_data.get("language_wise", {})
    if lang:
        df_lang = pd.DataFrame(list(lang.items()), columns=["Language", "Count"])
        df_lang.to_excel(writer, sheet_name="Language Wise", index=False)

    missing = report_data.get("missing_records", [])
    if missing:
        safe_missing = [{k: v for k, v in r.items() if k != "extra_fields"} for r in missing]
        df_missing = pd.DataFrame(safe_missing)
        df_missing.to_excel(writer, sheet_name="Missing Records", index=False)

    new_recs = report_data.get("new_records", [])
    if new_recs:
        safe_new = [{k: v for k, v in r.items() if k != "extra_fields"} for r in new_recs]
        df_new = pd.DataFrame(safe_new)
        df_new.to_excel(writer, sheet_name="New Records", index=False)

    mismatches = report_data.get("mismatch_report", [])
    if mismatches:
        safe_mismatches = [{k: v for k, v in r.items() if k != "extra_fields"} for r in mismatches]
        df_mismatch = pd.DataFrame(safe_mismatches)
        df_mismatch.to_excel(writer, sheet_name="Mismatch Report", index=False)

    fuzzy = report_data.get("fuzzy_matched", [])
    if fuzzy:
        df_fuzzy = pd.DataFrame(fuzzy)
        df_fuzzy.to_excel(writer, sheet_name="Fuzzy Matched", index=False)

    writer.close()
