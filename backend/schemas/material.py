from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime

class MaterialUploadResponse(BaseModel):
    id: int
    title: str
    processing_status: str
    model_config = ConfigDict(from_attributes=True)

class MaterialResponse(BaseModel):
    id: int
    title: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    uploaded_by: int
    upload_date: datetime
    processing_status: str
    extracted_text: Optional[str] = None
    detected_topics: Optional[Dict[str, Any]] = None
    mapped_competencies: Optional[Dict[str, Any]] = None
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
