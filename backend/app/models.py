from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from datetime import datetime
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    brand = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    packaging = Column(String(100), nullable=True)
    volume = Column(String(100), nullable=True)
    status_version = Column(String(100), nullable=True, index=True) # MẪU MỚI, MẪU CŨ, CHUẨN...
    notes = Column(Text, nullable=True)
    
    # Image references
    image_filename = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    image_hash = Column(String(64), nullable=True, index=True) # MD5 to prevent dupes
    
    # Source tracking
    sheet_name = Column(String(100), nullable=True, index=True)
    source_file = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_product_code_brand", "code", "brand"),
    )

class ImportLog(Base):
    __tablename__ = "import_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    sheet_name = Column(String(100), nullable=True)
    total_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    images_extracted = Column(Integer, default=0)
    status = Column(String(50), default="SUCCESS")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
