from collections import defaultdict
from typing import Any


def compute_stats(records: list[dict[str, Any]]) -> dict[str, int]:
    stats = {
        "boys": 0, "girls": 0,
        "sc": 0, "obc": 0, "st": 0, "ews": 0, "gen": 0,
        "total": len(records),
    }

    for r in records:
        gender = r.get("gender", "").strip().lower()
        if gender in ("boy", "male"):
            stats["boys"] += 1
        elif gender in ("girl", "female"):
            stats["girls"] += 1

        cat = r.get("category", "").strip().upper()
        if cat in stats:
            stats[cat] += 1

    return stats


def class_wise_stats(records: list[dict[str, Any]]) -> dict[str, dict]:
    groups = defaultdict(lambda: {"boys": 0, "girls": 0, "total": 0})
    for r in records:
        cls = r.get("class_name", "Unknown")
        gender = r.get("gender", "").strip().lower()
        groups[cls]["total"] += 1
        if gender in ("boy", "male"):
            groups[cls]["boys"] += 1
        elif gender in ("girl", "female"):
            groups[cls]["girls"] += 1
    return dict(groups)


def language_wise_stats(records: list[dict[str, Any]]) -> dict[str, int]:
    counts = defaultdict(int)
    for r in records:
        lang = r.get("language", "Unknown")
        counts[lang] += 1
    return dict(counts)