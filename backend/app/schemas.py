from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    code: str = Field(..., description="Mã nhãn sản phẩm")
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    packaging: Optional[str] = None
    volume: Optional[str] = None
    status_version: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    sheet_name: Optional[str] = None
    source_file: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    packaging: Optional[str] = None
    volume: Optional[str] = None
    status_version: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None

class ProductOut(ProductBase):
    id: int
    image_filename: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProductSuggestion(BaseModel):
    id: int
    code: str
    brand: Optional[str] = None
    category: Optional[str] = None
    status_version: Optional[str] = None
    has_image: bool = False
    image_url: Optional[str] = None

class PaginatedProducts(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    page_size: int
    total_pages: int

class StatsSummary(BaseModel):
    total_products: int
    total_with_images: int
    total_without_images: int
    total_brands: int
    top_brands: List[dict]

class SheetPreview(BaseModel):
    name: str
    row_count: int
    has_images: bool
    image_count: int

class ImportExcelPreview(BaseModel):
    filename: str
    sheets: List[SheetPreview]

class ImportRequest(BaseModel):
    file_path: str
    selected_sheets: Optional[List[str]] = None
    update_existing: bool = True
