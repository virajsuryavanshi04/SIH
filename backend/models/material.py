from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class LearningMaterial(Base):
    __tablename__ = "learning_materials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String(500), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=True, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    processing_status = Column(String(50), nullable=False, default="uploaded")  # uploaded, processing, indexed, error
    extracted_text = Column(Text, nullable=True)
    detected_topics = Column(JSON, nullable=True)
    mapped_competencies = Column(JSON, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("User")
    competency = relationship("Competency")
    generated_questions = relationship("GeneratedQuestion", back_populates="material", cascade="all, delete-orphan")

class GeneratedQuestion(Base):
    __tablename__ = "generated_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    generation_config = Column(JSON, nullable=True)

    material = relationship("LearningMaterial", back_populates="generated_questions")
    question = relationship("Question")
