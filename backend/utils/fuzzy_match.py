from rapidfuzz import fuzz
from utils.normalize import normalize_class_label


ROMAN_TO_NUM = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5,
    "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10,
    "xi": 11, "xii": 12,
}


def fuzzy_match_score(str1: str, str2: str) -> float:
    s1 = str1.strip().lower()
    s2 = str2.strip().lower()
    if not s1 or not s2:
        return 0.0
    return fuzz.ratio(s1, s2) / 100.0


def partial_match_score(str1: str, str2: str) -> float:
    s1 = str1.strip().lower()
    s2 = str2.strip().lower()
    if not s1 or not s2:
        return 0.0
    return fuzz.partial_ratio(s1, s2) / 100.0


def token_sort_score(str1: str, str2: str) -> float:
    s1 = str1.strip().lower()
    s2 = str2.strip().lower()
    if not s1 or not s2:
        return 0.0
    return fuzz.token_sort_ratio(s1, s2) / 100.0


def token_set_score(str1: str, str2: str) -> float:
    s1 = str1.strip().lower()
    s2 = str2.strip().lower()
    if not s1 or not s2:
        return 0.0
    return fuzz.token_set_ratio(s1, s2) / 100.0


def is_fuzzy_match(str1: str, str2: str, threshold: float = 0.85) -> bool:
    return fuzzy_match_score(str1, str2) >= threshold


def _normalize_class_for_match(class_str: str) -> str:
    val = normalize_class_label(class_str.strip())
    if isinstance(val, int):
        return str(val)
    return str(val).strip().lower()


def multi_field_score(record_a: dict, record_b: dict) -> float:
    name_a = record_a.get("student_name", "")
    name_b = record_b.get("student_name", "")
    name_score = max(
        fuzzy_match_score(name_a, name_b),
        partial_match_score(name_a, name_b),
        token_sort_score(name_a, name_b),
        token_set_score(name_a, name_b),
    )

    cls_a = _normalize_class_for_match(record_a.get("class_name", ""))
    cls_b = _normalize_class_for_match(record_b.get("class_name", ""))
    if cls_a and cls_b:
        class_score = 1.0 if cls_a == cls_b else 0.0
    else:
        class_score = 0.5

    gen_a = record_a.get("gender", "").strip().lower()
    gen_b = record_b.get("gender", "").strip().lower()
    if gen_a and gen_b:
        gender_score = 1.0 if gen_a == gen_b else 0.0
    else:
        gender_score = 0.5

    cat_a = record_a.get("category", "").strip().upper()
    cat_b = record_b.get("category", "").strip().upper()
    if cat_a and cat_b:
        category_score = 1.0 if cat_a == cat_b else 0.0
    else:
        category_score = 0.5

    return (name_score * 0.50) + (class_score * 0.20) + (gender_score * 0.15) + (category_score * 0.15)


def find_best_match(name: str, candidates: list[str], threshold: float = 0.8):
    best_score = 0.0
    best_match = None
    for candidate in candidates:
        score = fuzzy_match_score(name, candidate)
        if score > best_score:
            best_score = score
            best_match = candidate
    if best_score >= threshold:
        return best_match, best_score
    return None, 0.0
