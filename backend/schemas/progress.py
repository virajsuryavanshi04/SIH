from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from schemas.competency import SubtopicScoreItem

class MilestonesCompletedSummary(BaseModel):
    courses: int = 0
    learning_path_items: int = 0
    material_quizzes: int = 0
    reassessments: int = 0
    model_config = ConfigDict(from_attributes=True)

class ProgressOverviewResponse(BaseModel):
    user_id: int
    role_name: str
    overall_readiness: float
    total_improvement_points: float
    has_baseline_history: bool = False
    assessed_competencies_count: int = 0
    benchmarks_met: int
    total_competencies: int
    critical_gaps_count: int
    milestones_completed: MilestonesCompletedSummary
    model_config = ConfigDict(from_attributes=True)

class CompetencyScorePoint(BaseModel):
    date: str
    score: float
    source: str
    assessment_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class CompetencyProgressItem(BaseModel):
    competency_id: int
    competency_name: str
    domain: Optional[str] = None
    current_score: Optional[float] = None
    target_score: float
    gap: Optional[float] = None
    previous_score: Optional[float] = None
    change_points: Optional[float] = None
    trend: str = "unassessed"  # improving, declining, steady, new, unassessed
    status: str  # not_assessed, strong, on_track, needs_attention, critical_gap
    assessment_count: int = 0
    last_assessed: Optional[datetime] = None
    weakest_subtopic: Optional[str] = None
    subtopics: List[SubtopicScoreItem] = []
    history_points: List[CompetencyScorePoint] = []
    model_config = ConfigDict(from_attributes=True)

class DifficultyAccuracy(BaseModel):
    total: int = 0
    correct: int = 0
    accuracy: float = 0.0
    model_config = ConfigDict(from_attributes=True)

class DifficultyBreakdown(BaseModel):
    level_1: DifficultyAccuracy = DifficultyAccuracy()
    level_2: DifficultyAccuracy = DifficultyAccuracy()
    level_3: DifficultyAccuracy = DifficultyAccuracy()
    model_config = ConfigDict(from_attributes=True)

class ConfidenceCalibration(BaseModel):
    high_confidence_correct: int = 0
    high_confidence_incorrect: int = 0
    low_confidence_correct: int = 0
    low_confidence_incorrect: int = 0
    model_config = ConfigDict(from_attributes=True)

class ProgressAnalyticsResponse(BaseModel):
    difficulty_breakdown: DifficultyBreakdown
    confidence_calibration: ConfidenceCalibration
    average_response_time_seconds: float = 0.0
    assessments_completed_by_type: Dict[str, int] = {}
    model_config = ConfigDict(from_attributes=True)

class TimelineItemResponse(BaseModel):
    id: str
    event_type: str  # assessment, reassessment, material_quiz, course, learning_path
    title: str
    description: str
    score: Optional[float] = None
    delta: Optional[float] = None
    timestamp: datetime
    metadata: Dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)
