from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Competency(Base):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    domain = Column(String(100), nullable=True)
    level = Column(String(50), nullable=False, default="intermediate")
    is_official = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    topics = relationship("CompetencyTopic", back_populates="competency", cascade="all, delete-orphan")
    dependencies = relationship("CompetencyDependency", foreign_keys="[CompetencyDependency.competency_id]", back_populates="competency")
    prerequisites = relationship("CompetencyDependency", foreign_keys="[CompetencyDependency.prerequisite_id]", back_populates="prerequisite")
    role_requirements = relationship("RoleCompetency", back_populates="competency")
    user_competencies = relationship("UserCompetency", back_populates="competency")
    scores_history = relationship("CompetencyScore", back_populates="competency")

class CompetencyTopic(Base):
    __tablename__ = "competency_topics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    competency = relationship("Competency", back_populates="topics")
    questions = relationship("Question", back_populates="topic")

class CompetencyDependency(Base):
    __tablename__ = "competency_dependencies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False, index=True)
    prerequisite_id = Column(Integer, ForeignKey("competencies.id"), nullable=False, index=True)

    competency = relationship("Competency", foreign_keys=[competency_id], back_populates="dependencies")
    prerequisite = relationship("Competency", foreign_keys=[prerequisite_id], back_populates="prerequisites")

class RoleCompetency(Base):
    __tablename__ = "role_competencies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True, index=True)
    role_name = Column(String(100), nullable=False, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False, index=True)
    target_score = Column(Float, nullable=False, default=70.0)
    target_level = Column(Integer, nullable=False, default=3)
    weight = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    role_rel = relationship("Role", back_populates="competency_requirements")
    competency = relationship("Competency", back_populates="role_requirements")
