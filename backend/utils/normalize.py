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