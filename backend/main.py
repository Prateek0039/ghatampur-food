import sys
from pathlib import Path

# Ensure backend directory is in sys.path so 'app' modules resolve correctly
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import APP_NAME, CORS_ORIGINS, DEBUG
from app.database import SessionLocal, init_db
from app.seed import seed_database
from app.routers import auth, restaurants, menu, orders

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan handler: Runs on application startup and shutdown.
    1. Initializes database tables
    2. Seeds initial restaurant and menu data if empty
    """
    print("[INIT] Initializing Ghatampur Food database...")
    init_db()

    # Seed data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    print(f"[START] {APP_NAME} started successfully!")
    print("Interactive API Docs: http://localhost:8000/docs")
    print("Alternative Redoc: http://localhost:8000/redoc")

    yield

    print("[STOP] Shutting down Ghatampur Food API...")


# Initialize FastAPI App
app = FastAPI(
    title=APP_NAME,
    description="FastAPI + SQLite + SQLAlchemy backend for Ghatampur Food Delivery application.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Endpoint: Redirects directly to Swagger UI
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

# Health Check API
@app.get("/api/health", tags=["Health"], summary="Health check")
def health_check():
    """
    Simple health-check endpoint to verify that the backend API is live and responsive.
    """
    return {
        "status": "ok",
        "app": APP_NAME,
        "version": "1.0.0",
        "database": "sqlite",
        "docs_url": "/docs"
    }

# Include Routers
app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(orders.user_orders_router)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=DEBUG
    )
