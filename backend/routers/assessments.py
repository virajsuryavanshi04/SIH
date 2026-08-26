from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.assessment import Assessment, AssessmentAnswer, QuestionOption, Question
from schemas.assessment import (
    StartAssessmentRequest, 
    SubmitAnswerRequest, 
    AssessmentStartResponse, 
    AssessmentResultResponse,
    QuestionResponse,
    OptionResponse
)
from services.assessment_service import (
    select_questions, 
    submit_user_answer, 
    score_assessment, 
    get_assessment_result
)

router = APIRouter(prefix="/api/assessments", tags=["assessments"])

@router.post("/start", response_model=AssessmentStartResponse)
def start_assessment(
    req: StartAssessmentRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Starts an official assessment (baseline, adaptive_reassessment, or practice).
    Selects calibrated questions sampled evenly across all required competencies for the user's role.
    """
    ass_type = req.assessment_type or "baseline"
    assessment = Assessment(
        user_id=current_user.id, 
        assessment_type=ass_type,
        type=ass_type,
        status="in_progress"
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    questions = select_questions(
        db, 
        user=current_user, 
        competency_ids=req.competency_ids, 
        difficulty=req.difficulty, 
        question_count=req.question_count,
        assessment_type=ass_type
    )
    
    q_list = []
    comp_names = set()
    for q in questions:
        c_name = getattr(q, 'competency_name', q.competency.name if q.competency else "Competency")
        comp_names.add(c_name)
        t_name = getattr(q, 'topic_name', q.topic.name if q.topic else None)
        
        # Options without is_correct leak
        opts = [OptionResponse(id=o.id, text=o.text, order=o.order) for o in sorted(q.options, key=lambda x: x.order)]
        
        q_list.append(QuestionResponse(
            id=q.id,
            text=q.question_text or q.text,
            question_text=q.question_text or q.text,
            question_type="mcq",
            difficulty=str(q.difficulty),
            competency_id=q.competency_id,
            competency_name=c_name,
            topic_id=q.topic_id,
            topic_name=t_name,
            cognitive_level=q.cognitive_level or "understand",
            options=opts
        ))
        
    return AssessmentStartResponse(
        assessment_id=assessment.id,
        assessment_type=ass_type,
        total_questions=len(q_list),
        competencies_covered=list(comp_names),
        questions=q_list
    )

@router.get("/{id}")
def get_assessment(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch assessment session metadata."""
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")
    return assessment

@router.post("/{id}/answer")
def submit_answer(
    id: int, 
    req: SubmitAnswerRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Submits answer for a question with confidence level and response time telemetry."""
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")
        
    return submit_user_answer(db, id, current_user.id, req)

@router.post("/{id}/complete", response_model=AssessmentResultResponse)
def complete_assessment(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Submits and scores assessment using deterministic logic.
    Updates user_competencies, saves immutable competency_history, and returns diagnostic results.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")
        
    return score_assessment(db, id, current_user.id)

@router.get("/{id}/result", response_model=AssessmentResultResponse)
def get_result(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch structured diagnostic results for an assessment session."""
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")
        
    return get_assessment_result(db, id, current_user.id)

@router.get("/history/list")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch user's historical assessment log."""
    return db.query(Assessment).filter(
        Assessment.user_id == current_user.id
    ).order_by(Assessment.started_at.desc()).all()
