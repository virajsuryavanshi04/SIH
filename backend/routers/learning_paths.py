from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.learning_path import LearningPath, LearningPathItem
from services.recommendation_service import RecommendationService

router = APIRouter(prefix="/api/learning-path", tags=["learning-path"])

@router.get("/")
def get_path(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetches user's active personalized learning path, or generates one tailored to active gaps."""
    path = db.query(LearningPath).filter(
        LearningPath.user_id == current_user.id, 
        LearningPath.is_active == True
    ).first()

    if not path:
        path = RecommendationService.generate_learning_path(db, current_user)

    items = db.query(LearningPathItem).filter(
        LearningPathItem.learning_path_id == path.id
    ).order_by(LearningPathItem.order.asc()).all()

    return {
        "id": path.id,
        "user_id": path.user_id,
        "is_active": path.is_active,
        "ai_reasoning": path.ai_reasoning,
        "created_at": path.created_at,
        "items": [
            {
                "id": it.id,
                "title": it.title,
                "description": it.description,
                "item_type": it.item_type,
                "reference_id": it.reference_id,
                "competency_id": it.competency_id,
                "order": it.order,
                "status": it.status,
                "estimated_duration": it.estimated_duration,
                "difficulty": it.difficulty
            }
            for it in items
        ]
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
