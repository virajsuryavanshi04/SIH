from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any

class LearnerDashboardResponse(BaseModel):
    user_name: str
    overall_score: float
    score_delta: float
    competency_scores: List[Dict[str, Any]]
    ai_insight: Dict[str, Any]
    recent_activity: List[Dict[str, Any]]
    recommended_action: str
    model_config = ConfigDict(from_attributes=True)
