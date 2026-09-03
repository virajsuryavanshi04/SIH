from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.learning_path import LearningPath, LearningPathItem
from models.course import Course
from models.competency import Competency
from services.recommendation_service import RecommendationService

router = APIRouter(prefix="/api/learning-path", tags=["learning-path"])

@router.get("/")
def get_path(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetches user's active personalized learning path, or generates one tailored to active gaps."""
    path = db.query(LearningPath).filter(
        LearningPath.user_id == current_user.id, 
        LearningPath.is_active == True
    ).first()

    needs_refresh = False
    if not path:
        needs_refresh = True
    else:
        existing_items = db.query(LearningPathItem).filter(
            LearningPathItem.learning_path_id == path.id
        ).all()
        if not existing_items:
            needs_refresh = True
        else:
            # Check if any items reference inactive, deleted, or non-iGOT demo courses
            ref_ids = [it.reference_id for it in existing_items if it.reference_id]
            if not ref_ids:
                needs_refresh = True
            else:
                active_count = db.query(Course).filter(
                    Course.id.in_(ref_ids),
                    Course.is_active == True,
                    Course.is_igot == True
                ).count()
                if active_count < len(ref_ids):
                    needs_refresh = True

    if needs_refresh:
        path = RecommendationService.generate_learning_path(db, current_user)

    items = db.query(LearningPathItem).filter(
        LearningPathItem.learning_path_id == path.id
    ).order_by(LearningPathItem.order.asc()).all()

    # Preload Course and Competency lookup maps
    ref_ids = [it.reference_id for it in items if it.reference_id]
    course_map = {c.id: c for c in db.query(Course).filter(Course.id.in_(ref_ids)).all()} if ref_ids else {}
    comp_map = {c.id: c for c in db.query(Competency).all()}

    enriched_items = []
    for it in items:
        c_obj = course_map.get(it.reference_id)
        comp_obj = comp_map.get(it.competency_id) if it.competency_id else (c_obj.competency if c_obj else None)
        comp_name = comp_obj.name if comp_obj else (it.competency.name if it.competency else "Official Standard")

        enriched_items.append({
            "id": it.id,
            "learning_path_id": it.learning_path_id,
            "title": c_obj.title if c_obj else it.title,
            "description": it.description or (c_obj.description if c_obj else None),
            "item_type": it.item_type or "igot_course",
            "reference_id": it.reference_id,
            "competency_id": it.competency_id or (c_obj.competency_id if c_obj else None),
            "competency_name": comp_name,
            "provider": c_obj.provider if c_obj else "iGOT Karmayogi",
            "igot_identifier": c_obj.igot_identifier if c_obj else None,
            "external_url": c_obj.external_url if (c_obj and c_obj.external_url) else "https://igotkarmayogi.gov.in/",
            "duration_display": (c_obj.duration_display if c_obj and c_obj.duration_display else it.estimated_duration) or "2h",
            "poster_image": c_obj.poster_image if c_obj else None,
            "app_icon": c_obj.app_icon if c_obj else None,
            "is_igot": c_obj.is_igot if c_obj else True,
            "order": it.order,
            "status": it.status,
            "estimated_duration": it.estimated_duration or (c_obj.duration_display if c_obj else "2h"),
            "difficulty": it.difficulty or (c_obj.difficulty if c_obj else "intermediate")
        })

    return {
        "id": path.id,
        "user_id": path.user_id,
        "is_active": path.is_active,
        "ai_reasoning": path.ai_reasoning or "Personalized iGOT curriculum sequenced to systematically close your highest priority competency gaps.",
        "created_at": path.created_at,
        "items": enriched_items
    }

@router.post("/generate")
def generate_path(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Regenerates personalized learning sequence based on latest assessment gaps."""
    path = RecommendationService.generate_learning_path(db, current_user)
    return get_path(db, current_user)

@router.patch("/items/{id}/complete")
def complete_item(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Marks a learning path milestone complete after verifying ownership."""
    # Join through parent LearningPath to verify ownership
    item = db.query(LearningPathItem).join(LearningPath).filter(
        LearningPathItem.id == id,
        LearningPath.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Learning path item not found")
    item.status = "completed"
    # Advance next item
    next_item = db.query(LearningPathItem).filter(
        LearningPathItem.learning_path_id == item.learning_path_id,
        LearningPathItem.order == item.order + 1
    ).first()
    if next_item and next_item.status == "recommended":
        next_item.status = "current"
    db.commit()
    return {"status": "completed", "item_id": id}
