import os
import re
import zipfile
import hashlib
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import openpyxl

from app.config import IMAGES_DIR

# Known brands mapping for smart recognition
KNOWN_BRANDS = [
    "OMO", "COMFORT", "SUNLIGHT", "SURF", "CLEAR", "DOVE", "SUNSILK",
    "LIFEBUOY", "LUX", "HAZELINE", "CLOSEUP", "PS", "VIM", "SIMPLE",
    "POND", "PONDS", "VASELINE", "TRESEMME", "TRESEME", "KNORR",
    "PEPSI", "TEA+", "AQUAFINA", "STING", "TWISTER", "7UP", "MIRINDA",
    "COCA-COLA", "FANTA", "SPRITE", "STRONGBOW", "EDELWEISS", "HEINEKEN", "TIGER",
    "ABBOTT", "SIMILAC", "ENSURE", "GLUCERNA", "PEDIASURE", "GROW", "PROSURE", "VITAL"
]

CATEGORY_MAP = {
    "NG": "Nước giặt",
    "BG": "Bột giặt",
    "NXV": "Nước xả vải",
    "NRC": "Nước rửa chén",
    "NLS": "Nước lau sàn",
    "DG": "Dầu gội",
    "DX": "Dầu xả",
    "ST": "Sữa tắm",
    "KDR": "Kem đánh răng",
    "BCR": "Bàn chải răng",
    "NTT": "Nước tẩy trang",
    "SDT": "Sữa dưỡng thể",
    "SRM": "Sữa rửa mặt",
    "NT": "Nước tẩy"
}

def parse_sku_details(code: str, fallback_brand: Optional[str] = None) -> Dict[str, Any]:
    """Smart parser that extracts Brand, Category, Packaging, Volume and Version from SKU code."""
    c = code.strip().upper()
    
    # 1. Version / Status detection
    status = "CHUẨN"
    if c.startswith("NEW_") or "_NEW_" in c or "MẪU MỚI" in c:
        status = "MẪU MỚI"
    elif c.startswith("OLD_") or "_OLD_" in c or "MẪU CŨ" in c:
        status = "MẪU CŨ"
    
    if "_KM" in c or "KHUYẾN MÃI" in c:
        status = "KHUYẾN MÃI" if status == "CHUẨN" else f"{status} (KM)"

    # 2. Brand detection
    brand = fallback_brand
    for b in KNOWN_BRANDS:
        # Match word boundary or underscore
        pattern = rf"(^|[_\s]){re.escape(b)}([_\s]|$)"
        if re.search(pattern, c):
            brand = b
            break
            
    # 3. Category detection
    category = None
    for code_cat, full_cat in CATEGORY_MAP.items():
        pattern = rf"(^|[_\s]){re.escape(code_cat)}([_\s]|$)"
        if re.search(pattern, c):
            category = f"{code_cat} ({full_cat})"
            break

    # 4. Packaging detection (CHAI, LON, TUI, CAN, HOP, ONG, THUNG, PACK...)
    packaging = None
    pack_match = re.search(r"\b(CHAI|LON|TUI|CAN|HOP|HỘP|ONG|ỐNG|THUNG|THÙNG|PACK_\d+|VIEN|VIÊN)\b", c)
    if pack_match:
        packaging = pack_match.group(1)

    # 5. Volume / Weight detection (e.g. 380G, 630ML, 1.4KG, 500ML/880ML...)
    volume = None
    vol_match = re.search(r"(\d+(\.\d+)?\s*(KG|G|ML|L)(/\d+(\.\d+)?\s*(KG|G|ML|L))?)", c)
    if vol_match:
        volume = vol_match.group(1)

    # Human-friendly readable name
    name = c.replace("_", " ").title()

    return {
        "name": name,
        "brand": brand,
        "category": category,
        "packaging": packaging,
        "volume": volume,
        "status_version": status
    }

class ExcelParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.filename = os.path.basename(file_path)

    def get_sheets_preview(self) -> List[Dict[str, Any]]:
        """Quickly inspect workbook to list sheet names and image counts."""
        previews = []
        with zipfile.ZipFile(self.file_path, 'r') as z:
            wb_xml = ET.fromstring(z.read('xl/workbook.xml'))
            sheets = wb_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')
            
            wb_rels_xml = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
            rId_to_target = {}
            for r in wb_rels_xml.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                rId_to_target[r.attrib['Id']] = r.attrib['Target']

            for s in sheets:
                sname = s.attrib.get('name')
                s_rid = s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                sheet_target = rId_to_target.get(s_rid, '')
                sheet_file = 'xl/' + sheet_target.lstrip('/')
                
                # Check rels for drawing
                rels_file = 'xl/worksheets/_rels/' + os.path.basename(sheet_file) + '.rels'
                has_drawing = False
                img_count = 0
                
                if rels_file in z.namelist():
                    s_rels = ET.fromstring(z.read(rels_file))
                    for rel in s_rels.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                        if 'drawing' in rel.attrib.get('Type', ''):
                            d_target = rel.attrib['Target']
                            d_file = 'xl/' + os.path.normpath(os.path.join('worksheets', d_target)).replace('\\', '/')
                            d_rels_file = 'xl/drawings/_rels/' + os.path.basename(d_file) + '.rels'
                            if d_rels_file in z.namelist():
                                d_rels = ET.fromstring(z.read(d_rels_file))
                                img_count = len([r for r in d_rels.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship') if 'image' in r.attrib.get('Type', '')])
                                has_drawing = True
                            break

                previews.append({
                    "name": sname,
                    "has_images": has_drawing and img_count > 0,
                    "image_count": img_count
                })

        return previews

    def extract_sheet_data_and_images(self, sheet_name: str) -> List[Dict[str, Any]]:
        """
        Extract rows and mapped images for a specific sheet.
        Returns a list of parsed product dicts ready to insert into the database.
        """
        row_images: Dict[int, str] = {} # row_idx (1-based) -> image_url

        with zipfile.ZipFile(self.file_path, 'r') as z:
            # 1. Map sheet name to xml file
            wb_xml = ET.fromstring(z.read('xl/workbook.xml'))
            wb_rels_xml = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
            rId_to_target = {r.attrib['Id']: r.attrib['Target'] for r in wb_rels_xml.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')}

            target_sheet_file = None
            for s in wb_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
                if s.attrib.get('name') == sheet_name:
                    s_rid = s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                    target_sheet_file = 'xl/' + rId_to_target[s_rid].lstrip('/')
                    break

            if not target_sheet_file or target_sheet_file not in z.namelist():
                return []

            # 2. Check for drawing rels
            rels_file = 'xl/worksheets/_rels/' + os.path.basename(target_sheet_file) + '.rels'
            if rels_file in z.namelist():
                s_rels = ET.fromstring(z.read(rels_file))
                drawing_target = None
                for rel in s_rels.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                    if 'drawing' in rel.attrib.get('Type', ''):
                        drawing_target = rel.attrib['Target']
                        break

                if drawing_target:
                    drawing_path = 'xl/' + os.path.normpath(os.path.join('worksheets', drawing_target)).replace('\\', '/')
                    drawing_rels_path = 'xl/drawings/_rels/' + os.path.basename(drawing_path) + '.rels'

                    # Map rId -> image path inside zip
                    rId_to_img_zip = {}
                    if drawing_rels_path in z.namelist():
                        d_rels_xml = ET.fromstring(z.read(drawing_rels_path))
                        for r in d_rels_xml.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                            if 'image' in r.attrib.get('Type', ''):
                                img_target = r.attrib['Target']
                                full_img_zip_path = 'xl/' + os.path.normpath(os.path.join('drawings', img_target)).replace('\\', '/')
                                rId_to_img_zip[r.attrib['Id']] = full_img_zip_path

                    # Parse drawing anchors to map row -> image
                    if drawing_path in z.namelist():
                        drawing_xml = ET.fromstring(z.read(drawing_path))
                        anchors = drawing_xml.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing}twoCellAnchor') + \
                                  drawing_xml.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing}oneCellAnchor')

                        for anchor in anchors:
                            from_elem = anchor.find('{http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing}from')
                            blip = anchor.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
                            if from_elem is not None and blip is not None:
                                r_text = from_elem.findtext('{http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing}row')
                                if r_text is not None:
                                    row_idx = int(r_text) + 1  # 1-based row index
                                    embed_id = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                                    if embed_id and embed_id in rId_to_img_zip:
                                        img_zip_file = rId_to_img_zip[embed_id]
                                        if img_zip_file in z.namelist():
                                            # Read image bytes and save to disk
                                            img_data = z.read(img_zip_file)
                                            img_hash = hashlib.md5(img_data).hexdigest()
                                            ext = os.path.splitext(img_zip_file)[1].lower() or ".png"
                                            dest_filename = f"{img_hash[:16]}{ext}"
                                            dest_path = IMAGES_DIR / dest_filename
                                            
                                            # Write if not already exists (deduplication)
                                            if not dest_path.exists():
                                                with open(dest_path, "wb") as f_img:
                                                    f_img.write(img_data)
                                            
                                            image_url = f"/media/images/{dest_filename}"
                                            row_images[row_idx] = (dest_filename, image_url, img_hash)

        # 3. Read spreadsheet data using openpyxl (read_only for high performance)
        products = []
        wb = openpyxl.load_workbook(self.file_path, read_only=True, data_only=True)
        if sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            for r_idx, row in enumerate(ws.iter_rows(values_only=True)):
                row_num = r_idx + 1
                if not row or row[0] is None:
                    continue

                val_col_a = str(row[0]).strip()
                if not val_col_a or val_col_a in ['ID', 'STT', 'MÃ', 'STT/ID']:
                    continue

                # Handle multi-line cell in Col A (some cells have multiple lines for packs/skus)
                lines = [l.strip() for l in val_col_a.split('\n') if l.strip()]
                for sub_idx, line in enumerate(lines):
                    # Check column B & C for notes or status
                    notes_parts = []
                    col_b = str(row[1]).strip() if len(row) > 1 and row[1] is not None else ""
                    col_c = str(row[2]).strip() if len(row) > 2 and row[2] is not None else ""
                    
                    if col_b: notes_parts.append(col_b)
                    if col_c: notes_parts.append(col_c)
                    combined_notes = " | ".join(notes_parts) if notes_parts else None

                    # Parse code details
                    details = parse_sku_details(line, fallback_brand=sheet_name if sheet_name in KNOWN_BRANDS else None)

                    # Override status if notes explicitly state MẪU CŨ
                    if combined_notes and "MẪU CŨ" in combined_notes.upper():
                        details["status_version"] = "MẪU CŨ"

                    # Check image
                    img_info = row_images.get(row_num)
                    image_filename = img_info[0] if img_info else None
                    image_url = img_info[1] if img_info else None
                    image_hash = img_info[2] if img_info else None

                    products.append({
                        "code": line,
                        "name": details["name"],
                        "brand": details["brand"] or sheet_name,
                        "category": details["category"],
                        "packaging": details["packaging"],
                        "volume": details["volume"],
                        "status_version": details["status_version"],
                        "notes": combined_notes,
                        "image_filename": image_filename,
                        "image_url": image_url,
                        "image_hash": image_hash,
                        "sheet_name": sheet_name,
                        "source_file": self.filename
                    })
        wb.close()
        return products
