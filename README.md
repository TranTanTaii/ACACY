# ACACY - Hệ Thống Quản Lý & Tra Cứu Catalog Sản Phẩm (Retail Audit)

Hệ thống web tra cứu, quản lý (CRUD) và import mã sản phẩm từ file Excel, tích hợp cơ chế bóc tách tự động hình ảnh mẫu nhúng trực tiếp trong file Excel phục vụ cho công tác kiểm tra trưng bày (merchandising audit).

---

## 🌟 Tính Năng Nổi Bật

1. **Import File Excel Thông Minh & Bóc Tách Ảnh Siêu Tốc:**
   - Hỗ trợ các file Excel dung lượng lớn (`.xlsx` từ vài chục MB đến hàng trăm MB như `List sản phẩm OCD.xlsx` 270MB).
   - Tự động phân tích toạ độ dòng của ảnh mẫu nhúng trong file Excel (`twoCellAnchor` / `oneCellAnchor`), lưu ảnh vào đĩa và gắn kết chuẩn xác với từng mã SKU.
   - Cơ chế phát hiện trùng lặp ảnh bằng mã băm MD5 để tiết kiệm dung lượng đĩa.
   - Hỗ trợ chọn từng Sheet để import hoặc import toàn bộ.

2. **Cơ Chế Gợi Ý Tìm Kiếm (Autocomplete):**
   - Khi gõ từ khoá vào thanh tìm kiếm, hệ thống hiển thị danh sách gợi ý xổ xuống tức thì (sau 200ms debounce).
   - Hiển thị đầy đủ mã SKU, nhãn hàng, trạng thái bao bì và biểu tượng cho biết sản phẩm có ảnh mẫu hay chưa.
   - Hỗ trợ điều hướng bằng phím mũi tên `↑` `↓` và phím `Enter`.

3. **Xem Chi Tiết Sản Phẩm & Xử Lý Hiển Thị Ảnh:**
   - Nhấp vào bất kỳ sản phẩm nào để mở popup chi tiết (Mã SKU, Thương hiệu, Quy cách, Dung tích, Trạng thái, Lưu ý dán nhãn, Nguồn file...).
   - **Xử lý ảnh:**
     - Nếu sản phẩm **có ảnh mẫu**: Hiển thị ảnh rõ nét, cho phép nhấp vào để phóng to toàn màn hình (zoom).
     - Nếu sản phẩm **không có ảnh**: Tự động ẩn hoàn toàn khung ảnh và thay bằng nhãn gọn gàng *"Chưa có ảnh mẫu"*, bố cục co dãn tự nhiên không để lại khoảng trống thừa hay biểu tượng ảnh vỡ.

4. **Thêm, Xóa, Sửa (CRUD):**
   - Thêm sản phẩm mới với form nhập liệu đầy đủ và tải ảnh từ máy tính.
   - Chỉnh sửa thông tin, thay thế hoặc xóa ảnh của sản phẩm.
   - Xóa từng sản phẩm với hộp thoại xác nhận an toàn.

5. **Bộ Lọc Đa Năng:**
   - Lọc nhanh theo tình trạng ảnh: *Tất cả*, *Có ảnh*, *Chưa ảnh*.
   - Lọc theo phân loại bao bì: *Mẫu mới*, *Mẫu cũ*, *Khuyến mãi (KM)*.
   - Lọc theo từng Thương hiệu (*OMO, CLEAR, DOVE, PEPSI, ABBOTT...*).
   - Chuyển đổi linh hoạt giữa giao diện Lưới thẻ (Cards) và Bảng danh sách (Table).

---

## 🐳 Hướng Dẫn Chạy Bằng Docker (Khuyên Dùng)

Ứng dụng được đóng gói toàn bộ (Frontend + Backend + Database) trong **1 Docker Container duy nhất**.

### Cách 1: Chạy nhanh bằng file `start.bat` (Windows)
Chỉ cần nhấp đúp vào file `start.bat` trong thư mục `D:\ACACY`. Ứng dụng sẽ tự động khởi động và mở trình duyệt tại `http://localhost:8000`.

---

### Cách 2: Chạy bằng lệnh Docker CLI

#### Bước 1: Build Docker Image (chỉ làm lần đầu)
Mở PowerShell hoặc CMD tại thư mục dự án và chạy:
```bash
docker build -t acacy-catalog .
```

#### Bước 2: Chạy Container
```bash
docker run -d \
  -p 8000:8000 \
  -v "${PWD}/data:/app/data" \
  -v "${PWD}:/app/workspace:ro" \
  --name acacy-product-catalog \
  acacy-catalog
```
*Lưu ý trên Windows CMD:* Thay `${PWD}` bằng `%cd%`.

#### Bước 3: Mở trình duyệt
Truy cập: **[http://localhost:8000](http://localhost:8000)**

* Dữ liệu cơ sở dữ liệu (`acacy.db`) và toàn bộ ảnh mẫu trích xuất được lưu trữ vĩnh viễn trong thư mục `data/` trên máy tính của bạn, không lo bị mất khi tắt hoặc xóa container.

---

### Cách 3: Chạy bằng Docker Compose
```bash
docker compose up -d
```
Để dừng container:
```bash
docker compose down
```

---

## 💻 Hướng Dẫn Chạy Trực Tiếp Local (Không Dùng Docker)

### 1. Khởi động Backend (Python FastAPI)
```bash
# Cài đặt thư viện
pip install -r backend/requirements.txt

# Chạy server FastAPI
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Khởi động Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```
Trình duyệt mở tại: `http://localhost:3000` (tự động proxy API sang port 8000).

Hoặc nếu muốn build thành bản phân phối hoàn chỉnh:
```bash
cd frontend
npm run build
```
Lúc này bạn chỉ cần chạy backend tại cổng `8000` là xem được toàn bộ web.

---

## 📁 Cấu Trúc Dự Án
```text
D:\ACACY\
├── backend/
│   ├── app/
│   │   ├── config.py         # Cấu hình đường dẫn, thư mục data & ảnh
│   │   ├── database.py       # Khởi tạo SQLite kết nối WAL mode
│   │   ├── models.py         # CSDL bảng Product và ImportLog
│   │   ├── schemas.py        # Pydantic schemas cho API
│   │   ├── crud.py           # Thao tác CSDL (tìm kiếm, gợi ý, CRUD)
│   │   ├── excel_parser.py   # Bộ trích xuất Excel & ảnh nhúng siêu tốc
│   │   ├── routes/
│   │   │   ├── products.py   # API CRUD, tìm kiếm, upload ảnh
│   │   │   └── import_excel.py # API phân tích & import Excel
│   │   └── main.py           # FastAPI entrypoint & phục vụ Frontend tĩnh
│   ├── static/               # Bản build frontend tĩnh
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/productApi.js # Tầng gọi API
│   │   ├── components/       # Các component UI (Search, Modal, Card...)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── data/                     # Thư mục lưu trữ bền vững (mount vào Docker)
│   ├── acacy.db              # File cơ sở dữ liệu SQLite
│   └── images/               # Thư mục chứa các ảnh mẫu sản phẩm
├── Dockerfile                # Multi-stage Dockerfile
├── docker-compose.yml        # Docker Compose configuration
├── start.bat                 # Script chạy nhanh 1-click cho Windows
└── README.md
```
