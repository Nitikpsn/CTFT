import os, uuid, time
from fastapi import APIRouter, UploadFile, File, HTTPException
from config import settings
from services.excel_parser import parse_excel
from services.validator import validate_records
from services.gemini_service import gemini_service

router = APIRouter(prefix="/api")

ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".csv"}

UPLOAD_DIR = settings.upload_dir
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _validate_extension(filename: str):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )


@router.post("/upload")
async def upload(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    _validate_extension(file1.filename or "school.xlsx")
    _validate_extension(file2.filename or "portal.xlsx")

    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)

    ext1 = os.path.splitext(file1.filename or "school.xlsx")[1]
    ext2 = os.path.splitext(file2.filename or "portal.xlsx")[1]
    path1 = os.path.join(session_dir, f"school{ext1}")
    path2 = os.path.join(session_dir, f"portal{ext2}")

    with open(path1, "wb") as f:
        f.write(await file1.read())
    with open(path2, "wb") as f:
        f.write(await file2.read())

    school_records = parse_excel(path1, "school", ai_fallback=gemini_service)
    portal_records = parse_excel(path2, "portal", ai_fallback=gemini_service)

    errors = validate_records(school_records) + validate_records(portal_records)

    return {
        "session_id": session_id,
        "school_rows": len(school_records),
        "portal_rows": len(portal_records),
        "columns_mapped": list(school_records[0].keys()) if school_records else [],
        "errors": errors,
        "school_sample": school_records[:3] if school_records else [],
        "portal_sample": portal_records[:3] if portal_records else [],
    }


@router.get("/sessions")
def list_sessions():
    if not os.path.exists(UPLOAD_DIR):
        return {"sessions": []}
    sessions = []
    for sid in sorted(os.listdir(UPLOAD_DIR), reverse=True):
        sdir = os.path.join(UPLOAD_DIR, sid)
        if os.path.isdir(sdir):
            files = [f for f in os.listdir(sdir) if f.endswith((".xlsx", ".xls", ".csv"))]
            mtime = os.path.getmtime(sdir)
            sessions.append({
                "session_id": sid,
                "files": files,
                "created": time.strftime("%Y-%m-%d %H:%M", time.localtime(mtime)),
            })
    return {"sessions": sessions[:20]}
