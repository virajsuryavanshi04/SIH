from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class LearningPathItemResponse(BaseModel):
    id: int
    learning_path_id: int
    title: str
    description: Optional[str]
    item_type: str
    reference_id: Optional[int]
    competency_id: Optional[int]
    order: int
    status: str
    estimated_duration: Optional[str]
    difficulty: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class LearningPathResponse(BaseModel):
    id: int
    items: List[LearningPathItemResponse]
    ai_reasoning: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProgressResponse(BaseModel):
    competency_name: str
    scores_over_time: List[dict]
    improvement_delta: float
    model_config = ConfigDict(from_attributes=True)
