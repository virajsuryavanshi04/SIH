from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    ai_reasoning = Column(Text, nullable=True)

    user = relationship("User", back_populates="learning_paths")
    items = relationship("LearningPathItem", back_populates="learning_path", cascade="all, delete-orphan")

class LearningPathItem(Base):
    __tablename__ = "learning_path_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    item_type = Column(String(50), nullable=False, default="course")  # course, module, practice, lab
    reference_id = Column(Integer, nullable=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=True)
    order = Column(Integer, nullable=False, default=1)
    status = Column(String(50), nullable=False, default="recommended")  # completed, current, recommended, locked, waived
    estimated_duration = Column(String(50), nullable=True)
    difficulty = Column(String(50), nullable=True)

    learning_path = relationship("LearningPath", back_populates="items")
    competency = relationship("Competency")

class LearningProgress(Base):
    """Tracks learner progress across courses / learning resources."""
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True, index=True)
    resource_id = Column(Integer, nullable=True)  # alias for course_id/resource_id
    status = Column(String(50), nullable=False, default="in_progress")  # not_started, in_progress, completed
    progress_percentage = Column(Float, default=0.0)
    progress_percent = Column(Float, default=0.0)  # alias for progress_percentage
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="learning_progress")
    course = relationship("Course", back_populates="progress")
