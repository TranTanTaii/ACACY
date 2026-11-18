import os
import shutil
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.config import IMAGES_DIR
from app.schemas import (
    ProductOut, ProductCreate, ProductUpdate,
    PaginatedProducts, ProductSuggestion, StatsSummary
)
from app import crud

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=PaginatedProducts)
def list_products(
    query: Optional[str] = Query(None, description="Search term for code, name, brand, or notes"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status_version: Optional[str] = Query(None, description="Filter by status version (MẪU MỚI, MẪU CŨ, KHUYẾN MÃI)"),
    has_image: Optional[bool] = Query(None, description="Filter products having or missing images"),
    sheet_name: Optional[str] = Query(None, description="Filter by sheet name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items, total = crud.get_products(
        db=db,
        query=query,
        brand=brand,
        category=category,
        status_version=status_version,
        has_image=has_image,
        sheet_name=sheet_name,
        page=page,
        page_size=page_size
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedProducts(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/suggest", response_model=List[ProductSuggestion])
def suggest_products(
    q: str = Query(..., min_length=1, description="Keyword for autocomplete"),
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db)
):
    return crud.get_product_suggestions(db, query=q, limit=limit)

@router.post("/batch-lookup", response_model=List[ProductOut])
def batch_lookup(codes: List[str], db: Session = Depends(get_db)):
    if not codes:
        return []
    clean_codes = [c.strip() for c in codes if c and c.strip()]
    if not clean_codes:
        return []
    from sqlalchemy import func
    from app.models import Product
    upper_set = {c.upper() for c in clean_codes}
    return db.query(Product).filter(func.upper(Product.code).in_(upper_set)).all()

@router.get("/stats", response_model=StatsSummary)
def get_stats(db: Session = Depends(get_db)):
    return crud.get_stats_summary(db)

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    return product

@router.post("", response_model=ProductOut)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    existing = crud.get_product_by_code(db, product_in.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"Mã sản phẩm '{product_in.code}' đã tồn tại")
    return crud.create_product(db, product_in)

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    product = crud.update_product(db, product_id, product_in)
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    success = crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    return {"message": "Đã xóa sản phẩm thành công", "id": product_id}

@router.post("/{product_id}/image", response_model=ProductOut)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    product = crud.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="File rỗng")

    img_hash = hashlib.md5(contents).hexdigest()
    ext = os.path.splitext(file.filename or "")[1].lower() or ".png"
    filename = f"{img_hash[:16]}{ext}"
    dest_path = IMAGES_DIR / filename

    with open(dest_path, "wb") as f:
        f.write(contents)

    product.image_filename = filename
    product.image_url = f"/media/images/{filename}"
    product.image_hash = img_hash
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}/image", response_model=ProductOut)
def remove_product_image(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    product.image_filename = None
    product.image_url = None
    product.image_hash = None
    db.commit()
    db.refresh(product)
    return product
