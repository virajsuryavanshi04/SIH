from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime

class MaterialUploadResponse(BaseModel):
    id: int
    title: str
    material_scope: str
    processing_status: str
    competency_id: Optional[int] = None
    competency_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    detected_topics: Optional[List[str]] = None
    mapped_competencies: Optional[Dict[str, Any]] = None
    text_length: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class MaterialResponse(BaseModel):
    id: int
    title: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    uploaded_by: int
    upload_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    processing_status: str
    material_scope: str
    competency_id: Optional[int] = None
    competency_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    extracted_text: Optional[str] = None
    detected_topics: Optional[Any] = None
    mapped_competencies: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(from_attributes=True)

class MaterialUpdateRequest(BaseModel):
    title: Optional[str] = None
    material_scope: Optional[str] = None  # OFFICIAL_COMPETENCY or OTHER_LEARNING
    competency_id: Optional[int] = None
    topic_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class QuestionGenerateRequest(BaseModel):
    count: int = 5
    difficulty: str = "intermediate"
    question_type: str = "mcq"
    cognitive_level: str = "understand"

class GeneratedQuestionResponse(BaseModel):
    id: int
    text: str
    question_type: str
    difficulty: str
    cognitive_level: str
    options: List[Dict[str, Any]]
    explanation: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Study Content Schemas
class NoteSection(BaseModel):
    heading: str
    content: str

class MaterialNotesResponse(BaseModel):
    id: int
    material_id: int
    title: str
    material_title: Optional[str] = None
    material_scope: Optional[str] = None
    competency_name: Optional[str] = None
    topic_name: Optional[str] = None
    sections: List[NoteSection]
    version: int
    status: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class FlashcardItem(BaseModel):
    id: Optional[int] = None
    front: str
    back: str
    order: int

class MaterialFlashcardsResponse(BaseModel):
    deck_id: int
    material_id: int
    title: str
    material_title: Optional[str] = None
    material_scope: Optional[str] = None
    competency_name: Optional[str] = None
    topic_name: Optional[str] = None
    version: int
    total_cards: int
    status: str
    cards: List[FlashcardItem]
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class MindMapNode(BaseModel):
    label: str
    children: Optional[List['MindMapNode']] = None

class MaterialMindMapResponse(BaseModel):
    id: int
    material_id: int
    title: Optional[str] = None
    material_title: Optional[str] = None
    material_scope: Optional[str] = None
    competency_name: Optional[str] = None
    topic_name: Optional[str] = None
    root_node: Dict[str, Any]
    version: int
    status: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class StudyContentStatusResponse(BaseModel):
    material_id: int
    has_notes: bool
    notes_version: Optional[int] = None
    has_flashcards: bool
    flashcards_version: Optional[int] = None
    flashcards_count: Optional[int] = None
    has_mind_map: bool
    mind_map_version: Optional[int] = None
    has_quiz: bool = False
    quiz_version: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class MaterialQuizStartRequest(BaseModel):
    question_count: int = 10  # 10, 15, 20
    question_type: str = "MIXED"  # SHORT_MCQ, WORD_PROBLEM, CASE_STUDY, MIXED
    model_config = ConfigDict(from_attributes=True)
