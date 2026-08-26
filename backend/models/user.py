from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    name = Column(String(150), nullable=True)  # alias for name
    role = Column(String(50), nullable=False, default="learner")  # system permission role: 'learner' | 'admin'
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True, index=True)  # professional role reference
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    department_name = Column(String(100), nullable=True)  # cached department name
    designation = Column(String(100), nullable=True)  # e.g., 'Statistical Officer'
    experience_years = Column(Integer, nullable=True, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    role_rel = relationship("Role", back_populates="users")
    department = relationship("Department", back_populates="users")
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    learning_paths = relationship("LearningPath", back_populates="user", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="user", cascade="all, delete-orphan")
    user_competencies = relationship("UserCompetency", back_populates="user", cascade="all, delete-orphan")
    competency_scores = relationship("CompetencyScore", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("AIRecommendation", back_populates="user", cascade="all, delete-orphan")
    diagnoses = relationship("AIDiagnosis", back_populates="user", cascade="all, delete-orphan")
    question_history = relationship("UserQuestionHistory", back_populates="user", cascade="all, delete-orphan")
