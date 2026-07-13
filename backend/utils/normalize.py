from rapidfuzz import fuzz

GENDER_MAP = {
    "male": "boy", "m": "boy", "boy": "boy",
    "लड़का": "boy",
    "female": "girl", "f": "girl", "girl": "girl",
    "लड़की": "girl",
    "male (boy)": "boy",
    "female (girl)": "girl",
}

CATEGORY_MAP = {
    "sc": "SC", "scheduled caste": "SC", "s.c.": "SC",
    "अनुसूचित जाति": "SC",
    "st": "ST", "scheduled tribe": "ST", "s.t.": "ST",
    "अनुसूचित जनजाति": "ST",
    "obc": "OBC", "other backward class": "OBC", "o.b.c.": "OBC",
    "अन्य पिछड़ा वर्ग": "OBC",
    "ews": "EWS", "economically weaker section": "EWS",
    "आर्थिक रूप से कमजोर": "EWS",
    "general": "GEN", "gen": "GEN", "general category": "GEN",
    "सामान्य": "GEN",
    "none": "GEN", "n/a": "GEN",
}

CATEGORY_ALIASES = {
    "general": ["सामान्य", "general", "gen", "general category"],
    "obc": ["अन्य पिछड़ा वर्ग", "obc", "other backward class", "o.b.c."],
    "obc_cl": ["अन्य पिछड़ा वर्ग (सीएल)", "obc cl", "obc-cl", "obc (cl)"],
    "obc_ncl": ["अन्य पिछड़ा वर्ग (एनसीएल)", "obc ncl", "obc-ncl", "obc (ncl)"],
    "sc": ["एस.सी.", "अनुसूचित जाति", "sc", "scheduled caste", "s.c."],
    "st": ["एस.टी.", "अनुसूचित जनजाति", "st", "scheduled tribe", "s.t."],
    "muslim": ["मुस्लिम", "muslim"],
    "christian": ["क्रिस्चियन", "christian"],
    "sikh": ["सिख", "sikh"],
    "buddhist": ["बुद्धिस्ट", "buddhist"],
    "parsi": ["पारसी", "parsi"],
    "jain": ["जैन", "jain"],
    "minority_total": ["अल्पसंख्यक", "minority"],
    "cwsn": ["विकलांग", "cwsn", "divyang", "disabled"],
    "rte": ["rte"],
    "sgc": ["sgc"],
    "boys": ["छात्र", "boys", "male", "बालक"],
    "girls": ["छात्रा", "girls", "female", "बालिका"],
    "total": ["कुल", "योग", "total", "grand total", "संख्या", "कुल योग"],
}

ROMAN_TO_NUM = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5,
    "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10,
    "xi": 11, "xii": 12,
}

CLASS_ORDER = {
    "nursery": -2, "lkg": -1, "ukg": 0,
    "pre-primary": -1, "pre primary": -1, "preprimary": -1,
}

LANGUAGE_MAP = {
    "hindi": "Hindi", "hi": "Hindi", "हिंदी": "Hindi",
    "english": "English", "en": "English", "अंग्रेज़ी": "English",
    "hindi/english": "Hindi/English", "both": "Hindi/English",
    "hindi & english": "Hindi/English",
}


def normalize_gender(value: str) -> str:
    return GENDER_MAP.get(value.strip().lower(), value.strip().title())


def normalize_category(value: str) -> str:
    return CATEGORY_MAP.get(value.strip().lower(), value.strip().upper())


def normalize_language(value: str) -> str:
    return LANGUAGE_MAP.get(value.strip().lower(), value.strip().title())


def resolve_alias(label: str, threshold: float = 85) -> tuple[str | None, str | None]:
    clean = label.strip().lower()
    if not clean:
        return None, None

    for canonical, aliases in CATEGORY_ALIASES.items():
        if clean == canonical.lower():
            return canonical, canonical
        for alias in aliases:
            if clean == alias.lower():
                return canonical, alias

    for canonical, aliases in CATEGORY_ALIASES.items():
        for alias in aliases:
            score = fuzz.partial_ratio(clean, alias.lower())
            if score >= threshold:
                return canonical, alias
    return None, None


def normalize_class_label(label: str) -> int | str:
    clean = label.strip().lower()
    if clean in CLASS_ORDER:
        return CLASS_ORDER[clean]
    if clean in ROMAN_TO_NUM:
        return ROMAN_TO_NUM[clean]
    try:
        return int(clean)
    except ValueError:
        return clean
