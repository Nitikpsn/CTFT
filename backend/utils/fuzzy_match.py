from rapidfuzz import fuzz


def fuzzy_match_score(str1: str, str2: str) -> float:
    return fuzz.ratio(str1.strip().lower(), str2.strip().lower()) / 100.0


def is_fuzzy_match(str1: str, str2: str, threshold: float = 0.85) -> bool:
    return fuzzy_match_score(str1, str2) >= threshold


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