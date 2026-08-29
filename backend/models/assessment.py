from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_type = Column(String(50), nullable=False, default="adaptive")  # baseline, adaptive_reassessment, practice, adaptive
    type = Column(String(50), nullable=True)  # alias for backwards compatibility
    status = Column(String(50), nullable=False, default="in_progress")  # in_progress, completed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    overall_score = Column(Float, nullable=True)
    adaptive_state = Column(JSON, nullable=True)  # stores real-time streak, per-topic difficulty, and progress

    user = relationship("User", back_populates="assessments")
    answers = relationship("AssessmentAnswer", back_populates="assessment", cascade="all, delete-orphan")
    diagnoses = relationship("AIDiagnosis", back_populates="assessment", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("competency_topics.id"), nullable=True, index=True)
    difficulty = Column(String(50), nullable=False, default="2")  # '1'=Easy, '2'=Medium, '3'=Hard or 'beginner', 'intermediate', 'advanced'
    question_text = Column(Text, nullable=False)
    text = Column(Text, nullable=True)  # alias for backwards compatibility
    options_json = Column(JSON, nullable=True)
    correct_answer = Column(String(255), nullable=True)
    explanation = Column(Text, nullable=True)
    cognitive_level = Column(String(50), nullable=False, default="understand")  # remember, understand, apply, analyze
    question_type = Column(String(50), nullable=True, default="SHORT_MCQ")  # SHORT_MCQ, WORD_PROBLEM, CASE_STUDY
    bank_question_id = Column(String(50), nullable=True, unique=True, index=True)  # SM-001, SA-002, etc.
    bank_version = Column(String(50), nullable=True, default="1.0")
    source_type = Column(String(100), nullable=True)  # STANDARD_STATISTICAL_KNOWLEDGE, OFFICIAL_DOCUMENT, AI_GENERATED
    source_title = Column(String(255), nullable=True)
    source_organization = Column(String(255), nullable=True)
    source_reference = Column(Text, nullable=True)
    source_material_id = Column(Integer, ForeignKey("learning_materials.id"), nullable=True)
    is_ai_generated = Column(Boolean, default=False)
    source = Column(String(50), nullable=False, default="seeded")
    status = Column(String(50), nullable=False, default="approved")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    competency = relationship("Competency")
    topic = relationship("CompetencyTopic", back_populates="questions")
    material = relationship("LearningMaterial", foreign_keys=[source_material_id])

class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    order = Column(Integer, nullable=False, default=1)

    question = relationship("Question", back_populates="options")

class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    selected_answer = Column(Text, nullable=True)
    selected_option_id = Column(Integer, ForeignKey("question_options.id"), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    confidence_level = Column(Integer, nullable=False, default=2)  # 1 = Low, 2 = Medium, 3 = High
    response_time = Column(Integer, nullable=True)  # in seconds
    time_taken_seconds = Column(Integer, nullable=True)  # alias for response_time
    answered_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("Assessment", back_populates="answers")
    question = relationship("Question")
    selected_option = relationship("QuestionOption")

class UserQuestionHistory(Base):
    """Tracks seen questions per user to prevent repetitive exposure."""
    __tablename__ = "user_question_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    times_seen = Column(Integer, default=1)
    last_seen = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="question_history")
    question = relationship("Question")
