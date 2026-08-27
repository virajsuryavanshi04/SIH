from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class StartAssessmentRequest(BaseModel):
    assessment_type: Optional[str] = "baseline"  # baseline, adaptive_reassessment, practice, adaptive
    competency_ids: Optional[List[int]] = None
    difficulty: Optional[str] = None
    question_count: Optional[int] = None

class SubmitAnswerRequest(BaseModel):
    question_id: int
    selected_option_id: int
    confidence_level: Optional[int] = 2  # 1 = Low, 2 = Medium, 3 = High
    time_taken_seconds: Optional[int] = 15

class AdaptiveStepRequest(BaseModel):
    question_id: int
    selected_option_id: int
    confidence_level: Optional[int] = 2
    time_taken_seconds: Optional[int] = 15

class OptionResponse(BaseModel):
    id: int
    text: str
    order: int
    model_config = ConfigDict(from_attributes=True)

class QuestionResponse(BaseModel):
    id: int
    text: str
    question_text: Optional[str] = None
    question_type: str = "mcq"
    difficulty: str
    competency_id: int
    competency_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    cognitive_level: str
    options: List[OptionResponse]
    model_config = ConfigDict(from_attributes=True)

class AssessmentStartResponse(BaseModel):
    assessment_id: int
    assessment_type: str
    total_questions: int
    competencies_covered: List[str]
    questions: List[QuestionResponse]
    model_config = ConfigDict(from_attributes=True)

class CompetencyBreakdownItem(BaseModel):
    competency_id: int
    competency_name: str
    domain: Optional[str] = None
    current_score: float
    target_score: float
    gap: float
    status: str  # strong, on_track, needs_attention, critical_gap
    questions_total: int
    questions_correct: int
    accuracy_percent: float
    model_config = ConfigDict(from_attributes=True)

class LargestGapSummary(BaseModel):
    competency_id: int
    competency_name: str
    current_score: float
    target_score: float
    gap: float
    model_config = ConfigDict(from_attributes=True)

class StrongestCompetencyItem(BaseModel):
    competency_id: int
    competency_name: str
    score: float
    target_score: float
    model_config = ConfigDict(from_attributes=True)

class NeedsAttentionItem(BaseModel):
    competency_id: int
    competency_name: str
    score: float
    target_score: float
    gap: float
    model_config = ConfigDict(from_attributes=True)

class AssessmentResultResponse(BaseModel):
    assessment_id: int
    assessment_type: str
    overall_readiness: float
    overall_score: float
    total_questions: int
    total_correct: int
    strongest_competencies: List[StrongestCompetencyItem] = []
    needs_attention: List[NeedsAttentionItem] = []
    largest_gap: Optional[LargestGapSummary] = None
    competency_breakdown: List[CompetencyBreakdownItem] = []
    message: str = "Let's understand where you need to improve."
    model_config = ConfigDict(from_attributes=True)

class AdaptiveStepResponse(BaseModel):
    is_completed: bool
    question_generation_required: bool = False
    step: Optional[int] = None
    total_steps: Optional[int] = None
    next_question: Optional[QuestionResponse] = None
    result: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
