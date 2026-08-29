from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from database import get_db
from auth.dependencies import require_admin
from models.user import User
from models.assessment import Question, QuestionOption
from models.competency import Competency, CompetencyTopic
from ai.service import AIService

router = APIRouter(prefix="/api/questions", tags=["questions"])

class QuestionOptionSchema(BaseModel):
    id: Optional[int] = None
    option_text: str
    is_correct: bool

class QuestionUpdateSchema(BaseModel):
    text: Optional[str] = None
    difficulty: Optional[str] = None
    cognitive_level: Optional[str] = None
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    options: Optional[List[QuestionOptionSchema]] = None

class QuestionStatusSchema(BaseModel):
    status: str  # "approved", "rejected", "pending_review"

class QuestionGenerateRequest(BaseModel):
    competency_id: int
    topic_id: Optional[int] = None
    difficulty: Optional[str] = "2"  # "1", "2", "3" or "intermediate"
    count: Optional[int] = 5

def serialize_question(q: Question) -> Dict[str, Any]:
    options = [
        {
            "id": opt.id,
            "option_text": opt.text if hasattr(opt, 'text') else getattr(opt, 'option_text', ''),
            "is_correct": opt.is_correct
        }
        for opt in q.options
    ]
    correct_opt = next((opt["option_text"] for opt in options if opt["is_correct"]), q.correct_answer or "")

    q_text = q.question_text or q.text or ""

    return {
        "id": q.id,
        "bank_question_id": q.bank_question_id,
        "bank_version": q.bank_version,
        "text": q_text,
        "question_text": q_text,
        "difficulty": q.difficulty,
        "question_type": q.question_type or "SHORT_MCQ",
        "cognitive_level": q.cognitive_level or "apply",
        "explanation": q.explanation or "Official MoSPI statistical framework benchmark.",
        "source_type": q.source_type,
        "source_title": q.source_title,
        "source_organization": q.source_organization,
        "source_reference": q.source_reference or "MoSPI Official Statistics Handbook",
        "source": q.source or "seeded",
        "status": q.status or "approved",
        "competency_id": q.competency_id,
        "competency_name": q.competency.name if q.competency else "Official Statistics",
        "topic_id": q.topic_id,
        "topic_name": q.topic.name if q.topic else None,
        "options": options,
        "correct_answer": correct_opt
    }

@router.get("/")
def list_questions(
    status: Optional[str] = None,
    competency_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(Question)

    if status and status != "all":
        query = query.filter(Question.status == status)
    if competency_id:
        query = query.filter(Question.competency_id == competency_id)
    if difficulty and difficulty != "all":
        query = query.filter(Question.difficulty == difficulty)
    if search:
        query = query.filter(Question.text.ilike(f"%{search}%"))

    questions = query.order_by(Question.id.desc()).all()
    return [serialize_question(q) for q in questions]

@router.get("/{id}")
def get_question(id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return serialize_question(q)

@router.post("/generate")
def generate_questions(
    req: QuestionGenerateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Admin triggers on-demand AI question generation for a selected competency & topic.
    Generated questions are saved with status="pending_review".
    """
    comp = db.query(Competency).filter(Competency.id == req.competency_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competency not found")

    topic = db.query(CompetencyTopic).filter(CompetencyTopic.id == req.topic_id).first() if req.topic_id else None
    topic_name = topic.name if topic else "Statistical Analysis"

    ai = AIService()
    generated_questions = []

    for _ in range(req.count):
        q_data = ai.generate_question(
            competency_name=comp.name,
            topic_name=topic_name,
            difficulty=str(req.difficulty)
        )
        if q_data:
            # Store in DB with pending_review status
            created_q = AIService.validate_and_store_question(
                db=db,
                q_data=q_data,
                competency_id=comp.id,
                topic_id=req.topic_id,
                created_by_user_id=admin.id
            )
            if created_q:
                created_q.status = "pending_review"
                db.commit()
                generated_questions.append(serialize_question(created_q))

    return {
        "status": "success",
        "generated_count": len(generated_questions),
        "questions": generated_questions
    }

@router.put("/{id}")
def edit_question(
    id: int,
    payload: QuestionUpdateSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if payload.text is not None:
        q.text = payload.text
        q.question_text = payload.text
    if payload.difficulty is not None:
        q.difficulty = payload.difficulty
    if payload.cognitive_level is not None:
        q.cognitive_level = payload.cognitive_level
    if payload.explanation is not None:
        q.explanation = payload.explanation
    if payload.source_reference is not None:
        q.source_reference = payload.source_reference

    # If options were edited
    if payload.options is not None:
        for opt_update in payload.options:
            if opt_update.id:
                opt = db.query(QuestionOption).filter(QuestionOption.id == opt_update.id).first()
                if opt:
                    opt.text = opt_update.option_text
                    opt.is_correct = opt_update.is_correct

    db.commit()
    db.refresh(q)
    return serialize_question(q)

@router.patch("/{id}/status")
def patch_status(
    id: int,
    payload: QuestionStatusSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if payload.status not in ["approved", "rejected", "pending_review"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    q.status = payload.status
    db.commit()
    db.refresh(q)
    return serialize_question(q)

@router.post("/{id}/regenerate")
def regenerate_question(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    comp_name = q.competency.name if q.competency else "Official Statistics"
    topic_name = q.topic.name if q.topic else "Statistical Analysis"

    ai = AIService()
    new_data = ai.generate_question(
        competency_name=comp_name,
        topic_name=topic_name,
        difficulty=str(q.difficulty)
    )

    if not new_data:
        raise HTTPException(status_code=500, detail="Failed to regenerate question")

    # Update current question with new content
    q.text = new_data["question_text"]
    q.explanation = new_data.get("explanation", q.explanation)
    q.source_reference = new_data.get("source_reference", q.source_reference)
    q.status = "pending_review"

    # Replace options
    for i, opt in enumerate(q.options):
        if i < len(new_data["options"]):
            opt.text = new_data["options"][i]["text"]
            opt.is_correct = (new_data["options"][i]["text"] == new_data["correct_answer"])

    db.commit()
    db.refresh(q)
    return serialize_question(q)
