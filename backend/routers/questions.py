from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import require_admin
from models.user import User
from models.assessment import Question
from ai.service import AIService

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.get("/")
def list_questions(db: Session = Depends(get_db)):
    return db.query(Question).all()

@router.get("/{id}")
def get_question(id: int, db: Session = Depends(get_db)):
    return db.query(Question).filter(Question.id == id).first()

@router.put("/{id}")
def edit_question(id: int, text: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(Question).filter(Question.id == id).first()
    if q:
        q.text = text
        db.commit()
    return {"status": "edited"}

@router.patch("/{id}/status")
def patch_status(id: int, status: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(Question).filter(Question.id == id).first()
    if q:
        q.status = status
        db.commit()
    return {"status": "updated"}

@router.post("/{id}/regenerate")
def regenerate_question(id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        return {"status": "error"}
    
    ai = AIService()
    res = ai.generate_questions(q.text, 1, q.difficulty, q.question_type, q.cognitive_level)
    return {"status": "regenerated", "new_data": res}
