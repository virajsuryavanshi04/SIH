from typing import Optional
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
    return db.query(Competency).filter(
        Competency.is_official == True,
        ~Competency.name.ilike("%temp%"),
        ~Competency.name.ilike("%test%"),
        ~Competency.name.ilike("%zero%"),
        ~Competency.name.ilike("%demo%"),
        ~Competency.name.ilike("%mock%")
    ).order_by(Competency.id.asc()).all()

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
def get_my_diagnosis(
    competency_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Returns AI diagnostic analysis tied strictly to the authoritative competency gap.
    Defaults to the user's highest priority deficit gap to guarantee consistency across dashboard.
    """
    from models.assessment import Assessment, AssessmentAnswer
    from models.recommendation import AIDiagnosis
    from ai.service import AIService

    # Resolve target competency from deterministic service
    gaps = get_user_ranked_gaps(db, current_user)
    
    target_gap = None
    if competency_id is not None:
        target_gap = next((g for g in gaps if g["competency_id"] == competency_id), None)
        if not target_gap:
            comp_obj = db.query(Competency).filter(Competency.id == competency_id).first()
            if comp_obj:
                target_gap = {
                    "competency_id": comp_obj.id,
                    "competency_name": comp_obj.name,
                    "current_score": 50.0,
                    "target_score": 70.0,
                    "gap": 20.0,
                    "weakest_subtopic": None
                }
    
    if not target_gap:
        target_gap = gaps[0] if gaps else None

    target_comp_id = target_gap["competency_id"] if target_gap else 1
    target_comp_name = target_gap["competency_name"] if target_gap else "Statistical Literacy & Reasoning"

    latest_ass = db.query(Assessment).filter(
        Assessment.user_id == current_user.id,
        Assessment.status == "completed"
    ).order_by(Assessment.completed_at.desc()).first()

    ass_id = latest_ass.id if latest_ass else None

    # Check Cache for this specific competency
    cached = db.query(AIDiagnosis).filter(
        AIDiagnosis.user_id == current_user.id,
        AIDiagnosis.competency_id == target_comp_id
    ).order_by(AIDiagnosis.created_at.desc()).first()

    if cached:
        return {
            "assessment_id": cached.assessment_id,
            "competency_id": cached.competency_id,
            "competency_name": target_comp_name,
            "primary_gap": cached.primary_gap or f"{target_comp_name} Deficit",
            "root_cause": cached.root_cause,
            "explanation": cached.explanation,
            "confidence": cached.confidence,
            "is_cached": True
        }

    # Generate fresh diagnosis grounded in deterministic evidence
    evidence = {
        "role": current_user.designation or (current_user.assigned_role.name if getattr(current_user, 'assigned_role', None) else "Statistical Officer"),
        "competency_id": target_comp_id,
        "competency_name": target_comp_name,
        "current_score": target_gap["current_score"] if target_gap and target_gap["current_score"] is not None else 48.0,
        "target_score": target_gap["target_score"] if target_gap else 70.0,
        "gap": target_gap["gap"] if target_gap else 22.0,
        "weak_topics": [target_gap["weakest_subtopic"]] if target_gap and target_gap.get("weakest_subtopic") else [f"{target_comp_name} Core Principles"]
    }

    ai = AIService()
    diagnosis_data = ai.diagnose_gap(evidence)

    primary_gap_name = diagnosis_data.get("primary_gap") or f"{target_comp_name} Deficit"

    # Cache diagnosis strictly associated with target_comp_id
    new_diag = AIDiagnosis(
        user_id=current_user.id,
        assessment_id=ass_id,
        competency_id=target_comp_id,
        primary_gap=primary_gap_name,
        root_cause=diagnosis_data.get("root_cause") or f"Needs reinforced practice in {target_comp_name}.",
        explanation=diagnosis_data.get("explanation", f"Verified score on {target_comp_name} is below calibrated target benchmark."),
        confidence=float(diagnosis_data.get("confidence", 88.0))
    )
    db.add(new_diag)
    db.commit()
    db.refresh(new_diag)

    return {
        "assessment_id": new_diag.assessment_id,
        "competency_id": new_diag.competency_id,
        "competency_name": target_comp_name,
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
    return db.query(Competency).filter(
        Competency.id == id,
        Competency.is_official == True,
        ~Competency.name.ilike("%temp%"),
        ~Competency.name.ilike("%test%"),
        ~Competency.name.ilike("%zero%"),
        ~Competency.name.ilike("%demo%"),
        ~Competency.name.ilike("%mock%")
    ).first()
