from pydantic import BaseModel, ConfigDict
from typing import List, Optional
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

class UserCompetencyStateResponse(BaseModel):
    competency_id: int
    competency_name: str
    domain: Optional[str] = None
    current_score: Optional[float] = None  # None if not yet assessed
    target_score: float
    confidence: float
    status: str  # not_assessed, strong, on_track, needs_attention, critical_gap
    gap: Optional[float] = None
    last_assessed: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class CompetencyScoreResponse(BaseModel):
    competency_id: int
    competency_name: str
    score: float
    required_level: int
    gap: float
    priority: int
    model_config = ConfigDict(from_attributes=True)

class CompetencyGapResponse(BaseModel):
    competency: CompetencyResponse
    current_score: Optional[float] = None
    required_level: int
    target_score: Optional[float] = None
    gap: float
    priority: float
    prerequisite_gaps: List[dict] = []
    model_config = ConfigDict(from_attributes=True)

class CompetencyTreeNode(BaseModel):
    id: int
    name: str
    score: Optional[float] = None
    required: Optional[int] = None
    children: List['CompetencyTreeNode'] = []
    model_config = ConfigDict(from_attributes=True)
