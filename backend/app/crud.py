import unicodedata
import re
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc, asc
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime

from app.models import Product, ImportLog
from app.schemas import ProductCreate, ProductUpdate

def remove_accents(input_str: str) -> str:
    """Normalize Vietnamese accents to plain ASCII characters for robust search."""
    if not input_str:
        return ""
    nfkd = unicodedata.normalize('NFKD', input_str)
    clean = "".join([c for c in nfkd if not unicodedata.combining(c)])
    clean = clean.replace('đ', 'd').replace('Đ', 'D')
    return clean

def tokenize_query(query: str) -> List[str]:
    """Split search query into clean tokens by space, underscore, dash."""
    clean = remove_accents(query.strip())
    # Split by spaces, underscores, dashes
    tokens = [t.strip() for t in re.split(r'[\s_\-]+', clean) if len(t.strip()) > 0]
    return tokens

def get_products(
    db: Session,
    query: Optional[str] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    status_version: Optional[str] = None,
    has_image: Optional[bool] = None,
    sheet_name: Optional[str] = None,
    page: int = 1,
    page_size: int = 24
) -> Tuple[List[Product], int]:
    q = db.query(Product)

    if query and query.strip():
        q_raw = query.strip()
        raw_filter = f"%{q_raw}%"
        tokens = tokenize_query(q_raw)

        if len(tokens) <= 1:
            q = q.filter(
                or_(
                    Product.code.ilike(raw_filter),
                    Product.name.ilike(raw_filter),
                    Product.brand.ilike(raw_filter),
                    Product.category.ilike(raw_filter),
                    Product.notes.ilike(raw_filter)
                )
            )
        else:
            token_conditions = []
            for tok in tokens:
                tok_filter = f"%{tok}%"
                token_conditions.append(
                    or_(
                        Product.code.ilike(tok_filter),
                        Product.name.ilike(tok_filter),
                        Product.brand.ilike(tok_filter),
                        Product.category.ilike(tok_filter),
                        Product.volume.ilike(tok_filter),
                        Product.notes.ilike(tok_filter)
                    )
                )
            q = q.filter(
                or_(
                    Product.code.ilike(raw_filter),
                    Product.name.ilike(raw_filter),
                    and_(*token_conditions)
                )
            )

    if brand:
        brand_clean = brand.strip()
        q = q.filter(
            or_(
                Product.brand == brand_clean,
                Product.code.ilike(f"{brand_clean}_%"),
                Product.code.ilike(f"%_{brand_clean}_%")
            )
        )

    if category:
        q = q.filter(Product.category == category)

    if status_version:
        sv_upper = status_version.upper()
        if "KM" in sv_upper or "KHUYẾN MÃI" in sv_upper:
            q = q.filter(
                or_(
                    Product.status_version.ilike("%KM%"),
                    Product.status_version.ilike("%KHUYẾN MÃI%"),
                    Product.status_version.ilike("%KHUYEN MAI%"),
                    Product.code.ilike("%_KM%"),
                    Product.code.ilike("%KM")
                )
            )
        elif "MỚI" in sv_upper or "NEW" in sv_upper:
            q = q.filter(
                or_(
                    Product.status_version.ilike("%MỚI%"),
                    Product.status_version.ilike("%MOI%"),
                    Product.status_version.ilike("%NEW%"),
                    Product.code.ilike("NEW_%")
                )
            )
        elif "CŨ" in sv_upper or "OLD" in sv_upper:
            q = q.filter(
                or_(
                    Product.status_version.ilike("%CŨ%"),
                    Product.status_version.ilike("%CU%"),
                    Product.status_version.ilike("%OLD%"),
                    Product.code.ilike("OLD_%")
                )
            )
        else:
            q = q.filter(Product.status_version == status_version)

    if has_image is not None:
        if has_image:
            q = q.filter(Product.image_url.isnot(None), Product.image_url != "")
        else:
            q = q.filter(or_(Product.image_url.is_(None), Product.image_url == ""))

    if sheet_name:
        q = q.filter(Product.sheet_name == sheet_name)

    total = q.count()
    
    if query and query.strip():
        q_raw = query.strip()
        # Prioritize exact code, then prefix match, then alphabetical
        items = q.order_by(
            desc(Product.code == q_raw),
            desc(Product.code.ilike(f"{q_raw}%")),
            asc(Product.code)
        ).offset((page - 1) * page_size).limit(page_size).all()
    else:
        # Order by code ascending
        items = q.order_by(asc(Product.code)).offset((page - 1) * page_size).limit(page_size).all()
    return items, total

