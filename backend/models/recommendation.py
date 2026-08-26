from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=True)
    resource_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    match_score = Column(Float, nullable=True, default=85.0)
    reason = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="active")
    type = Column(String(50), nullable=False, default="course")
    content = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
    competency = relationship("Competency")
    course = relationship("Course")

class AIDiagnosis(Base):
    __tablename__ = "ai_diagnoses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=True, index=True)
    primary_gap = Column(String(255), nullable=False)
    root_cause = Column(Text, nullable=True)
    explanation = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False, default=85.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="diagnoses")
    assessment = relationship("Assessment", back_populates="diagnoses")
    competency = relationship("Competency")
