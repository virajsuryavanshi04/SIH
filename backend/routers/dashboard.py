from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.assessment import Assessment
from services.competency_service import (
    get_user_detailed_competencies, 
    get_user_ranked_gaps, 
    get_user_competency_insights
)
from schemas.dashboard import LearnerDashboardResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/learner", response_model=LearnerDashboardResponse)
def get_learner_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    insights = get_user_competency_insights(db, current_user)
    detailed = get_user_detailed_competencies(db, current_user)
    gaps = get_user_ranked_gaps(db, current_user)

    # Format competency list
    comp_list = []
    for d in detailed:
        comp_list.append({
            "competency_id": d["competency_id"],
            "competency_name": d["competency_name"],
            "domain": d["domain"],
            "score": d["current_score"],
            "required_level": d["target_score"],
            "gap": d["gap"] if d["gap"] is not None else 0.0,
            "status": d["status"],
            "change_points": d["change_points"],
            "trend": d["trend"]
        })

    # Recent activities (recent assessments)
    recent_assessments = db.query(Assessment).filter(
        Assessment.user_id == current_user.id
    ).order_by(Assessment.started_at.desc()).limit(3).all()

    recent_activity = [
        {
            "id": a.id,
            "title": f"{a.assessment_type.title() if a.assessment_type else 'Baseline'} Assessment #{a.id}",
            "type": a.assessment_type or "assessment",
            "score": a.overall_score,
            "timestamp": a.completed_at or a.started_at
        }
        for a in recent_assessments
    ]

    action = "Complete baseline diagnostic"
    assessed_deficits = [g for g in gaps if g.get("gap") is not None and g["gap"] > 0]
    if assessed_deficits:
        action = f"Focus on {assessed_deficits[0]['competency_name']} (Deficit: -{assessed_deficits[0]['gap']}%)"

    return {
        "user_name": current_user.full_name or "Statistical Officer",
        "overall_score": insights["overall_readiness"],
        "score_delta": insights["total_improvement_points"],
        "competency_scores": comp_list,
        "ai_insight": {
            "message": insights["diagnostic_summary"],
            "strongest": insights["strongest_competency"],
            "bottleneck": insights["priority_bottleneck_gap"]
        },
        "recent_activity": recent_activity,
        "recommended_action": action
    }
