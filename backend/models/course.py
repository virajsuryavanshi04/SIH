from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Course(Base):
    """Represents accredited learning resources (iGOT, SmartLearn, NSTI, Uploaded Material)."""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    provider = Column(String(100), nullable=False, default="iGOT")  # iGOT, SmartLearn, NSTI, Uploaded Material
    resource_type = Column(String(50), nullable=False, default="course")  # course, module, lab, practice, document
    external_id = Column(String(100), nullable=True)  # e.g., iGOT curriculum identifier
    igot_identifier = Column(String(100), unique=True, index=True, nullable=True)
    category = Column(String(100), nullable=True, default="Course")
    duration_seconds = Column(Integer, nullable=True)
    duration_display = Column(String(50), nullable=True)
    poster_image = Column(String(500), nullable=True)
    app_icon = Column(String(500), nullable=True)
    is_igot = Column(Boolean, default=True)
    catalogue_source = Column(String(50), nullable=True, default="IGOT.json")
    mapping_source = Column(String(50), nullable=True, default="smartlearn_curated")
    external_url = Column(String(500), nullable=True)
    url = Column(String(500), nullable=True)
    content_url = Column(String(500), nullable=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey("competency_topics.id"), nullable=True, index=True)
    difficulty = Column(String(50), nullable=False, default="intermediate")
    duration_hours = Column(Float, nullable=False, default=2.0)
    language = Column(String(50), nullable=False, default="English")
    thumbnail_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    competency = relationship("Competency", foreign_keys=[competency_id])
    competencies = relationship("CourseCompetency", back_populates="course", cascade="all, delete-orphan")
    progress = relationship("LearningProgress", back_populates="course", cascade="all, delete-orphan")
    topic = relationship("CompetencyTopic")

class CourseCompetency(Base):
    __tablename__ = "course_competencies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False, index=True)
    coverage_level = Column(Integer, nullable=False, default=100)
    confidence = Column(String(20), nullable=True, default="High")
    mapping_source = Column(String(50), nullable=True, default="smartlearn_inferred")
    is_primary = Column(Boolean, default=True)

    course = relationship("Course", back_populates="competencies")
    competency = relationship("Competency")
