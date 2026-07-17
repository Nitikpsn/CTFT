import re
from rapidfuzz import fuzz

GENDER_MAP = {
    "male": "boy", "m": "boy", "boy": "boy",
    "male (boy)": "boy", "boy (m)": "boy",
    "लड़का": "boy", "बालक": "boy", "छात्र": "boy",
    "पुरुष": "boy", "b": "boy",
    "female": "girl", "f": "girl", "girl": "girl",
    "female (girl)": "girl", "girl (f)": "girl",
    "लड़की": "girl", "बालिका": "girl", "छात्रा": "girl",
    "महिला": "girl", "g": "girl",
}

CATEGORY_MAP = {
    "sc": "SC", "scheduled caste": "SC", "s.c.": "SC",
    "s c": "SC", "अनुसूचित जाति": "SC", "एस.सी.": "SC",
    "एससी": "SC",
    "st": "ST", "scheduled tribe": "ST", "s.t.": "ST",
    "s t": "ST", "अनुसूचित जनजाति": "ST", "एस.टी.": "ST",
    "एसटी": "ST",
    "obc": "OBC", "other backward class": "OBC", "o.b.c.": "OBC",
    "o b c": "OBC", "अन्य पिछड़ा वर्ग": "OBC",
    "ओ.बी.सी.": "OBC", "ओबीसी": "OBC",
    "ews": "EWS", "economically weaker section": "EWS",
    "e.w.s.": "EWS", "आर्थिक रूप से कमजोर": "EWS",
    "general": "GEN", "gen": "GEN", "general category": "GEN",
    "g general": "GEN", "सामान्य": "GEN", "जनरल": "GEN",
    "none": "GEN", "n/a": "GEN", "ur": "GEN",
    "unreserved": "GEN",
}

CATEGORY_ALIASES = {
    "general": ["सामान्य", "general", "gen", "general category", "जनरल", "unreserved", "ur"],
    "obc": ["अन्य पिछड़ा वर्ग", "obc", "other backward class", "o.b.c.", "ओ.बी.सी.", "ओबीसी"],
    "obc_cl": ["अन्य पिछड़ा वर्ग (सीएल)", "obc cl", "obc-cl", "obc (cl)", "obc-creamy layer"],
    "obc_ncl": ["अन्य पिछड़ा वर्ग (एनसीएल)", "obc ncl", "obc-ncl", "obc (ncl)", "obc-non creamy layer"],
    "sc": ["एस.सी.", "अनुसूचित जाति", "sc", "scheduled caste", "s.c.", "एससी"],
    "st": ["एस.टी.", "अनुसूचित जनजाति", "st", "scheduled tribe", "s.t.", "एसटी"],
    "muslim": ["मुस्लिम", "muslim", "इस्लाम"],
    "christian": ["क्रिस्चियन", "christian", "ईसाई"],
    "sikh": ["सिख", "sikh"],
    "buddhist": ["बुद्धिस्ट", "buddhist", "बौद्ध"],
    "parsi": ["पारसी", "parsi"],
    "jain": ["जैन", "jain"],
    "minority_total": ["अल्पसंख्यक", "minority", "अल्पसंख्यक कुल"],
    "cwsn": ["विकलांग", "cwsn", "divyang", "disabled", "विशेष आवश्यकता"],
    "rte": ["rte", "आरटीई", "शिक्षा का अधिकार"],
    "sgc": ["sgc", "एसजीसी"],
    "boys": ["छात्र", "boys", "male", "बालक", "पुरुष"],
    "girls": ["छात्रा", "girls", "female", "बालिका", "महिला"],
    "total": ["कुल", "योग", "total", "grand total", "संख्या", "कुल योग", "संख्या योग"],
}

ROMAN_MAP = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5,
    "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10,
    "xi": 11, "xii": 12,
    "xl": 40, "l": 50, "xc": 90, "c": 100,
}

CLASS_ORDER = {
    "nursery": -2, "nur": -2, "prep": -2,
    "lkg": -1, "lower kindergarten": -1,
    "ukg": 0, "upper kindergarten": 0,
    "pre-primary": -1, "pre primary": -1, "preprimary": -1,
}

LANGUAGE_MAP = {
    "hindi": "Hindi", "hi": "Hindi", "हिंदी": "Hindi",
    "english": "English", "en": "English", "अंग्रेज़ी": "English",
    "hindi/english": "Hindi/English", "both": "Hindi/English",
    "hindi & english": "Hindi/English", "hindi and english": "Hindi/English",
    "हिंदी/अंग्रेज़ी": "Hindi/English",
}


def normalize_gender(value: str) -> str:
    v = value.strip().lower()
    if not v:
        return ""
    return GENDER_MAP.get(v, value.strip().title())


def normalize_category(value: str) -> str:
    v = value.strip().lower()
    if not v:
        return ""
    return CATEGORY_MAP.get(v, value.strip().upper())


def normalize_language(value: str) -> str:
    v = value.strip().lower()
    if not v:
        return ""
    return LANGUAGE_MAP.get(v, value.strip().title())


def resolve_alias(label: str, threshold: float = 80) -> tuple[str | None, str | None]:
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
    clean = label.strip().lower().strip()
    if not clean:
        return ""

    clean = re.sub(r'\s*(class|grade|standard|cls|कक्षा|क्लास|वर्ग)\s*', '', clean).strip()

    if clean in CLASS_ORDER:
        return CLASS_ORDER[clean]
    if clean in ROMAN_MAP:
        return ROMAN_MAP[clean]

    try:
        return int(float(clean))
    except (ValueError, TypeError):
        return clean
