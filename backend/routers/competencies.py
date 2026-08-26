from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.competency import Competency
from models.user_competency import UserCompetency
from services.competency_service import get_user_competency_scores, compute_user_gaps, get_competency_tree
from schemas.competency import CompetencyResponse, UserCompetencyStateResponse

router = APIRouter(prefix="/api/competencies", tags=["competencies"])

@router.get("/", response_model=list[CompetencyResponse])
def list_competencies(db: Session = Depends(get_db)):
    """List all official competencies and their hierarchical subtopics."""
    return db.query(Competency).all()

@router.get("/me", response_model=list[UserCompetencyStateResponse])
def get_my_competencies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get authenticated user's current live competency states derived from assessment evidence."""
    user_comps = db.query(UserCompetency).filter(UserCompetency.user_id == current_user.id).all()
    
    if not user_comps:
        gaps = compute_user_gaps(db, current_user.id)
        results = []
        for g in gaps:
            comp = g["competency"]
            score = g["current_score"]
            target = g["required_level"]
            gap = g["gap"]
            status = "strong" if score >= target else ("on_track" if score >= target - 10 else ("critical_gap" if gap > 20 else "needs_attention"))
            results.append(UserCompetencyStateResponse(
                competency_id=comp.id,
                competency_name=comp.name,
                domain=comp.domain,
                current_score=score,
                target_score=target,
                confidence=85.0,
                status=status,
                gap=gap
            ))
        return results

    results = []
    for uc in user_comps:
        gap = max(0.0, uc.target_score - uc.current_score) if uc.current_score is not None else None
        results.append(UserCompetencyStateResponse(
            competency_id=uc.competency_id,
            competency_name=uc.competency.name if uc.competency else "Unknown",
            domain=uc.competency.domain if uc.competency else None,
            current_score=uc.current_score,
            target_score=uc.target_score,
            confidence=uc.confidence,
            status=uc.status,
            gap=gap,
            last_assessed=uc.last_assessed
        ))
    return results

@router.get("/tree")
def get_tree(db: Session = Depends(get_db)):
    return get_competency_tree(db)

@router.get("/user/scores")
def get_user_scores(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scores = get_user_competency_scores(db, current_user.id)
    return [{"competency_id": k, "score": v.score} for k, v in scores.items()]

@router.get("/user/gaps")
def get_user_gaps(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return compute_user_gaps(db, current_user.id)

@router.get("/{id}", response_model=CompetencyResponse)
def get_competency(id: int, db: Session = Depends(get_db)):
    return db.query(Competency).filter(Competency.id == id).first()
