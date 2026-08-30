from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from database import get_db
from auth.dependencies import require_admin
from models.user import User
from models.assessment import Question, QuestionOption, QuestionReviewHistory
from models.competency import Competency, CompetencyTopic
from ai.service import AIService

router = APIRouter(prefix="/api/questions", tags=["questions"])

class QuestionOptionSchema(BaseModel):
    id: Optional[int] = None
    option_text: str
    is_correct: bool
    order: Optional[int] = None

class QuestionUpdateSchema(BaseModel):
    text: Optional[str] = None
    question_text: Optional[str] = None
    difficulty: Optional[str] = None
    question_type: Optional[str] = None
    topic_id: Optional[int] = None
    cognitive_level: Optional[str] = None
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    source_title: Optional[str] = None
    source_organization: Optional[str] = None
    options: Optional[List[QuestionOptionSchema]] = None
    comment: Optional[str] = None

class QuestionStatusSchema(BaseModel):
    status: str  # "approved", "rejected", "pending_review"
    comment: Optional[str] = None
    reason: Optional[str] = None

class QuestionGenerateRequest(BaseModel):
    competency_id: int
    topic_id: Optional[int] = None
    difficulty: Optional[str] = "2"  # "1", "2", "3" or "intermediate"
    count: Optional[int] = 5

def serialize_question(q: Question, include_history: bool = True) -> Dict[str, Any]:
    options = [
        {
            "id": opt.id,
            "option_text": opt.text if hasattr(opt, 'text') else getattr(opt, 'option_text', ''),
            "text": opt.text if hasattr(opt, 'text') else getattr(opt, 'option_text', ''),
            "is_correct": opt.is_correct,
            "order": opt.order
        }
        for opt in q.options
    ]
    correct_opt = next((opt["option_text"] for opt in options if opt["is_correct"]), q.correct_answer or "")

    q_text = q.question_text or q.text or ""

    history_entries = []
    if include_history and hasattr(q, 'review_history') and q.review_history:
        history_entries = [
            {
                "id": h.id,
                "action": h.action,
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "comment": h.comment,
                "admin_user_id": h.admin_user_id,
                "admin_name": h.admin_user.full_name if (h.admin_user and h.admin_user.full_name) else (h.admin_user.name if h.admin_user else "Administrator"),
                "created_at": h.created_at.isoformat() if h.created_at else None
            }
            for h in q.review_history
        ]

    return {
        "id": q.id,
        "bank_question_id": q.bank_question_id,
        "bank_version": q.bank_version,
        "text": q_text,
        "question_text": q_text,
        "difficulty": q.difficulty,
        "question_type": q.question_type or "SHORT_MCQ",
        "cognitive_level": q.cognitive_level or "understand",
        "explanation": q.explanation or "Official MoSPI statistical framework benchmark.",
        "source_type": q.source_type or "STANDARD_STATISTICAL_KNOWLEDGE",
        "source_title": q.source_title or "Established statistical/survey methodology principles",
        "source_organization": q.source_organization or "N/A",
        "source_reference": q.source_reference or "N/A",
        "source": q.source or "seeded",
        "status": q.status or "approved",
        "is_ai_generated": bool(q.is_ai_generated),
        "competency_id": q.competency_id,
        "competency_name": q.competency.name if q.competency else "Official Statistics",
        "topic_id": q.topic_id,
        "topic_name": q.topic.name if q.topic else None,
        "options": options,
        "correct_answer": correct_opt,
        "created_at": q.created_at.isoformat() if q.created_at else None,
        "review_history": history_entries
    }

