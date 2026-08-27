from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.course import Course, CourseCompetency
from models.learning_path import LearningProgress
from services.recommendation_service import RecommendationService
from services.igot_service import get_learning_resource_provider
from datetime import datetime

router = APIRouter(prefix="/api/courses", tags=["courses"])

@router.get("/")
def get_courses(
    resource_type: str = None, 
    competency_id: int = None,
    db: Session = Depends(get_db)
):
    """Fetches learning resources via the LearningResourceProvider (MockIGOT / RealIGOT)."""
    provider = get_learning_resource_provider()
    courses = provider.get_courses(db, limit=100, resource_type=resource_type)
    if competency_id:
        courses = [c for c in courses if c.competency_id == competency_id]
        
    res = []
    for c in courses:
        res.append({
            "id": c.id, 
            "title": c.title, 
            "description": c.description, 
            "difficulty": c.difficulty, 
            "duration_hours": c.duration_hours,
            "language": c.language, 
            "provider": c.provider,
            "resource_type": c.resource_type,
            "thumbnail_url": c.thumbnail_url, 
            "content_url": c.content_url or c.url,
            "competency_id": c.competency_id,
            "topic_id": c.topic_id,
            "topic_name": c.topic.name if c.topic else None,
            "is_active": c.is_active
        })
    return res

@router.get("/recommended")
def get_recommended(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns personalized, explainable learning recommendations ranked by
    competency gap, role relevance, weak subtopic, and difficulty suitability.
    """
    return RecommendationService.get_personalized_recommendations(db, current_user)

@router.get("/{id}")
def get_course(id: int, db: Session = Depends(get_db)):
    """Fetches details for a specific course/resource."""
    provider = get_learning_resource_provider()
    c = provider.get_course(db, id)
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
        
    return {
        "id": c.id, 
        "title": c.title, 
        "description": c.description, 
        "difficulty": c.difficulty, 
        "duration_hours": c.duration_hours,
        "language": c.language, 
        "provider": c.provider,
        "resource_type": c.resource_type,
        "thumbnail_url": c.thumbnail_url,
        "content_url": c.content_url or c.url,
        "competency_id": c.competency_id,
        "topic_id": c.topic_id,
        "topic_name": c.topic.name if c.topic else None,
        "is_active": c.is_active
    }

@router.post("/{id}/enroll")
def enroll(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Enrolls in course and initializes learning progress."""
    prog = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id, 
        LearningProgress.course_id == id
    ).first()

    if not prog:
        prog = LearningProgress(
            user_id=current_user.id, 
            course_id=id, 
            status="in_progress",
            progress_percent=0.0,
            started_at=datetime.utcnow()
        )
        db.add(prog)
    else:
        prog.status = "in_progress"
        
    db.commit()
    return {"status": "enrolled", "course_id": id}

@router.patch("/{id}/progress")
@router.put("/{id}/progress")
def update_progress(
    id: int, 
    payload: dict, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Updates learning progress percentage."""
    prog = db.query(LearningProgress).filter(
        LearningProgress.course_id == id, 
        LearningProgress.user_id == current_user.id
    ).first()

    percent = float(payload.get("progress_percent", payload.get("progress_percentage", 0.0)))
    if prog:
        prog.progress_percent = percent
        prog.progress_percentage = percent
        if percent >= 100.0:
            prog.status = "completed"
            prog.completed_at = datetime.utcnow()
        elif percent > 0.0:
            prog.status = "in_progress"
        db.commit()
        return {"status": "updated", "progress_percent": percent}
        
    # Auto-create if not enrolled
    prog = LearningProgress(
        user_id=current_user.id, 
        course_id=id, 
        status="in_progress" if percent < 100.0 else "completed",
        progress_percent=percent,
        progress_percentage=percent,
        started_at=datetime.utcnow()
    )
    db.add(prog)
    db.commit()
    return {"status": "updated", "progress_percent": percent}

@router.post("/{id}/complete")
def complete_course(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Marks a course completed in LearningProgress.
    NOTE: In adherence to SmartLearn Core Rules, completing a course DOES NOT
    automatically change competency scores. Competency is updated only via assessment evidence.
    """
    prog = db.query(LearningProgress).filter(
        LearningProgress.course_id == id, 
        LearningProgress.user_id == current_user.id
    ).first()

    if prog:
        prog.status = "completed"
        prog.progress_percent = 100.0
        prog.progress_percentage = 100.0
        prog.completed_at = datetime.utcnow()
    else:
        prog = LearningProgress(
            user_id=current_user.id, 
            course_id=id, 
            status="completed",
            progress_percent=100.0,
            progress_percentage=100.0,
            completed_at=datetime.utcnow()
        )
        db.add(prog)

    db.commit()
    return {
        "status": "completed", 
        "course_id": id,
        "note": "Learning progress marked complete. Take a competency reassessment to update your verified capability score."
    }
