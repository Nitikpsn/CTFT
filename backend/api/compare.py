import os, glob, json, asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from config import settings
from services.excel_parser import parse_excel
from services.comparator import compare
from services.stats_engine import compute_stats
from services.category_parser import parse_category_file
from services.category_comparator import compare_categories
from services.gemini_service import gemini_service

router = APIRouter(prefix="/api")

UPLOAD_DIR = settings.upload_dir

VALID_EXTENSIONS = (".xlsx", ".xls", ".csv")


def _resolve(session_dir: str, prefix: str) -> str:
    pattern = os.path.join(session_dir, f"{prefix}.*")
    matches = glob.glob(pattern)
    if not matches:
        raise HTTPException(400, f"No file found for '{prefix}' in session")
    return matches[0]


class CompareRequest(BaseModel):
    session_id: str


@router.post("/compare")
async def run_comparison(req: CompareRequest):
    session_dir = os.path.join(UPLOAD_DIR, req.session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    school_path = _resolve(session_dir, "school")
    portal_path = _resolve(session_dir, "portal")

    school_records = parse_excel(school_path, "school", ai_fallback=gemini_service)
    portal_records = parse_excel(portal_path, "portal", ai_fallback=gemini_service)

    result = compare(school_records, portal_records, ai_service=gemini_service)

    return result


async def _stream_compare(school_records, portal_records):
    events = []

    def callback(event_type: str, data: dict):
        events.append((event_type, dict(data)))

    loop = asyncio.get_event_loop()

    def run_compare():
        compare(school_records, portal_records, ai_service=gemini_service, stream_callback=callback)

    await loop.run_in_executor(None, run_compare)

    for event_type, data in events:
        yield f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
        await asyncio.sleep(0.01)

    yield f"event: complete\ndata: {json.dumps({'done': True})}\n\n"


@router.get("/compare/stream/{session_id}")
async def stream_comparison(session_id: str):
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    school_path = _resolve(session_dir, "school")
    portal_path = _resolve(session_dir, "portal")

    school_records = parse_excel(school_path, "school", ai_fallback=gemini_service)
    portal_records = parse_excel(portal_path, "portal", ai_fallback=gemini_service)

    return StreamingResponse(
        _stream_compare(school_records, portal_records),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/stats/{session_id}")
def get_stats(session_id: str):
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    portal_path = _resolve(session_dir, "portal")
    portal_records = parse_excel(portal_path, "portal", ai_fallback=gemini_service)
    stats = compute_stats(portal_records)

    return stats


@router.post("/compare/categories")
def run_category_comparison(req: CompareRequest):
    session_dir = os.path.join(UPLOAD_DIR, req.session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    school_path = _resolve(session_dir, "school")
    portal_path = _resolve(session_dir, "portal")

    school_data = parse_category_file(school_path, "school")
    govt_data = parse_category_file(portal_path, "portal")

    return compare_categories(school_data, govt_data)