@router.get("/stats")
def get_question_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Returns real-time database counts across all questions for Admin KPI overview.
    """
    total = db.query(func.count(Question.id)).scalar() or 0
    pending = db.query(func.count(Question.id)).filter(Question.status == "pending_review").scalar() or 0
    approved = db.query(func.count(Question.id)).filter(Question.status == "approved").scalar() or 0
    rejected = db.query(func.count(Question.id)).filter(Question.status == "rejected").scalar() or 0

    diff_counts = dict(db.query(Question.difficulty, func.count(Question.id)).group_by(Question.difficulty).all())
    type_counts = dict(db.query(Question.question_type, func.count(Question.id)).group_by(Question.question_type).all())
    src_counts = dict(db.query(Question.source, func.count(Question.id)).group_by(Question.source).all())

    return {
        "total": total,
        "pending_review": pending,
        "approved": approved,
        "rejected": rejected,
        "by_difficulty": {
            "1": diff_counts.get("1", 0) + diff_counts.get("easy", 0) + diff_counts.get("beginner", 0),
            "2": diff_counts.get("2", 0) + diff_counts.get("medium", 0) + diff_counts.get("intermediate", 0),
            "3": diff_counts.get("3", 0) + diff_counts.get("hard", 0) + diff_counts.get("advanced", 0),
        },
        "by_type": {
            "SHORT_MCQ": type_counts.get("SHORT_MCQ", 0),
            "WORD_PROBLEM": type_counts.get("WORD_PROBLEM", 0),
            "CASE_STUDY": type_counts.get("CASE_STUDY", 0),
        },
        "by_source": {
            "ai_generated": src_counts.get("ai_generated", 0),
            "seeded": src_counts.get("seeded", 0),
        }
    }

@router.get("/")
def list_questions(
    status: Optional[str] = None,
    competency_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    question_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    List questions with multi-attribute filtering and keyword search.
    Protected by admin authorization.
    """
    query = db.query(Question)

    if status and status != "all":
        query = query.filter(Question.status == status)
    if competency_id:
        query = query.filter(Question.competency_id == competency_id)
    if topic_id:
        query = query.filter(Question.topic_id == topic_id)
    if question_type and question_type != "all":
        query = query.filter(Question.question_type == question_type)
    if difficulty and difficulty != "all":
        query = query.filter(Question.difficulty == difficulty)
    if source and source != "all":
        query = query.filter(Question.source == source)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Question.question_text.ilike(s),
                Question.text.ilike(s),
                Question.bank_question_id.ilike(s),
                Question.source_reference.ilike(s),
                Question.source_title.ilike(s)
            )
        )

    questions = query.order_by(Question.id.desc()).all()
    return [serialize_question(q, include_history=False) for q in questions]

