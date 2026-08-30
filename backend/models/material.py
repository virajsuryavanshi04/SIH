from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Text
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
    topic_id = Column(Integer, ForeignKey("competency_topics.id"), nullable=True, index=True)
    material_scope = Column(String(50), nullable=True)  # OFFICIAL_COMPETENCY, OTHER_LEARNING
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    processing_status = Column(String(50), nullable=False, default="uploaded")  # uploaded, processing, completed, error
    extracted_text = Column(Text, nullable=True)
    detected_topics = Column(JSON, nullable=True)
    mapped_competencies = Column(JSON, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("User")
    competency = relationship("Competency")
    topic = relationship("CompetencyTopic")
    generated_questions = relationship("GeneratedQuestion", back_populates="material", cascade="all, delete-orphan")
    notes = relationship("MaterialNote", back_populates="material", cascade="all, delete-orphan", order_by="desc(MaterialNote.created_at)")
    flashcard_decks = relationship("MaterialFlashcardDeck", back_populates="material", cascade="all, delete-orphan", order_by="desc(MaterialFlashcardDeck.created_at)")
    flashcards = relationship("MaterialFlashcard", back_populates="material", cascade="all, delete-orphan")
    mind_maps = relationship("MaterialMindMap", back_populates="material", cascade="all, delete-orphan", order_by="desc(MaterialMindMap.created_at)")
    quiz_sets = relationship("MaterialQuizQuestionSet", back_populates="material", cascade="all, delete-orphan", order_by="desc(MaterialQuizQuestionSet.created_at)")

class MaterialNote(Base):
    __tablename__ = "material_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(JSON, nullable=False)  # {"title": "...", "sections": [{"heading": "...", "content": "..."}]}
    status = Column(String(50), nullable=False, default="ready")  # generating, ready, failed
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("LearningMaterial", back_populates="notes")

class MaterialFlashcardDeck(Base):
    __tablename__ = "material_flashcard_decks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    status = Column(String(50), nullable=False, default="ready")  # generating, ready, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("LearningMaterial", back_populates="flashcard_decks")
    cards = relationship("MaterialFlashcard", back_populates="deck", cascade="all, delete-orphan", order_by="MaterialFlashcard.order")

class MaterialFlashcard(Base):
    __tablename__ = "material_flashcards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    deck_id = Column(Integer, ForeignKey("material_flashcard_decks.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    order = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    deck = relationship("MaterialFlashcardDeck", back_populates="cards")
    material = relationship("LearningMaterial", back_populates="flashcards")

class MaterialMindMap(Base):
    __tablename__ = "material_mind_maps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    root_node = Column(JSON, nullable=False)  # {"label": "...", "children": [...]}
    status = Column(String(50), nullable=False, default="ready")  # generating, ready, failed
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("LearningMaterial", back_populates="mind_maps")

class MaterialQuizQuestionSet(Base):
    __tablename__ = "material_quiz_question_sets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    status = Column(String(50), nullable=False, default="ready")  # generating, ready, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("LearningMaterial", back_populates="quiz_sets")
    questions = relationship("MaterialQuizQuestion", back_populates="question_set", cascade="all, delete-orphan")

class MaterialQuizQuestion(Base):
    __tablename__ = "material_quiz_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    set_id = Column(Integer, ForeignKey("material_quiz_question_sets.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # SHORT_MCQ, WORD_PROBLEM, CASE_STUDY
    difficulty = Column(String(10), nullable=False, default="2")  # '1', '2', '3'
    cognitive_level = Column(String(50), nullable=False, default="understand")
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    concept = Column(String(255), nullable=True)
    source_reference = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    question_set = relationship("MaterialQuizQuestionSet", back_populates="questions")
    material = relationship("LearningMaterial")
    options = relationship("MaterialQuizOption", back_populates="question", cascade="all, delete-orphan", order_by="MaterialQuizOption.order")

class MaterialQuizOption(Base):
    __tablename__ = "material_quiz_options"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("material_quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    order = Column(Integer, nullable=False, default=1)

    question = relationship("MaterialQuizQuestion", back_populates="options")

class GeneratedQuestion(Base):
    __tablename__ = "generated_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    generation_config = Column(JSON, nullable=True)

    material = relationship("LearningMaterial", back_populates="generated_questions")
    question = relationship("Question")
