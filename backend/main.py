from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from config import settings
from database import engine, Base, SessionLocal
from seed.seed_data import seed_database
from routers import auth, roles, users, competencies, assessments, dashboard, courses, learning_paths, progress, materials, questions, admin

app = FastAPI(
    title="SmartLearn API",
    description="Backend for SmartLearn Competency Intelligence Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routers
app.include_router(auth.router)
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(competencies.router)
app.include_router(assessments.router)
app.include_router(dashboard.router)
app.include_router(courses.router)
app.include_router(learning_paths.router)
app.include_router(progress.router)
app.include_router(materials.router)
app.include_router(questions.router)
app.include_router(admin.router)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)
    
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
