from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class MisconceptionItem(BaseModel):
    topic: str
    pattern: str
    classification: str = Field(
        ..., 
        description="Classification level: OBSERVED_PATTERN, LIKELY_MISCONCEPTION, or INSUFFICIENT_EVIDENCE"
    )
    evidence_count: int = 1
    explanation: str
    high_confidence_error: bool = False

class RemediationActionItem(BaseModel):
    action_type: str = Field(
        ...,
        description="Action type: STUDY_MATERIAL, FLASHCARDS, MIND_MAP, MATERIAL_QUIZ, COURSE, REASSESSMENT"
    )
    title: str
    reason: str
    route: str
    resource_id: Optional[int] = None
    resource_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ExternalLearningResourceItem(BaseModel):
    category: str = Field(..., description="YOUTUBE, COURSE, ARTICLE, OPEN_TEXTBOOK, PRACTICE")
    category_display: str
    icon: Optional[str] = None
    purpose: str
    title: str
    provider: str
    deficient_topic: str
    reason: str
    url: str

class AssessmentDiagnosisResponse(BaseModel):
    assessment_id: int
    competency_id: Optional[int] = None
    competency_name: Optional[str] = None
    overall_score: float
    primary_bottleneck: str
    primary_bottleneck_topic: Optional[str] = None
    primary_bottleneck_reason: Optional[str] = None
    diagnostic_confidence: str = Field("MEDIUM", description="HIGH, MEDIUM, or LOW")
    evidence_summary: str
    misconceptions: List[MisconceptionItem] = []
    remediation_focus: str
    recommended_actions: List[RemediationActionItem] = []
    is_official: bool = True
    material_scope: Optional[str] = None
    external_learning_resources: List[ExternalLearningResourceItem] = []
    is_cached: bool = False

class CompetencyRemediationResponse(BaseModel):
    competency_id: int
    competency_name: str
    current_score: Optional[float] = None
    target_score: float = 70.0
    gap: float = 0.0
    status: str = "unassessed"
    diagnosis_summary: Optional[str] = None
    remediation_focus: Optional[str] = None
    weak_subtopics: List[str] = []
    learner_materials: List[Dict[str, Any]] = []
    study_notes: List[Dict[str, Any]] = []
    flashcard_decks: List[Dict[str, Any]] = []
    mind_maps: List[Dict[str, Any]] = []
    material_quizzes: List[Dict[str, Any]] = []
    recommended_courses: List[Dict[str, Any]] = []
    targeted_reassessment_available: bool = True