@router.get("/{id}")
def get_question(
    id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """
    Returns complete question details along with review history audit trail.
    """
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return serialize_question(q, include_history=True)

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
            created_q = AIService.validate_and_store_question(
                db=db,
                q_data=q_data,
                competency_id=comp.id,
                topic_id=req.topic_id,
                created_by_user_id=admin.id,
                status="pending_review"
            )
            if created_q:
                # Log audit record for AI synthesis
                audit = QuestionReviewHistory(
                    question_id=created_q.id,
                    admin_user_id=admin.id,
                    previous_status=None,
                    new_status="pending_review",
                    action="AI_GENERATE",
                    comment=f"On-demand AI synthesis for {comp.name} / {topic_name}"
                )
                db.add(audit)
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
    """
    Allows administrator to edit question content with strict backend validation.
    Records an EDIT audit log entry.
    """
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    # 1. Validate Question Type
    if payload.question_type is not None:
        if payload.question_type not in ["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY"]:
            raise HTTPException(status_code=422, detail="Invalid question_type. Allowed: SHORT_MCQ, WORD_PROBLEM, CASE_STUDY")
        q.question_type = payload.question_type

    # 2. Validate Difficulty
    if payload.difficulty is not None:
        diff_str = str(payload.difficulty).upper()
        if diff_str in ["1", "EASY", "BEGINNER", "FOUNDATIONAL"]:
            q.difficulty = "1"
        elif diff_str in ["3", "HARD", "ADVANCED"]:
            q.difficulty = "3"
        elif diff_str in ["2", "MEDIUM", "INTERMEDIATE"]:
            q.difficulty = "2"
        else:
            raise HTTPException(status_code=422, detail="Invalid difficulty. Allowed: 1 (Easy), 2 (Medium), 3 (Hard)")

    # 3. Validate Topic
    if payload.topic_id is not None:
        topic = db.query(CompetencyTopic).filter(
            CompetencyTopic.id == payload.topic_id,
            CompetencyTopic.competency_id == q.competency_id
        ).first()
        if not topic:
            raise HTTPException(status_code=422, detail="Topic not found or does not belong to this competency")
        q.topic_id = payload.topic_id

    # 4. Text & Explanations
    new_text = payload.question_text or payload.text
    if new_text is not None:
        if not new_text.strip():
            raise HTTPException(status_code=422, detail="Question text cannot be empty")
        q.text = new_text.strip()
        q.question_text = new_text.strip()

    if payload.explanation is not None:
        q.explanation = payload.explanation.strip()
    if payload.cognitive_level is not None:
        q.cognitive_level = payload.cognitive_level
    if payload.source_reference is not None:
        q.source_reference = payload.source_reference
    if payload.source_title is not None:
        q.source_title = payload.source_title
    if payload.source_organization is not None:
        q.source_organization = payload.source_organization

    # 5. Validate Options
    if payload.options is not None:
        if len(payload.options) != 4:
            raise HTTPException(status_code=422, detail="A question must contain exactly 4 options")
        
        correct_count = sum(1 for opt in payload.options if opt.is_correct)
        if correct_count != 1:
            raise HTTPException(status_code=422, detail=f"A question must have exactly 1 correct option (found {correct_count})")

        # Update or recreate options
        correct_answer_text = ""
        for idx, opt_update in enumerate(payload.options):
            opt_text = opt_update.option_text.strip()
            if not opt_text:
                raise HTTPException(status_code=422, detail=f"Option #{idx+1} cannot be empty")

            if opt_update.is_correct:
                correct_answer_text = opt_text

            if opt_update.id:
                existing_opt = db.query(QuestionOption).filter(
                    QuestionOption.id == opt_update.id,
                    QuestionOption.question_id == q.id
                ).first()
                if existing_opt:
                    existing_opt.text = opt_text
                    existing_opt.is_correct = opt_update.is_correct
                    existing_opt.order = opt_update.order or (idx + 1)
                else:
                    new_opt = QuestionOption(
                        question_id=q.id,
                        text=opt_text,
                        is_correct=opt_update.is_correct,
                        order=opt_update.order or (idx + 1)
                    )
                    db.add(new_opt)
            else:
                new_opt = QuestionOption(
                    question_id=q.id,
                    text=opt_text,
                    is_correct=opt_update.is_correct,
                    order=opt_update.order or (idx + 1)
                )
                db.add(new_opt)

        if correct_answer_text:
            q.correct_answer = correct_answer_text

    # 6. Audit Trail Logging (Action: EDIT)
    audit = QuestionReviewHistory(
        question_id=q.id,
        admin_user_id=admin.id,
        previous_status=q.status,
        new_status=q.status,
        action="EDIT",
        comment=payload.comment or "Administrator updated question content"
    )
    db.add(audit)

    db.commit()
    db.refresh(q)
    return serialize_question(q, include_history=True)

@router.patch("/{id}/status")
def patch_status(
    id: int,
    payload: QuestionStatusSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Approve, reject, or reset question lifecycle status.
    Records audit review history with optional reason comment.
    """
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    new_status = payload.status.lower().strip()
    if new_status not in ["approved", "rejected", "pending_review"]:
        raise HTTPException(status_code=422, detail="Invalid status. Allowed: approved, rejected, pending_review")

    prev_status = q.status
    action_type = "APPROVE" if new_status == "approved" else ("REJECT" if new_status == "rejected" else "STATUS_RESET")
    reason_comment = payload.comment or payload.reason

    q.status = new_status

    # Record Audit History
    audit = QuestionReviewHistory(
        question_id=q.id,
        admin_user_id=admin.id,
        previous_status=prev_status,
        new_status=new_status,
        action=action_type,
        comment=reason_comment or f"Status changed from {prev_status} to {new_status}"
    )
    db.add(audit)

    db.commit()
    db.refresh(q)
    return serialize_question(q, include_history=True)
