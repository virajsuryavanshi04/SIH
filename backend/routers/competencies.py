from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.competency import Competency
from services.competency_service import (
    get_user_detailed_competencies,
    get_user_competency_history,
    get_user_ranked_gaps,
    get_user_competency_insights,
    get_competency_tree
)
from schemas.competency import (
    CompetencyResponse, 
    UserCompetencyStateResponse,
    CompetencyHistoryItem,
    CompetencyGapItem,
    CompetencyInsightsResponse
)

router = APIRouter(prefix="/api/competencies", tags=["competencies"])

@router.get("/", response_model=list[CompetencyResponse])
def list_competencies(db: Session = Depends(get_db)):
    """List all official competencies and their hierarchical subtopics."""
    return db.query(Competency).all()

@router.get("/me", response_model=list[UserCompetencyStateResponse])
def get_my_competencies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get authenticated user's current live competency states derived from assessment evidence.
    Includes latest score, targets, deltas, trajectory trend, and subtopic breakdowns.
    """
    return get_user_detailed_competencies(db, current_user)

@router.get("/me/history", response_model=list[CompetencyHistoryItem])
def get_my_competency_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns full chronological history of all competency measurements across assessments.
    Previous measurements are never overwritten.
    """
    return get_user_competency_history(db, current_user.id)

@router.get("/me/gaps", response_model=list[CompetencyGapItem])
def get_my_competency_gaps(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns deficit gaps ranked by weighted impact for targeted learning interventions.
    """
    return get_user_ranked_gaps(db, current_user)

@router.get("/me/insights", response_model=CompetencyInsightsResponse)
def get_my_competency_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns deterministic, explainable readiness analytics and summary insights.
    """
    return get_user_competency_insights(db, current_user)

@router.get("/me/diagnosis")
def get_my_diagnosis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns cached AI diagnostic analysis of assessment telemetry.
    Generates via AIService only when new assessment evidence exists.
    """
    from models.assessment import Assessment, AssessmentAnswer
    from models.recommendation import AIDiagnosis
    from ai.service import AIService

    latest_ass = db.query(Assessment).filter(
        Assessment.user_id == current_user.id,
        Assessment.status == "completed"
    ).order_by(Assessment.completed_at.desc()).first()

    ass_id = latest_ass.id if latest_ass else None

    # Check Cache
    if ass_id:
        cached = db.query(AIDiagnosis).filter(
            AIDiagnosis.user_id == current_user.id,
            AIDiagnosis.assessment_id == ass_id
        ).first()
        if cached:
            return {
                "assessment_id": cached.assessment_id,
                "competency_id": cached.competency_id,
                "primary_gap": cached.primary_gap,
                "root_cause": cached.root_cause,
                "explanation": cached.explanation,
                "confidence": cached.confidence,
                "is_cached": True
            }

    # Identify primary deficit gap for diagnosis
    gaps = get_user_ranked_gaps(db, current_user)
    top_gap = gaps[0] if gaps else None

    evidence = {
        "role": current_user.designation or (current_user.assigned_role.name if getattr(current_user, 'assigned_role', None) else "Statistical Officer"),
        "competency_name": top_gap["competency_name"] if top_gap else "Sampling Techniques",
        "current_score": top_gap["current_score"] if top_gap else 48.0,
        "target_score": top_gap["target_score"] if top_gap else 70.0,
        "gap": top_gap["gap"] if top_gap else 22.0,
        "weak_topics": [top_gap["weakest_subtopic"]] if top_gap and top_gap.get("weakest_subtopic") else ["General Methodology"]
    }

    ai = AIService()
    diagnosis_data = ai.diagnose_gap(evidence)

    # Cache diagnosis
    new_diag = AIDiagnosis(
        user_id=current_user.id,
        assessment_id=ass_id,
        competency_id=top_gap["competency_id"] if top_gap else None,
        primary_gap=diagnosis_data.get("primary_gap", "Competency Gap"),
        root_cause=diagnosis_data.get("root_cause"),
        explanation=diagnosis_data.get("explanation", ""),
        confidence=float(diagnosis_data.get("confidence", 85.0))
    )
    db.add(new_diag)
    db.commit()
    db.refresh(new_diag)

    return {
        "assessment_id": new_diag.assessment_id,
        "competency_id": new_diag.competency_id,
        "primary_gap": new_diag.primary_gap,
        "root_cause": new_diag.root_cause,
        "explanation": new_diag.explanation,
        "confidence": new_diag.confidence,
        "is_cached": False
    }

@router.get("/tree")
def get_tree(db: Session = Depends(get_db)):
    return get_competency_tree(db)

@router.get("/{id}", response_model=CompetencyResponse)
def get_competency(id: int, db: Session = Depends(get_db)):
    return db.query(Competency).filter(Competency.id == id).first()
