from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class UserCompetency(Base):
    """Represents the user's current live competency state derived from assessment evidence."""
    __tablename__ = "user_competencies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False, index=True)
    current_score = Column(Float, nullable=True, default=None)  # None = not yet assessed
    target_score = Column(Float, nullable=False, default=70.0)
    confidence = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="not_assessed")  # not_assessed, strong, on_track, needs_attention, critical_gap
    last_assessed = Column(DateTime, nullable=True, default=None)

    user = relationship("User", back_populates="user_competencies")
    competency = relationship("Competency", back_populates="user_competencies")

class CompetencyScore(Base):
    """Historical competency measurements over time (never overwritten)."""
    __tablename__ = "competency_scores"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    source = Column(String(50), nullable=False, default="assessment")  # assessment, baseline, practice, adaptive

    user = relationship("User", back_populates="competency_scores")
    competency = relationship("Competency", back_populates="scores_history")
    assessment = relationship("Assessment")
