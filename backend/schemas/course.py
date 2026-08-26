from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    difficulty: str
    duration_hours: float
    language: str
    provider: str
    thumbnail_url: Optional[str]
    content_url: Optional[str]
    is_active: bool
    competencies: List[dict] = []
    match_percent: Optional[float] = None
    recommendation_reasons: Optional[List[str]] = None
    model_config = ConfigDict(from_attributes=True)
