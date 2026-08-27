from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class TopicResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CompetencyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    domain: Optional[str] = None
    level: str
    topics: List[TopicResponse] = []
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class SubtopicScoreItem(BaseModel):
    topic_id: int
    topic_name: str
    competency_id: int
    score: Optional[float] = None
    questions_total: int = 0
    questions_correct: int = 0
    status: str = "untested"  # strong, on_track, weak, untested
    model_config = ConfigDict(from_attributes=True)

class UserCompetencyStateResponse(BaseModel):
    competency_id: int
    competency_name: str
    domain: Optional[str] = None
    current_score: Optional[float] = None  # None if not yet assessed
    target_score: float
    weight: Optional[float] = 1.0
    confidence: float
    status: str  # not_assessed, strong, on_track, needs_attention, critical_gap
    gap: Optional[float] = None
    previous_score: Optional[float] = None
    change_points: Optional[float] = None
    percentage_improvement: Optional[float] = None
    assessment_count: int = 0
    trend: str = "unassessed"  # improving, declining, steady, new, unassessed
    last_assessed: Optional[datetime] = None
    subtopics: List[SubtopicScoreItem] = []
    weakest_subtopic: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CompetencyHistoryItem(BaseModel):
    id: int
    competency_id: int
    competency_name: str
    score: float
    assessment_id: Optional[int] = None
    source: str = "assessment"
    assessed_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CompetencyGapItem(BaseModel):
    competency_id: int
    competency_name: str
    domain: Optional[str] = None
    current_score: Optional[float] = None
    target_score: float
    gap: float
    priority_weight: float
    status: str
    weakest_subtopic: Optional[str] = None
    recommended_action: str
    model_config = ConfigDict(from_attributes=True)

class CompetencyInsightsResponse(BaseModel):
    overall_readiness: float
    total_assessments_taken: int
    total_improvement_points: float
    assessed_competencies_count: int
    total_role_competencies_count: int
    targets_met_count: int
    critical_gaps_count: int
    strongest_competency: Optional[Dict[str, Any]] = None
    priority_bottleneck_gap: Optional[Dict[str, Any]] = None
    weakest_subtopic_insight: Optional[Dict[str, Any]] = None
    diagnostic_summary: str
    model_config = ConfigDict(from_attributes=True)

class CompetencyTreeNode(BaseModel):
    id: int
    name: str
    score: Optional[float] = None
    required: Optional[int] = None
    children: List['CompetencyTreeNode'] = []
    model_config = ConfigDict(from_attributes=True)
