import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
from config import settings
from services.excel_parser import parse_excel
from services.comparator import compare
from services.exporter import build_report_data, export_report_to_excel

router = APIRouter(prefix="/api")

UPLOAD_DIR = settings.upload_dir
REPORT_DIR = settings.report_dir
os.makedirs(REPORT_DIR, exist_ok=True)


class ReportRequest(BaseModel):
    session_id: str


@router.post("/reports")
def generate_report(req: ReportRequest):
    session_dir = os.path.join(UPLOAD_DIR, req.session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(404, "Session not found")

    files = sorted([f for f in os.listdir(session_dir) if f.endswith((".xlsx", ".xls", ".csv"))])
    if len(files) < 2:
        raise HTTPException(400, "Need two Excel files")

    school_path = os.path.join(session_dir, files[0])
    portal_path = os.path.join(session_dir, files[1])

    school_records = parse_excel(school_path, "school")
    portal_records = parse_excel(portal_path, "portal")

    comparison = compare(school_records, portal_records)
    report_data = build_report_data(portal_records, comparison)

    output_path = os.path.join(REPORT_DIR, f"report_{req.session_id}.xlsx")
    export_report_to_excel(report_data, output_path)

    return {
        "message": "Report generated",
        "download_url": f"/api/reports/download/{req.session_id}",
        "summary": {
            "total_portal": len(portal_records),
            "matched": comparison["matched"],
            "new": comparison["new"],
            "missing": comparison["missing"],
            "modified": comparison["modified"],
        },
    }


@router.get("/reports/download/{session_id}")
def download_report(session_id: str):
    path = os.path.join(REPORT_DIR, f"report_{session_id}.xlsx")
    if not os.path.exists(path):
        raise HTTPException(404, "Report not found")
    return FileResponse(path, filename=f"CBSE_KVS_Report_{session_id}.xlsx")