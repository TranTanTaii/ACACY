import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.config import IMAGES_DIR, STATIC_DIR
from app.database import engine, Base
from app.routes import products, import_excel

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ACACY Product Catalog & Image Search API",
    version="1.0.0",
    description="Hệ thống quản lý, import và tra cứu mã sản phẩm từ file Excel có hình ảnh mẫu."
)

# CORS setup for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount media directory for serving product images
app.mount("/media/images", StaticFiles(directory=str(IMAGES_DIR)), name="media-images")

# Register API routes
app.include_router(products.router)
app.include_router(import_excel.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ACACY Product Catalog"}

# Serve frontend build in production
if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
