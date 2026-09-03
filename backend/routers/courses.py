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
    role_id: int = None,
    provider: str = None,
    category: str = None,
    search: str = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """Fetches learning resources with rich filtering by Role, Competency, Provider, Category, and Keyword."""
    q = db.query(Course)
    if not include_inactive:
        q = q.filter(Course.is_active == True)
        
    if resource_type:
        q = q.filter(Course.resource_type == resource_type)

    if role_id:
        from models.competency import RoleCompetency
        role_comp_ids = [rc.competency_id for rc in db.query(RoleCompetency).filter(RoleCompetency.role_id == role_id).all()]
        if role_comp_ids:
            q = q.filter(Course.competency_id.in_(role_comp_ids))

    if competency_id:
        q = q.filter(Course.competency_id == competency_id)

    if provider:
        q = q.filter(Course.provider.ilike(f"%{provider}%"))

    if category:
        q = q.filter(Course.category.ilike(f"%{category}%"))

    if search:
        q = q.filter(Course.title.ilike(f"%{search}%") | Course.description.ilike(f"%{search}%"))
        
    courses = q.order_by(Course.id.asc()).all()
    res = []
    for c in courses:
        comp_name = c.competency.name if c.competency else (c.topic.competency.name if (c.topic and c.topic.competency) else None)
        c_conf = "High"
        if c.competencies and len(c.competencies) > 0:
            c_conf = c.competencies[0].confidence or "High"

        res.append({
            "id": c.id, 
            "course_id": c.id,
            "title": c.title, 
            "name": c.title,
            "description": c.description, 
            "difficulty": c.difficulty, 
            "duration_hours": c.duration_hours,
            "duration_seconds": c.duration_seconds,
            "duration_display": c.duration_display or f"{c.duration_hours}h",
            "duration": c.duration_display or f"{c.duration_hours}h",
            "language": c.language, 
            "provider": c.provider,
            "category": c.category or "Course",
            "primary_category": c.category or "Course",
            "resource_type": c.resource_type,
            "igot_identifier": c.igot_identifier or c.external_id,
            "external_id": c.external_id or c.igot_identifier,
            "external_url": c.external_url or "https://igotkarmayogi.gov.in/",
            "thumbnail_url": c.thumbnail_url or c.poster_image, 
            "poster_image": c.poster_image or c.thumbnail_url,
            "app_icon": c.app_icon,
            "content_url": c.content_url or c.external_url or c.url,
            "competency_id": c.competency_id,
            "competency_name": comp_name,
            "competency": comp_name,
            "topic_id": c.topic_id,
            "topic_name": c.topic.name if c.topic else None,
            "confidence": c_conf,
            "mapping_source": c.mapping_source or "smartlearn_inferred",
            "is_igot": c.is_igot if c.is_igot is not None else True,
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
    c = db.query(Course).filter(Course.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
        
    comp_name = c.competency.name if c.competency else (c.topic.competency.name if (c.topic and c.topic.competency) else None)
    c_conf = "High"
    if c.competencies and len(c.competencies) > 0:
        c_conf = c.competencies[0].confidence or "High"

    return {
        "id": c.id, 
        "course_id": c.id,
        "title": c.title, 
        "name": c.title,
        "description": c.description, 
        "difficulty": c.difficulty, 
        "duration_hours": c.duration_hours,
        "duration_seconds": c.duration_seconds,
        "duration_display": c.duration_display or f"{c.duration_hours}h",
        "duration": c.duration_display or f"{c.duration_hours}h",
        "language": c.language, 
        "provider": c.provider,
        "category": c.category or "Course",
        "primary_category": c.category or "Course",
        "resource_type": c.resource_type,
        "igot_identifier": c.igot_identifier or c.external_id,
        "external_id": c.external_id or c.igot_identifier,
        "external_url": c.external_url or "https://igotkarmayogi.gov.in/",
        "thumbnail_url": c.thumbnail_url or c.poster_image,
        "poster_image": c.poster_image or c.thumbnail_url,
        "app_icon": c.app_icon,
        "content_url": c.content_url or c.external_url or c.url,
        "competency_id": c.competency_id,
        "competency_name": comp_name,
        "competency": comp_name,
        "topic_id": c.topic_id,
        "topic_name": c.topic.name if c.topic else None,
        "confidence": c_conf,
        "mapping_source": c.mapping_source or "smartlearn_inferred",
        "is_igot": c.is_igot if c.is_igot is not None else True,
        "is_active": c.is_active
    }

@router.patch("/{id}/toggle-active")
def toggle_course_active(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Admin endpoint to activate or deactivate catalogue entries without changing igot_identifier."""
    if (current_user.role or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
    c = db.query(Course).filter(Course.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
    c.is_active = not c.is_active
    db.commit()
    return {"status": "success", "course_id": c.id, "is_active": c.is_active, "igot_identifier": c.igot_identifier}

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
