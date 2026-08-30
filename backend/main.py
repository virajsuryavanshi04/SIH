from dotenv import load_dotenv
load_dotenv()

import os
import time
import logging
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from config import settings
from database import engine, Base, SessionLocal
from seed.seed_data import seed_database
from routers import auth, roles, users, competencies, assessments, dashboard, courses, learning_paths, progress, materials, questions, admin, recommendations, diagnosis

# Configure logger
logger = logging.getLogger("smartlearn.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(
    title="SmartLearn API",
    description="Backend for SmartLearn Competency Intelligence Platform",
    version=settings.APP_VERSION
)

# 1. Request Timing & Observability Middleware
@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    # Log HTTP method, path, response status, and duration (never headers or body)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
    response.headers["X-Process-Time-Ms"] = str(duration_ms)
    return response

# 2. Global Exception Handler (Sanitized for Production)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the full exception internally for diagnostics
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    
    # In production, never expose stack traces, database details, or internal paths
    if settings.ENVIRONMENT.lower() == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)}
    )

# 3. Configurable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Health & Readiness Endpoints
@app.get("/health", tags=["system"])
def get_health():
    """Returns application liveness and version info without leaking secrets."""
    return {
        "status": "ok",
        "version": settings.APP_VERSION
    }

@app.get("/ready", tags=["system"])
def get_ready():
    """Performs lightweight database readiness check."""
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "database": "disconnected"}
        )

# 5. Core Routers
app.include_router(auth.router)
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(competencies.router)
app.include_router(assessments.router)
app.include_router(dashboard.router)
app.include_router(courses.router)
app.include_router(recommendations.router)
app.include_router(learning_paths.router)
app.include_router(progress.router)
app.include_router(materials.router)
app.include_router(questions.router)
app.include_router(admin.router)
app.include_router(diagnosis.router)

@app.on_event("startup")
def on_startup():
    # Production secret validation check
    settings.validate_production_secrets()
    
    Base.metadata.create_all(bind=engine)
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)
    
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

