from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class StartAssessmentRequest(BaseModel):
    assessment_type: Optional[str] = "adaptive"  # baseline, adaptive_reassessment, practice, adaptive
    competency_id: Optional[int] = None
    competency_ids: Optional[List[int]] = None
    question_type: Optional[str] = "MIXED"  # SHORT_MCQ, WORD_PROBLEM, CASE_STUDY, MIXED
    question_count: Optional[int] = 10  # 10, 15, 20
    difficulty: Optional[str] = None
    adaptive_mode: Optional[bool] = True

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
    question_type: str = "SHORT_MCQ"
    difficulty: str
    competency_id: Optional[int] = None
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
    current_score: Optional[float] = None
    estimated_competency: Optional[float] = None
    target_score: float
    gap: float
    status: str  # strong, on_track, needs_attention, critical_gap
    questions_total: int
    questions_correct: int
    accuracy_percent: float
    evidence_count: Optional[int] = 0
    evidence_level: Optional[str] = "LOW"
    confidence: Optional[float] = 0.0
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

class AssessmentConfigurationSummary(BaseModel):
    competency_summary: str
    question_type: str
    question_count: int
    difficulty_mode: str
    model_config = ConfigDict(from_attributes=True)

class PerformanceDimensionItem(BaseModel):
    name: str
    total: int
    correct: int
    accuracy_percent: float
    model_config = ConfigDict(from_attributes=True)

class ConfidencePerformanceSummary(BaseModel):
    high_count: int = 0
    high_correct: int = 0
    medium_count: int = 0
    medium_correct: int = 0
    low_count: int = 0
    low_correct: int = 0
    model_config = ConfigDict(from_attributes=True)

class QuestionReviewOption(BaseModel):
    id: int
    text: str
    order: int
    is_correct: bool = False
    model_config = ConfigDict(from_attributes=True)

class QuestionReviewItem(BaseModel):
    question_id: int
    question_number: int
    question_type: str
    question_text: str
    difficulty: str
    competency_id: Optional[int] = None
    competency_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    options: List[QuestionReviewOption]
    learner_selected_option_id: Optional[int] = None
    learner_selected_text: Optional[str] = None
    correct_option_id: Optional[int] = None
    correct_option_text: Optional[str] = None
    is_correct: bool
    confidence_level: Optional[int] = None
    time_taken_seconds: Optional[int] = None
    explanation: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ReassessmentSummary(BaseModel):
    competency_id: int
    competency_name: str
    previous_score: Optional[float] = None
    current_score: float
    target_score: float
    score_delta: float
    previous_gap: Optional[float] = None
    current_gap: float
    status: str  # MET_BENCHMARK | IMPROVED_ON_TRACK | NEEDS_ADDITIONAL_PRACTICE | INITIAL_MEASUREMENT
    model_config = ConfigDict(from_attributes=True)

class AssessmentResultResponse(BaseModel):
    assessment_id: int
    assessment_type: str
    source_material_id: Optional[int] = None
    source_material_title: Optional[str] = None
    material_scope: Optional[str] = None
    is_official: Optional[bool] = None
    overall_readiness: float
    overall_score: float
    total_questions: int
    total_correct: int
    total_incorrect: int = 0
    configuration: Optional[AssessmentConfigurationSummary] = None
    strongest_competencies: List[StrongestCompetencyItem] = []
    needs_attention: List[NeedsAttentionItem] = []
    largest_gap: Optional[LargestGapSummary] = None
    competency_breakdown: List[CompetencyBreakdownItem] = []
    question_type_performance: List[PerformanceDimensionItem] = []
    difficulty_performance: List[PerformanceDimensionItem] = []
    confidence_performance: Optional[ConfidencePerformanceSummary] = None
    weak_areas: List[str] = []
    adaptive_summary: Optional[str] = None
    reassessment_summary: Optional[ReassessmentSummary] = None
    responses: List[QuestionReviewItem] = []
    message: str = "Assessment diagnostic results recorded."
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
