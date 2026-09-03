from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    difficulty: str = "intermediate"
    duration_hours: float = 2.0
    duration_seconds: Optional[int] = None
    duration_display: Optional[str] = None
    language: str = "English"
    provider: str = "iGOT"
    category: Optional[str] = "Course"
    resource_type: Optional[str] = "course"
    igot_identifier: Optional[str] = None
    external_id: Optional[str] = None
    external_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    poster_image: Optional[str] = None
    app_icon: Optional[str] = None
    content_url: Optional[str] = None
    is_igot: bool = True
    mapping_source: Optional[str] = "smartlearn_curated"
    is_active: bool = True
    competency_id: Optional[int] = None
    competency_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    competencies: List[dict] = []
    match_percent: Optional[float] = None
    recommendation_reasons: Optional[List[str]] = None
    model_config = ConfigDict(from_attributes=True)
