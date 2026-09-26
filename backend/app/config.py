import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for backend (FoodDeliveryApp/backend)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file if it exists
load_dotenv(BASE_DIR / ".env")

# Always resolve database file path to absolute path inside BASE_DIR
raw_db_url = os.getenv("DATABASE_URL", "").strip()
if not raw_db_url or "sqlite:///." in raw_db_url:
    db_file = (BASE_DIR / "food_delivery.db").resolve()
    DATABASE_URL = f"sqlite:///{db_file.as_posix()}"
else:
    DATABASE_URL = raw_db_url

APP_NAME = os.getenv("APP_NAME", "Ghatampur Food API")
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

# CORS origins configuration
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000"
)
CORS_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
