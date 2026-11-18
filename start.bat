@echo off
title ACACY Product Catalog
echo ========================================================
echo       KHOI DONG ACACY PRODUCT CATALOG (DOCKER)
echo ========================================================
echo.

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Docker chua duoc cai dat hoac chua duoc them vao PATH!
    pause
    exit /b
)

echo [1/3] Kiem tra va dung container cu neu dang chay...
docker stop acacy-product-catalog >nul 2>&1
docker rm acacy-product-catalog >nul 2>&1

echo [2/3] Khoi chay container acacy-product-catalog tren cong 8000...
docker run -d ^
  -p 8000:8000 ^
  -v "%cd%\data:/app/data" ^
  -v "%cd%:/app/workspace:ro" ^
  --name acacy-product-catalog ^
  acacy-catalog

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  UNG DUNG DA KHOI DONG THANH CONG!
    echo  Mo trinh duyet va truy cap: http://localhost:8000
    echo ========================================================
    echo.
    start http://localhost:8000
) else (
    echo [LOI] Khong the chay container. Hay thu build lai bang lenh: docker build -t acacy-catalog .
)

pause
