import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent

# Data directory can be overridden by environment variable (useful in Docker)
DATA_DIR_ENV = os.getenv("DATA_DIR")
if DATA_DIR_ENV:
    DATA_DIR = Path(DATA_DIR_ENV)
else:
    # Default to data folder in project root if local, or /app/data in Docker
    if os.path.exists("/app"):
        DATA_DIR = Path("/app/data")
    else:
        DATA_DIR = BASE_DIR.parent / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)

IMAGES_DIR = DATA_DIR / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

TEMP_UPLOADS_DIR = DATA_DIR / "temp"
TEMP_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "acacy.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
