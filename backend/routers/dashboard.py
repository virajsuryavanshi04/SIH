from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from services.competency_service import compute_overall_score, compute_user_gaps, compute_improvement_delta
from schemas.dashboard import LearnerDashboardResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/learner", response_model=LearnerDashboardResponse)
def get_learner_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    overall = compute_overall_score(db, current_user.id)
    gaps = compute_user_gaps(db, current_user.id)
    delta = compute_improvement_delta(db, current_user.id)
    
    strongest = "N/A"
    weakest = "N/A"
    
    # Evaluate from gaps list (sorted by priority descending)
    # The gap with highest priority (largest gap) is the weakest area
    if gaps:
        weakest = gaps[0]["competency"].name
        # The one with the lowest priority (smallest gap or no gap) is the strongest
        strongest = gaps[-1]["competency"].name

    ai_msg = f"Your strongest area is {strongest}. Focus on improving {weakest} to meet role requirements."
    
    return {
        "user_name": current_user.full_name,
        "overall_score": overall,
        "score_delta": delta,
        "competency_scores": [
            {
                "competency_id": g["competency"].id,
                "competency_name": g["competency"].name,
                "score": g["current_score"],
                "required_level": g["required_level"],
                "gap": g["gap"],
                "priority": g["priority"]
            } for g in gaps
        ],
        "ai_insight": {"message": ai_msg},
        "recent_activity": [],
        "recommended_action": f"Take a course in {weakest}"
    }
