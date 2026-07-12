import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings
from services.excel_parser import parse_excel
from services.comparator import compare
from services.stats_engine import compute_stats

router = APIRouter(prefix="/api")

UPLOAD_DIR = settings.upload_dir


class CompareRequest(BaseModel):
    session_id: str


@router.post("/compare")
async def run_comparison(req: CompareRequest):
    session_dir = os.path.join(UPLOAD_DIR, req.session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    files = [f for f in os.listdir(session_dir) if f.endswith((".xlsx", ".xls", ".csv"))]
    if len(files) < 2:
        raise HTTPException(400, "Need two files")

    school_path = os.path.join(session_dir, files[0])
    portal_path = os.path.join(session_dir, files[1])

    school_records = parse_excel(school_path, "school")
    portal_records = parse_excel(portal_path, "portal")

    result = compare(school_records, portal_records)

    return result


@router.get("/stats/{session_id}")
def get_stats(session_id: str):
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    files = [f for f in os.listdir(session_dir) if f.endswith((".xlsx", ".xls", ".csv"))]
    if not files:
        raise HTTPException(400, "No files found")

    portal_path = os.path.join(session_dir, files[1] if len(files) > 1 else files[0])
    portal_records = parse_excel(portal_path, "portal")
    stats = compute_stats(portal_records)

    return stats