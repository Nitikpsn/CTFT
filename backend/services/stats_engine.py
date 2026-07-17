from collections import defaultdict
from typing import Any
from utils.normalize import CATEGORY_MAP, normalize_gender, normalize_class_label


CATEGORY_STATS_MAP = {
    "sc": "sc", "scheduled caste": "sc", "s.c.": "sc",
    "st": "st", "scheduled tribe": "st", "s.t.": "st",
    "obc": "obc", "other backward class": "obc", "o.b.c.": "obc",
    "ews": "ews", "economically weaker section": "ews",
    "general": "gen", "gen": "gen", "general category": "gen",
}


def compute_stats(records: list[dict[str, Any]]) -> dict[str, int]:
    stats = {
        "boys": 0, "girls": 0,
        "sc": 0, "obc": 0, "st": 0, "ews": 0, "gen": 0,
        "total": len(records),
    }

    for r in records:
        gender = normalize_gender(r.get("gender", "")).lower()
        if gender in ("boy", "male"):
            stats["boys"] += 1
        elif gender in ("girl", "female"):
            stats["girls"] += 1

        cat = r.get("category", "").strip().lower()
        mapped = CATEGORY_STATS_MAP.get(cat, "")
        if not mapped:
            cat_upper = r.get("category", "").strip().upper()
            if cat_upper in stats:
                mapped = cat_upper.lower()
        if mapped and mapped in stats:
            stats[mapped] += 1

    return stats


def class_wise_stats(records: list[dict[str, Any]]) -> dict[str, dict]:
    groups = defaultdict(lambda: {
        "boys": 0, "girls": 0, "total": 0,
        "sc": 0, "obc": 0, "st": 0, "ews": 0, "gen": 0,
    })
    for r in records:
        cls = str(normalize_class_label(r.get("class_name", "Unknown")))
        groups[cls]["total"] += 1

        gender = normalize_gender(r.get("gender", "")).lower()
        if gender in ("boy", "male"):
            groups[cls]["boys"] += 1
        elif gender in ("girl", "female"):
            groups[cls]["girls"] += 1

        cat = r.get("category", "").strip().lower()
        mapped = CATEGORY_STATS_MAP.get(cat, "")
        if not mapped:
            cat_upper = r.get("category", "").strip().upper()
            if cat_upper.lower() in ("sc", "obc", "st", "ews", "gen"):
                mapped = cat_upper.lower()
        if mapped and mapped in groups[cls]:
            groups[cls][mapped] += 1

    return dict(groups)


def language_wise_stats(records: list[dict[str, Any]]) -> dict[str, int]:
    counts = defaultdict(int)
    for r in records:
        lang = r.get("language", "Unknown") or "Unknown"
        counts[lang] += 1
    return dict(counts)
