import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pathlib import Path

from app.database import get_db
from app.config import TEMP_UPLOADS_DIR, BASE_DIR
from app.excel_parser import ExcelParser
from app.crud import bulk_upsert_products
from app.models import ImportLog

router = APIRouter(prefix="/api/import", tags=["import"])

@router.get("/workspace-files")
def get_workspace_files():
    """List Excel files found directly in workspace directory."""
    workspace = BASE_DIR.parent
    files = []
    for f in os.listdir(workspace):
        if f.lower().endswith(('.xlsx', '.xlsm')) and not f.startswith('~$'):
            full_path = os.path.join(workspace, f)
            size_mb = os.path.getsize(full_path) / (1024 * 1024)
            files.append({
                "name": f,
                "path": full_path,
                "size_mb": round(size_mb, 2)
            })
    return files

@router.post("/preview-local")
def preview_local_file(body: Dict[str, str] = Body(...)):
    """Preview sheets and image counts for a local Excel file."""
    file_path = body.get("path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File không tồn tại trên hệ thống")

    try:
        parser = ExcelParser(file_path)
        sheets = parser.get_sheets_preview()
        return {
            "filename": os.path.basename(file_path),
            "file_path": file_path,
            "sheets": sheets
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi khi đọc file Excel: {str(e)}")

@router.post("/upload-and-preview")
async def upload_and_preview(file: UploadFile = File(...)):
    """Upload an Excel file to temp directory and preview its sheets."""
    if not file.filename.lower().endswith(('.xlsx', '.xlsm')):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file định dạng .xlsx hoặc .xlsm")

    temp_path = TEMP_UPLOADS_DIR / file.filename
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        parser = ExcelParser(str(temp_path))
        sheets = parser.get_sheets_preview()
        return {
            "filename": file.filename,
            "file_path": str(temp_path),
            "sheets": sheets
        }
    except Exception as e:
        if temp_path.exists():
            os.remove(temp_path)
        raise HTTPException(status_code=400, detail=f"Lỗi khi xử lý file Excel: {str(e)}")

@router.post("/execute")
def execute_import(
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Execute extraction of products and images from selected sheets of the Excel file.
    """
    file_path = body.get("file_path")
    selected_sheets = body.get("selected_sheets") # List of sheet names or None for all
    update_existing = body.get("update_existing", True)

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File không tồn tại")

    parser = ExcelParser(file_path)
    all_sheets_info = parser.get_sheets_preview()
    all_sheet_names = [s["name"] for s in all_sheets_info]

    sheets_to_process = selected_sheets if selected_sheets else all_sheet_names

    total_inserted = 0
    total_updated = 0
    total_images_extracted = 0
    processed_sheets = []

    for sname in sheets_to_process:
        if sname not in all_sheet_names:
            continue
        try:
            products_data = parser.extract_sheet_data_and_images(sname)
            inserted, updated = bulk_upsert_products(db, products_data, update_existing=update_existing)
            images_count = len([p for p in products_data if p.get("image_url")])
            
            total_inserted += inserted
            total_updated += updated
            total_images_extracted += images_count

            processed_sheets.append({
                "sheet": sname,
                "rows_found": len(products_data),
                "inserted": inserted,
                "updated": updated,
                "images_extracted": images_count
            })
        except Exception as e:
            processed_sheets.append({
                "sheet": sname,
                "error": str(e)
            })

    # Log to import_logs
    log = ImportLog(
        filename=os.path.basename(file_path),
        sheet_name=", ".join(sheets_to_process[:5]),
        total_rows=total_inserted + total_updated,
        imported_rows=total_inserted,
        images_extracted=total_images_extracted,
        status="SUCCESS"
    )
    db.add(log)
    db.commit()

    return {
        "filename": os.path.basename(file_path),
        "total_inserted": total_inserted,
        "total_updated": total_updated,
        "total_images_extracted": total_images_extracted,
        "sheets": processed_sheets
    }
