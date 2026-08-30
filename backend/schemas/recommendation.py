from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class NextStepDetails(BaseModel):
    type: str  # NOTES | FLASHCARDS | MIND_MAP | QUIZ | COURSE | PATH | ASSESSMENT
    label: str
    route: str
    metadata: Optional[Dict[str, Any]] = None

class ResourceDetails(BaseModel):
    type: str  # material | course | learning_path_item | assessment
    id: Optional[int] = None
    title: str
    metadata: Optional[Dict[str, Any]] = None

class NextActionResponse(BaseModel):
    action_type: str  # STUDY_MATERIAL | FLASHCARDS | MIND_MAP | MATERIAL_QUIZ | COURSE | LEARNING_PATH | ASSESSMENT | CONTINUE_LEARNING
    priority: str  # HIGH | MEDIUM | LOW
    title: str
    reason: str
    competency_id: Optional[int] = None
    competency_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    current_score: Optional[float] = None
    target_score: Optional[float] = None
    gap: Optional[float] = None
    resource: Optional[ResourceDetails] = None
    next_step: NextStepDetails

class RecommendationScoreComponents(BaseModel):
    gap_relevance: float
    role_relevance: float
    subtopic_match: float
    difficulty_suitability: float
    duration_suitability: float

class CourseRecommendationResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    provider: str
    resource_type: str
    difficulty: Optional[str] = None
    duration_hours: Optional[float] = None
    language: Optional[str] = None
    thumbnail_url: Optional[str] = None
    content_url: Optional[str] = None
    competency_id: Optional[int] = None
    competency_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    match_percent: float
    match_score: float
    explanation: str
    recommendation_reasons: List[str]
    score_components: Optional[RecommendationScoreComponents] = None
    progress_status: str
    progress_percent: float
    is_enrolled: bool
