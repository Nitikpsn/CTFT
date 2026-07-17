import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings
from services.excel_parser import parse_excel
from services.stats_engine import compute_stats, class_wise_stats
from services.gemini_service import gemini_service
from api.utils import resolve_file

router = APIRouter(prefix="/api")

UPLOAD_DIR = settings.upload_dir


class ChatRequest(BaseModel):
    session_id: str
    query: str


@router.post("/chat")
def ai_chat(req: ChatRequest):
    session_dir = os.path.join(UPLOAD_DIR, req.session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    portal_path = resolve_file(session_dir, "portal")
    portal_records = parse_excel(portal_path, "portal", ai_fallback=gemini_service)

    normalized = gemini_service.normalize_query(req.query)
    classes = sorted(set(r["class_name"] for r in portal_records if r.get("class_name")))
    filter_dict = gemini_service.query_to_filter(req.query, classes)

    filtered = portal_records
    if filter_dict.get("gender"):
        filtered = [r for r in filtered if r.get("gender", "").strip().lower() == filter_dict["gender"].lower()]
    if filter_dict.get("category"):
        filtered = [r for r in filtered if r.get("category", "").strip().upper() == filter_dict["category"].upper()]
    if filter_dict.get("class_name"):
        filtered = [r for r in filtered if r.get("class_name", "").strip() == str(filter_dict["class_name"])]

    result = {
        "original_query": req.query,
        "normalized_query": normalized,
        "filter_applied": filter_dict,
        "total_records": len(filtered),
        "records": filtered[:50],
    }

    return result
