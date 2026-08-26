from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.learning_path import LearningPath, LearningPathItem
from services.recommendation_service import generate_learning_path

router = APIRouter(prefix="/api/learning-path", tags=["learning-path"])

@router.get("/")
def get_path(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(LearningPath).filter(LearningPath.user_id == current_user.id, LearningPath.is_active == True).first()

@router.post("/generate")
def generate_path(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return generate_learning_path(db, current_user.id)

@router.patch("/items/{id}/complete")
def complete_item(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(LearningPathItem).filter(LearningPathItem.id == id).first()
    if item:
        item.status = "completed"
        db.commit()
    return {"status": "completed"}