def get_product_suggestions(db: Session, query: str, limit: int = 12) -> List[Dict[str, Any]]:
    if not query or len(query.strip()) < 1:
        return []
    
    q_raw = query.strip()
    raw_filter = f"%{q_raw}%"
    tokens = tokenize_query(q_raw)

    q = db.query(
        Product.id,
        Product.code,
        Product.brand,
        Product.category,
        Product.status_version,
        Product.image_url
    )

    if len(tokens) <= 1:
        q = q.filter(
            or_(
                Product.code.ilike(raw_filter),
                Product.name.ilike(raw_filter),
                Product.brand.ilike(raw_filter)
            )
        )
    else:
        token_conditions = []
        for tok in tokens:
            tok_filter = f"%{tok}%"
            token_conditions.append(
                or_(
                    Product.code.ilike(tok_filter),
                    Product.name.ilike(tok_filter),
                    Product.brand.ilike(tok_filter),
                    Product.category.ilike(tok_filter),
                    Product.volume.ilike(tok_filter)
                )
            )
        q = q.filter(
            or_(
                Product.code.ilike(raw_filter),
                Product.name.ilike(raw_filter),
                and_(*token_conditions)
            )
        )

    results = q.order_by(
        desc(Product.code == q_raw),
        desc(Product.code.ilike(f"{q_raw}%")),
        asc(Product.code)
    ).limit(limit).all()

    suggestions = []
    for r in results:
        suggestions.append({
            "id": r.id,
            "code": r.code,
            "brand": r.brand,
            "category": r.category,
            "status_version": r.status_version,
            "has_image": bool(r.image_url),
            "image_url": r.image_url
        })
    return suggestions

def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()

def get_product_by_code(db: Session, code: str) -> Optional[Product]:
    return db.query(Product).filter(Product.code == code).first()

def create_product(db: Session, product_in: ProductCreate) -> Product:
    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_in: ProductUpdate) -> Optional[Product]:
    db_product = get_product_by_id(db, product_id)
    if not db_product:
        return None
    
    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db_product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product_by_id(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True

def get_stats_summary(db: Session) -> Dict[str, Any]:
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_with_images = db.query(func.count(Product.id)).filter(Product.image_url.isnot(None), Product.image_url != "").scalar() or 0
    total_without_images = total_products - total_with_images

    # Distinct brands
    brands_count = db.query(func.count(func.distinct(Product.brand))).scalar() or 0

    # Top brands (up to 50 brands)
    top_brands_query = db.query(
        Product.brand,
        func.count(Product.id).label("count")
    ).filter(Product.brand.isnot(None), Product.brand != "").group_by(Product.brand).order_by(desc("count")).limit(50).all()

    top_brands = [{"brand": b[0], "count": b[1]} for b in top_brands_query]

    return {
        "total_products": total_products,
        "total_with_images": total_with_images,
        "total_without_images": total_without_images,
        "total_brands": brands_count,
        "top_brands": top_brands
    }

def bulk_upsert_products(db: Session, products_data: List[Dict[str, Any]], update_existing: bool = True) -> Tuple[int, int]:
    """Insert or update parsed product records."""
    inserted = 0
    updated = 0

    for item in products_data:
        code = item.get("code")
        if not code:
            continue

        existing = db.query(Product).filter(Product.code == code).first()
        if existing:
            if update_existing:
                for k, v in item.items():
                    # Only overwrite image if current item has an image or existing doesn't
                    if k in ["image_url", "image_filename", "image_hash"] and v is None and existing.image_url:
                        continue
                    setattr(existing, k, v)
                existing.updated_at = datetime.utcnow()
                updated += 1
        else:
            db_product = Product(**item)
            db.add(db_product)
            inserted += 1

    db.commit()
    return inserted, updated
