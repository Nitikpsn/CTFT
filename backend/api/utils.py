import os
import glob
from fastapi import HTTPException

VALID_EXTENSIONS = (".xlsx", ".xls", ".csv")


def resolve_file(session_dir: str, prefix: str) -> str:
    pattern = os.path.join(session_dir, f"{prefix}.*")
    matches = glob.glob(pattern)
    if not matches:
        raise HTTPException(400, f"No file found for '{prefix}' in session")
    return matches[0]
