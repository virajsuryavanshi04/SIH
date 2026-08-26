from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.course import Course, CourseCompetency
from models.learning_path import LearningProgress
from services.recommendation_service import recommend_courses

router = APIRouter(prefix="/api/courses", tags=["courses"])

@router.get("/")
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.is_active == True).all()
    res = []
    for c in courses:
        cc = [{"id": x.competency.id, "name": x.competency.name} for x in c.competencies]
        res.append({
            "id": c.id, "title": c.title, "description": c.description, 
            "difficulty": c.difficulty, "duration_hours": c.duration_hours,
            "language": c.language, "provider": c.provider,
            "thumbnail_url": c.thumbnail_url, "content_url": c.content_url,
            "is_active": c.is_active, "competencies": cc
        })
    return res

@router.get("/recommended")
def get_recommended(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recs = recommend_courses(db, current_user.id)
    res = []
    for r in recs:
        c = r["course"]
        cc = [{"id": x.competency.id, "name": x.competency.name} for x in c.competencies]
        res.append({
            "id": c.id, "title": c.title, "description": c.description, 
            "difficulty": c.difficulty, "duration_hours": c.duration_hours,
            "language": c.language, "provider": c.provider,
            "is_active": c.is_active, "competencies": cc,
            "match_percent": r["match_percent"],
            "recommendation_reasons": r["recommendation_reasons"]
        })
    return res

@router.get("/{id}")
def get_course(id: int, db: Session = Depends(get_db)):
    c = db.query(Course).filter(Course.id == id).first()
    cc = [{"id": x.competency.id, "name": x.competency.name} for x in c.competencies]
    return {
        "id": c.id, "title": c.title, "description": c.description, 
        "difficulty": c.difficulty, "duration_hours": c.duration_hours,
        "language": c.language, "provider": c.provider,
        "is_active": c.is_active, "competencies": cc
    }

@router.post("/{id}/enroll")
def enroll(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    progress = LearningProgress(user_id=current_user.id, course_id=id, status="in_progress")
    db.add(progress)
    db.commit()
    return {"status": "enrolled"}

@router.patch("/{id}/progress")
def update_progress(id: int, percent: float, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    progress = db.query(LearningProgress).filter(LearningProgress.course_id == id, LearningProgress.user_id == current_user.id).first()
    if progress:
        progress.progress_percent = percent
        db.commit()
    return {"status": "updated"}

@router.post("/{id}/complete")
def complete_course(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    progress = db.query(LearningProgress).filter(LearningProgress.course_id == id, LearningProgress.user_id == current_user.id).first()
    if progress:
        progress.status = "completed"
        progress.progress_percent = 100.0
        db.commit()
    return {"status": "completed"}
