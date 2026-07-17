import os, json, asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from config import settings
from services.excel_parser import parse_excel, detect_data_type
from services.comparator import compare
from services.stats_engine import compute_stats
from services.category_parser import parse_category_file
from services.category_comparator import compare_categories
from services.gemini_service import gemini_service
from api.utils import resolve_file

router = APIRouter(prefix="/api")

UPLOAD_DIR = settings.upload_dir


class CompareRequest(BaseModel):
    session_id: str


def _detect_and_compare(school_path: str, portal_path: str) -> dict:
    school_type = detect_data_type(school_path)
    portal_type = detect_data_type(portal_path)

    if school_type == "aggregate" or portal_type == "aggregate":
        school_data = parse_category_file(school_path, "school")
        govt_data = parse_category_file(portal_path, "portal")
        cat_result = compare_categories(school_data, govt_data)

        discrepancies = cat_result.get("discrepancies", [])
        modifications = []
        modified_count = 0
        for d in discrepancies:
            for metric_name, mv in d.get("metrics", {}).items():
                if mv.get("delta", 0) != 0:
                    modifications.append({
                        "class_id": d["class_id"],
                        "field_name": metric_name,
                        "old_value": str(mv.get("from", 0)),
                        "new_value": str(mv.get("to", 0)),
                        "record_name": f"Class {d['class_id']}",
                        "difference_type": "modified",
                    })
                    modified_count += 1

        school_agg = school_data.get("aggregated", {})
        govt_agg = govt_data.get("aggregated", {})
        school_classes = set(school_agg.keys())
        govt_classes = set(govt_agg.keys())
        missing_classes = school_classes - govt_classes
        new_classes = govt_classes - school_classes

        return {
            "data_type": "aggregate",
            "matched": len(school_classes & govt_classes),
            "missing": len(missing_classes),
            "modified": modified_count,
            "new": len(new_classes),
            "matched_ids": list(school_classes & govt_classes),
            "modifications": modifications,
            "new_records": [{"class_id": c, "source": "portal"} for c in sorted(new_classes)],
            "missing_records": [{"class_id": c, "source": "school"} for c in sorted(missing_classes)],
            "category_result": cat_result,
            "school_label": school_data.get("file_label", "School"),
            "portal_label": govt_data.get("file_label", "Portal"),
        }

    school_records = parse_excel(school_path, "school", ai_fallback=gemini_service)
    portal_records = parse_excel(portal_path, "portal", ai_fallback=gemini_service)

    result = compare(school_records, portal_records, ai_service=gemini_service)
    result["data_type"] = "student"
    return result


@router.post("/compare")
async def run_comparison(req: CompareRequest):
    session_dir = os.path.join(UPLOAD_DIR, req.session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    school_path = resolve_file(session_dir, "school")
    portal_path = resolve_file(session_dir, "portal")

    result = _detect_and_compare(school_path, portal_path)
    return result


async def _stream_compare(school_path: str, portal_path: str):
    events = []

    def callback(event_type: str, data: dict):
        events.append((event_type, dict(data)))

    loop = asyncio.get_event_loop()

    def run_compare():
        school_type = detect_data_type(school_path)
        portal_type = detect_data_type(portal_path)
        if school_type == "aggregate" or portal_type == "aggregate":
            return
        school_records = parse_excel(school_path, "school", ai_fallback=gemini_service)
        portal_records = parse_excel(portal_path, "portal", ai_fallback=gemini_service)
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

    school_path = resolve_file(session_dir, "school")
    portal_path = resolve_file(session_dir, "portal")

    return StreamingResponse(
        _stream_compare(school_path, portal_path),
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

    portal_path = resolve_file(session_dir, "portal")

    data_type = detect_data_type(portal_path)
    if data_type == "aggregate":
        portal_data = parse_category_file(portal_path, "portal")
        agg = portal_data.get("aggregated", {})
        stats = {
            "total": sum(d.get("total", 0) for d in agg.values()),
            "classes": len(agg),
        }
        for cat in ["general", "obc", "sc", "st", "boys", "girls", "cwsn", "rte", "sgc", "minority_total"]:
            stats[cat] = sum(d.get(cat, 0) for d in agg.values())
        return stats

    portal_records = parse_excel(portal_path, "portal", ai_fallback=gemini_service)
    stats = compute_stats(portal_records)
    return stats


@router.post("/compare/categories")
def run_category_comparison(req: CompareRequest):
    session_dir = os.path.join(UPLOAD_DIR, req.session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    school_path = resolve_file(session_dir, "school")
    portal_path = resolve_file(session_dir, "portal")

    school_data = parse_category_file(school_path, "school")
    govt_data = parse_category_file(portal_path, "portal")

    return compare_categories(school_data, govt_data)
