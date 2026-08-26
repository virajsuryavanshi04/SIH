from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.competency_score import CompetencyScore

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/")
def get_progress(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scores = db.query(CompetencyScore).filter(CompetencyScore.user_id == current_user.id).order_by(CompetencyScore.assessed_at.asc()).all()
    history = {}
    for s in scores:
        cname = s.competency.name
        if cname not in history:
            history[cname] = []
        history[cname].append({"date": s.assessed_at.isoformat(), "score": s.score})
        
    return [{"competency_name": k, "scores_over_time": v, "improvement_delta": v[-1]["score"] - v[0]["score"] if len(v) > 1 else 0.0} for k, v in history.items()]

@router.get("/improvement")
def get_improvement(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return []
