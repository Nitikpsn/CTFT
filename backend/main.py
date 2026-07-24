import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from api.upload import router as upload_router
from api.compare import router as compare_router
from api.reports import router as reports_router
from api.ai import router as ai_router

app = FastAPI(title="CTFT - Comparison Tool for Teachers", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(compare_router)
app.include_router(reports_router)
app.include_router(ai_router)


@app.get("/health")
def health():
    return {"status": "ok"}


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.normpath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
            return None

        requested_file = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(requested_file):
            return FileResponse(requested_file)

        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
