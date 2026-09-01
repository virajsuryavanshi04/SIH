from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user, require_admin
from models.user import User
from models.material import LearningMaterial, GeneratedQuestion, MaterialQuizQuestionSet, MaterialQuizQuestion, MaterialQuizOption
from models.assessment import Assessment, Question, QuestionOption
from models.competency import Competency
from services.document_service import validate_file, save_upload, extract_text
from ai.service import AIService
from config import settings
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/materials", tags=["materials"])

from models.competency import Competency, CompetencyTopic
from schemas.material import MaterialUploadResponse, MaterialResponse, MaterialUpdateRequest, MaterialQuizStartRequest

@router.post("/upload")
def upload_material(
    file: UploadFile = File(...), 
    material_scope: str = Form(...),
    title: Optional[str] = Form(None),
    competency_id: Optional[int] = Form(None),
    topic_id: Optional[int] = Form(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Uploads study material (PDF/Word/PowerPoint/Text), validates classification scope and files,
    extracts text, and preserves full provenance.
    """
    # 1. Validate file extension and MIME type
    if not validate_file(file):
        raise HTTPException(
            status_code=400, 
            detail="Invalid or unsupported file type. Supported formats: PDF, DOCX, PPTX, TXT. Executable files are strictly prohibited."
        )

    # 2. Validate material_scope
    scope_val = material_scope.strip().upper()
    if scope_val not in ["OFFICIAL_COMPETENCY", "OTHER_LEARNING"]:
        raise HTTPException(
            status_code=422,
            detail="Invalid material_scope. Must be explicitly provided as 'OFFICIAL_COMPETENCY' or 'OTHER_LEARNING'."
        )

    # 3. Validate scope-specific competency and topic associations
    target_comp_id = None
    target_topic_id = None

    if scope_val == "OFFICIAL_COMPETENCY":
        if not competency_id:
            raise HTTPException(
                status_code=422,
                detail="competency_id is required when material_scope is OFFICIAL_COMPETENCY."
            )
        comp = db.query(Competency).filter(Competency.id == competency_id).first()
        if not comp:
            raise HTTPException(status_code=422, detail=f"Competency with ID {competency_id} not found.")
        target_comp_id = comp.id

        if topic_id:
            topic = db.query(CompetencyTopic).filter(CompetencyTopic.id == topic_id).first()
            if not topic or topic.competency_id != target_comp_id:
                raise HTTPException(
                    status_code=422,
                    detail="Specified topic does not belong to the selected competency."
                )
            target_topic_id = topic.id
    else:
        # OTHER_LEARNING: Must NOT have competency or topic
        target_comp_id = None
        target_topic_id = None

    # 4. Save file safely
    path = save_upload(file, settings.UPLOAD_DIR)

    # 5. Extract text
    extracted_text_content = extract_text(path, file.content_type)
    
    is_readable = bool(extracted_text_content and len(extracted_text_content.strip()) > 0)
    processing_status = "completed" if is_readable else "error"

    # Optional AI summarization if text is available
    detected_topics = []
    mapped_comps = {}
    if is_readable:
        try:
            ai = AIService()
            summary = ai.summarize_material(extracted_text_content)
            detected_topics = summary.get("topics", [])
            mapped_comps = summary.get("competency_mappings", {})
        except Exception:
            detected_topics = ["General Content"]
            mapped_comps = {}

    clean_title = title.strip() if title and title.strip() else file.filename.replace(".pdf", "").replace("_", " ")

    material = LearningMaterial(
        title=clean_title,
        filename=os.path.basename(path),
        original_filename=file.filename,
        file_type=file.content_type or "application/pdf",
        file_size=os.path.getsize(path) if os.path.exists(path) else 0,
        storage_path=path,
        competency_id=target_comp_id,
        topic_id=target_topic_id,
        material_scope=scope_val,
        uploaded_by=current_user.id,
        extracted_text=extracted_text_content,
        detected_topics=detected_topics,
        mapped_competencies=mapped_comps,
        processing_status=processing_status
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    comp_name = material.competency.name if material.competency else None
    topic_name = material.topic.name if material.topic else None

    return {
        "id": material.id, 
        "title": material.title,
        "material_scope": material.material_scope,
        "processing_status": material.processing_status,
        "competency_id": material.competency_id,
        "competency_name": comp_name,
        "topic_id": material.topic_id,
        "topic_name": topic_name,
        "detected_topics": material.detected_topics,
        "mapped_competencies": material.mapped_competencies,
        "text_length": len(extracted_text_content) if extracted_text_content else 0
    }

@router.get("/")
def list_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists uploaded documents.
    Admin users see all system materials.
    Learner users see only their own uploaded materials.
    """
    query = db.query(LearningMaterial)
    if current_user.role != "admin":
        query = query.filter(LearningMaterial.uploaded_by == current_user.id)
        
    materials = query.order_by(LearningMaterial.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "filename": m.original_filename or m.filename,
            "original_filename": m.original_filename or m.filename,
            "file_type": m.file_type,
            "file_size": m.file_size,
            "uploaded_by": m.uploaded_by,
            "upload_date": m.upload_date or m.created_at,
            "created_at": m.created_at or m.upload_date,
            "processing_status": m.processing_status,
            "material_scope": m.material_scope or ("OFFICIAL_COMPETENCY" if m.competency_id else "OTHER_LEARNING"),
            "competency_id": m.competency_id,
            "competency_name": m.competency.name if m.competency else None,
            "topic_id": m.topic_id,
            "topic_name": m.topic.name if m.topic else None,
            "detected_topics": m.detected_topics or [],
            "mapped_competencies": m.mapped_competencies or {},
        }
        for m in materials
    ]

@router.get("/{id}")
def get_material(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches details for an uploaded material with server-side ownership verification."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
        
    if mat.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own uploaded materials.")

    return {
        "id": mat.id,
        "title": mat.title,
        "filename": mat.original_filename or mat.filename,
        "original_filename": mat.original_filename or mat.filename,
        "file_type": mat.file_type,
        "file_size": mat.file_size,
        "uploaded_by": mat.uploaded_by,
        "upload_date": mat.upload_date or mat.created_at,
        "created_at": mat.created_at or mat.upload_date,
        "processing_status": mat.processing_status,
        "material_scope": mat.material_scope or ("OFFICIAL_COMPETENCY" if mat.competency_id else "OTHER_LEARNING"),
        "competency_id": mat.competency_id,
        "competency_name": mat.competency.name if mat.competency else None,
        "topic_id": mat.topic_id,
        "topic_name": mat.topic.name if mat.topic else None,
        "detected_topics": mat.detected_topics or [],
        "mapped_competencies": mat.mapped_competencies or {},
    }

@router.patch("/{id}")
def update_material_metadata(
    id: int,
    req: MaterialUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates metadata for an uploaded material with ownership check."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    if mat.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. You can only modify your own uploaded materials.")

    if req.title is not None and req.title.strip():
        mat.title = req.title.strip()

    # Scope update
    target_scope = req.material_scope.strip().upper() if req.material_scope else mat.material_scope

    if target_scope == "OFFICIAL_COMPETENCY":
        comp_id = req.competency_id or mat.competency_id
        if not comp_id:
            raise HTTPException(
                status_code=422,
                detail="competency_id is required when material_scope is OFFICIAL_COMPETENCY."
            )
        comp = db.query(Competency).filter(Competency.id == comp_id).first()
        if not comp:
            raise HTTPException(status_code=422, detail=f"Competency with ID {comp_id} not found.")

        target_topic_id = req.topic_id if req.topic_id is not None else mat.topic_id
        if target_topic_id:
            topic = db.query(CompetencyTopic).filter(CompetencyTopic.id == target_topic_id).first()
            if not topic or topic.competency_id != comp_id:
                raise HTTPException(status_code=422, detail="Specified topic does not belong to the selected competency.")

        mat.material_scope = "OFFICIAL_COMPETENCY"
        mat.competency_id = comp_id
        mat.topic_id = target_topic_id

    elif target_scope == "OTHER_LEARNING":
        mat.material_scope = "OTHER_LEARNING"
        mat.competency_id = None
        mat.topic_id = None

    db.commit()
    db.refresh(mat)

    return {
        "id": mat.id,
        "title": mat.title,
        "material_scope": mat.material_scope,
        "competency_id": mat.competency_id,
        "competency_name": mat.competency.name if mat.competency else None,
        "topic_id": mat.topic_id,
        "topic_name": mat.topic.name if mat.topic else None,
        "processing_status": mat.processing_status
    }

@router.delete("/{id}")
def delete_material(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes an uploaded material with server-side ownership verification."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    if mat.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. You can only delete your own uploaded materials.")

    db.delete(mat)
    db.commit()
    return {"status": "success", "message": f"Material #{id} deleted successfully."}

# ============================================================
# PHASE 5B: AI STUDY CONTENT ENDPOINTS (NOTES, FLASHCARDS, MIND MAP)
# ============================================================

from sqlalchemy import func
from models.material import MaterialNote, MaterialFlashcardDeck, MaterialFlashcard, MaterialMindMap
from schemas.material import (
    MaterialNotesResponse,
    MaterialFlashcardsResponse,
    MaterialMindMapResponse,
    StudyContentStatusResponse
)

def _verify_material_access(mat, current_user):
    """Shared ownership check for material endpoints."""
    if mat.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. You can only access your own materials.")

@router.get("/{id}/study-content-status")
def get_study_content_status(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Checks current generation state for notes, flashcards, mind maps, and quiz sets."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    _verify_material_access(mat, current_user)

    # Notes — check any status (generating, ready, failed)
    latest_note = db.query(MaterialNote).filter(
        MaterialNote.material_id == id
    ).order_by(MaterialNote.version.desc()).first()
    latest_ready_note = db.query(MaterialNote).filter(
        MaterialNote.material_id == id, MaterialNote.status == "ready"
    ).order_by(MaterialNote.version.desc()).first()

    # Flashcards
    latest_deck = db.query(MaterialFlashcardDeck).filter(
        MaterialFlashcardDeck.material_id == id
    ).order_by(MaterialFlashcardDeck.version.desc()).first()
    latest_ready_deck = db.query(MaterialFlashcardDeck).filter(
        MaterialFlashcardDeck.material_id == id, MaterialFlashcardDeck.status == "ready"
    ).order_by(MaterialFlashcardDeck.version.desc()).first()

    # Mind Map
    latest_mm = db.query(MaterialMindMap).filter(
        MaterialMindMap.material_id == id
    ).order_by(MaterialMindMap.version.desc()).first()
    latest_ready_mm = db.query(MaterialMindMap).filter(
        MaterialMindMap.material_id == id, MaterialMindMap.status == "ready"
    ).order_by(MaterialMindMap.version.desc()).first()

    # Quiz
    latest_quiz = db.query(MaterialQuizQuestionSet).filter(
        MaterialQuizQuestionSet.material_id == id
    ).order_by(MaterialQuizQuestionSet.version.desc()).first()
    latest_ready_quiz = db.query(MaterialQuizQuestionSet).filter(
        MaterialQuizQuestionSet.material_id == id, MaterialQuizQuestionSet.status == "ready"
    ).order_by(MaterialQuizQuestionSet.version.desc()).first()

    return {
        "material_id": id,
        "has_notes": bool(latest_ready_note),
        "notes_status": latest_note.status if latest_note else None,
        "notes_version": latest_ready_note.version if latest_ready_note else None,
        "notes_updated_at": str(latest_ready_note.created_at) if latest_ready_note else None,
        "has_flashcards": bool(latest_ready_deck),
        "flashcards_status": latest_deck.status if latest_deck else None,
        "flashcards_version": latest_ready_deck.version if latest_ready_deck else None,
        "flashcards_count": len(latest_ready_deck.cards) if latest_ready_deck else None,
        "flashcards_updated_at": str(latest_ready_deck.created_at) if latest_ready_deck else None,
        "has_mind_map": bool(latest_ready_mm),
        "mind_map_status": latest_mm.status if latest_mm else None,
        "mind_map_version": latest_ready_mm.version if latest_ready_mm else None,
        "mind_map_updated_at": str(latest_ready_mm.created_at) if latest_ready_mm else None,
        "has_quiz": bool(latest_ready_quiz),
        "quiz_status": latest_quiz.status if latest_quiz else None,
        "quiz_version": latest_ready_quiz.version if latest_ready_quiz else None,
        "quiz_updated_at": str(latest_ready_quiz.created_at) if latest_ready_quiz else None,
    }

# ============================================================
# MATERIAL WORKSPACE API (consolidated)
# ============================================================

@router.get("/{id}/workspace")
def get_material_workspace(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full material workspace data: metadata, generation states,
    resource version history, quiz set history, and quiz attempt history.
    """
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    _verify_material_access(mat, current_user)

    comp_name = mat.competency.name if mat.competency else None
    topic_name = mat.topic.name if mat.topic else None

    # --- Notes history ---
    all_notes = db.query(MaterialNote).filter(
        MaterialNote.material_id == id
    ).order_by(MaterialNote.version.desc()).all()
    notes_history = [
        {"id": n.id, "version": n.version, "status": n.status, "title": n.title, "created_at": str(n.created_at)}
        for n in all_notes
    ]

    # --- Flashcard history ---
    all_decks = db.query(MaterialFlashcardDeck).filter(
        MaterialFlashcardDeck.material_id == id
    ).order_by(MaterialFlashcardDeck.version.desc()).all()
    flashcard_history = [
        {"id": d.id, "version": d.version, "status": d.status, "title": d.title,
         "card_count": len(d.cards), "created_at": str(d.created_at)}
        for d in all_decks
    ]

    # --- Mind map history ---
    all_maps = db.query(MaterialMindMap).filter(
        MaterialMindMap.material_id == id
    ).order_by(MaterialMindMap.version.desc()).all()
    mind_map_history = [
        {"id": m.id, "version": m.version, "status": m.status, "created_at": str(m.created_at)}
        for m in all_maps
    ]

    # --- Quiz set history ---
    all_quiz_sets = db.query(MaterialQuizQuestionSet).filter(
        MaterialQuizQuestionSet.material_id == id
    ).order_by(MaterialQuizQuestionSet.version.desc()).all()
    quiz_set_history = []
    for qs in all_quiz_sets:
        q_count = len(qs.questions) if qs.questions else 0
        # Find assessment attempts for this quiz set
        attempts = db.query(Assessment).filter(
            Assessment.material_quiz_set_id == qs.id,
            Assessment.user_id == current_user.id
        ).order_by(Assessment.started_at.desc()).all()
        attempt_list = []
        for a in attempts:
            attempt_list.append({
                "assessment_id": a.id,
                "status": a.status,
                "score": a.overall_score,
                "started_at": str(a.started_at) if a.started_at else None,
                "completed_at": str(a.completed_at) if a.completed_at else None,
            })
        quiz_set_history.append({
            "id": qs.id,
            "version": qs.version,
            "status": qs.status,
            "title": qs.title,
            "question_count": q_count,
            "created_at": str(qs.created_at),
            "attempts": attempt_list
        })

    # --- Current generation states ---
    latest_note = all_notes[0] if all_notes else None
    latest_deck = all_decks[0] if all_decks else None
    latest_map = all_maps[0] if all_maps else None
    latest_quiz = all_quiz_sets[0] if all_quiz_sets else None

    return {
        "material": {
            "id": mat.id,
            "title": mat.title,
            "original_filename": mat.original_filename or mat.filename,
            "file_type": mat.file_type,
            "file_size": mat.file_size,
            "material_scope": mat.material_scope or ("OFFICIAL_COMPETENCY" if mat.competency_id else "OTHER_LEARNING"),
            "competency_id": mat.competency_id,
            "competency_name": comp_name,
            "topic_id": mat.topic_id,
            "topic_name": topic_name,
            "processing_status": mat.processing_status,
            "detected_topics": mat.detected_topics or [],
            "upload_date": str(mat.upload_date or mat.created_at),
            "created_at": str(mat.created_at or mat.upload_date),
        },
        "generation_state": {
            "notes": latest_note.status if latest_note else None,
            "flashcards": latest_deck.status if latest_deck else None,
            "mind_map": latest_map.status if latest_map else None,
            "quiz": latest_quiz.status if latest_quiz else None,
        },
        "latest_versions": {
            "notes_version": next((n.version for n in all_notes if n.status == "ready"), None),
            "flashcards_version": next((d.version for d in all_decks if d.status == "ready"), None),
            "flashcards_count": next((len(d.cards) for d in all_decks if d.status == "ready"), None),
            "mind_map_version": next((m.version for m in all_maps if m.status == "ready"), None),
            "quiz_version": next((q.version for q in all_quiz_sets if q.status == "ready"), None),
        },
        "history": {
            "notes": notes_history,
            "flashcards": flashcard_history,
            "mind_maps": mind_map_history,
            "quiz_sets": quiz_set_history,
        }
    }

@router.get("/{id}/quiz/history")
def get_material_quiz_history(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all quiz attempts (assessments) for a given material, including
    score, status, and completed_at. Enforces ownership.
    """
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    _verify_material_access(mat, current_user)

    attempts = db.query(Assessment).filter(
        Assessment.source_material_id == id,
        Assessment.user_id == current_user.id
    ).order_by(Assessment.started_at.desc()).all()

    result = []
    for a in attempts:
        quiz_set = db.query(MaterialQuizQuestionSet).filter(
            MaterialQuizQuestionSet.id == a.material_quiz_set_id
        ).first() if a.material_quiz_set_id else None
        result.append({
            "assessment_id": a.id,
            "quiz_set_version": quiz_set.version if quiz_set else None,
            "quiz_set_title": quiz_set.title if quiz_set else None,
            "score": a.overall_score,
            "total_questions": len(quiz_set.questions) if quiz_set and quiz_set.questions else None,
            "status": a.status,
            "started_at": str(a.started_at) if a.started_at else None,
            "completed_at": str(a.completed_at) if a.completed_at else None,
        })

    return result

# ============================================================
# CONDITIONAL COURSE RECOMMENDATIONS FOR OTHER_LEARNING
# ============================================================

@router.get("/{id}/related-courses")
def get_related_courses_for_material(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    For OTHER_LEARNING materials, analyzes detected topics and compares them
    against available official courses. Returns related courses only when
    genuine semantic/topic overlap exists. Returns empty list if no overlap.
    """
    from models.course import Course, CourseCompetency
    from models.competency import Competency, CompetencyTopic

    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    _verify_material_access(mat, current_user)

    # For OFFICIAL_COMPETENCY materials, return courses linked to that competency
    if mat.material_scope == "OFFICIAL_COMPETENCY" and mat.competency_id:
        course_comps = db.query(CourseCompetency).filter(
            CourseCompetency.competency_id == mat.competency_id
        ).all()
        courses = []
        for cc in course_comps:
            c = db.query(Course).filter(Course.id == cc.course_id, Course.is_active == True).first()
            if c:
                courses.append({
                    "course_id": c.id,
                    "title": c.title,
                    "provider": c.provider,
                    "description": c.description,
                    "similarity_reason": f"Directly linked to competency: {mat.competency.name}" if mat.competency else "Official competency match",
                    "confidence": 1.0
                })
        return courses

    # For OTHER_LEARNING: extract topic keywords from the material
    material_topics = set()
    if mat.detected_topics:
        for t in mat.detected_topics:
            if isinstance(t, str):
                # Normalize: split multi-word topics into individual keywords
                for word in t.lower().replace(",", " ").replace("/", " ").split():
                    cleaned = word.strip().strip(".-_()")
                    if len(cleaned) > 2:
                        material_topics.add(cleaned)

    if not material_topics:
        return []

    # Build a set of course keywords from all active courses
    all_courses = db.query(Course).filter(Course.is_active == True).all()
    matched_courses = []

    for course in all_courses:
        course_keywords = set()
        # Extract from title
        for word in (course.title or "").lower().replace(",", " ").replace("/", " ").split():
            cleaned = word.strip().strip(".-_()")
            if len(cleaned) > 2:
                course_keywords.add(cleaned)
        # Extract from description
        for word in (course.description or "").lower().replace(",", " ").replace("/", " ").split():
            cleaned = word.strip().strip(".-_()")
            if len(cleaned) > 2:
                course_keywords.add(cleaned)
        # Extract competency name via CourseCompetency
        comps = db.query(CourseCompetency).filter(CourseCompetency.course_id == course.id).all()
        for cc in comps:
            comp = db.query(Competency).filter(Competency.id == cc.competency_id).first()
            if comp:
                for word in comp.name.lower().replace(",", " ").replace("/", " ").split():
                    cleaned = word.strip().strip(".-_()")
                    if len(cleaned) > 2:
                        course_keywords.add(cleaned)

        # Calculate overlap
        overlap = material_topics & course_keywords
        # Require at least 2 matching keywords or 20% of material topics
        min_matches = max(2, int(len(material_topics) * 0.2))
        if len(overlap) >= min_matches:
            confidence = round(len(overlap) / max(len(material_topics), 1), 2)
            matched_courses.append({
                "course_id": course.id,
                "title": course.title,
                "provider": course.provider,
                "description": course.description,
                "similarity_reason": f"Topic overlap: {', '.join(sorted(list(overlap)[:5]))}",
                "confidence": min(confidence, 1.0),
                "matching_keywords": sorted(list(overlap)[:8])
            })

    # Sort by confidence descending, return top 5
    matched_courses.sort(key=lambda x: x["confidence"], reverse=True)
    return matched_courses[:5]

# ============================================================
# BACKGROUND GENERATION WORKERS
# ============================================================

def _bg_generate_notes(material_id: int, note_id: int):
    """Background worker: generates notes and updates the DB record."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        note_obj = db.query(MaterialNote).filter(MaterialNote.id == note_id).first()
        mat = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
        if not note_obj or not mat:
            return
        ai = AIService()
        notes_data = ai.generate_short_notes(mat.extracted_text, mat.title)
        note_obj.title = notes_data.get("title", mat.title)
        note_obj.content = notes_data
        note_obj.status = "ready"
        db.commit()
        logger.info(f"Background notes generation completed: note_id={note_id}, material_id={material_id}")
    except Exception as e:
        logger.error(f"Background notes generation failed: note_id={note_id}, error={e}")
        try:
            note_obj = db.query(MaterialNote).filter(MaterialNote.id == note_id).first()
            if note_obj:
                note_obj.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

def _bg_generate_flashcards(material_id: int, deck_id: int, count: int):
    """Background worker: generates flashcards and updates the DB record."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        deck_obj = db.query(MaterialFlashcardDeck).filter(MaterialFlashcardDeck.id == deck_id).first()
        mat = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
        if not deck_obj or not mat:
            return
        ai = AIService()
        cards_data = ai.generate_flashcards(mat.extracted_text, mat.title, count=count)
        for idx, card in enumerate(cards_data, 1):
            c_obj = MaterialFlashcard(
                deck_id=deck_obj.id,
                material_id=material_id,
                front=card["front"],
                back=card["back"],
                order=card.get("order", idx)
            )
            db.add(c_obj)
        deck_obj.status = "ready"
        db.commit()
        logger.info(f"Background flashcards generation completed: deck_id={deck_id}, material_id={material_id}")
    except Exception as e:
        logger.error(f"Background flashcards generation failed: deck_id={deck_id}, error={e}")
        try:
            deck_obj = db.query(MaterialFlashcardDeck).filter(MaterialFlashcardDeck.id == deck_id).first()
            if deck_obj:
                deck_obj.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

def _bg_generate_mind_map(material_id: int, mm_id: int):
    """Background worker: generates mind map and updates the DB record."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        mm_obj = db.query(MaterialMindMap).filter(MaterialMindMap.id == mm_id).first()
        mat = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
        if not mm_obj or not mat:
            return
        ai = AIService()
        mm_data = ai.generate_mind_map(mat.extracted_text, mat.title)
        mm_obj.root_node = mm_data
        mm_obj.status = "ready"
        db.commit()
        logger.info(f"Background mind map generation completed: mm_id={mm_id}, material_id={material_id}")
    except Exception as e:
        logger.error(f"Background mind map generation failed: mm_id={mm_id}, error={e}")
        try:
            mm_obj = db.query(MaterialMindMap).filter(MaterialMindMap.id == mm_id).first()
            if mm_obj:
                mm_obj.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

# 1. Short Notes
@router.post("/{id}/notes/generate")
def generate_material_notes(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a notes placeholder with 'generating' status and dispatches AI generation to background."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    _verify_material_access(mat, current_user)

    if mat.processing_status != "completed" or not mat.extracted_text or len(mat.extracted_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="This material is not ready for AI study content yet.")

    # Prevent concurrent duplicate generation
    in_prog = db.query(MaterialNote).filter(MaterialNote.material_id == id, MaterialNote.status == "generating").first()
    if in_prog:
        raise HTTPException(status_code=409, detail="Notes generation is already in progress for this material.")

    max_v = db.query(func.max(MaterialNote.version)).filter(MaterialNote.material_id == id).scalar() or 0
    next_v = max_v + 1

    note_obj = MaterialNote(
        material_id=id,
        title=f"{mat.title} — Notes v{next_v}",
        content={},
        status="generating",
        version=next_v
    )
    db.add(note_obj)
    db.commit()
    db.refresh(note_obj)

    background_tasks.add_task(_bg_generate_notes, id, note_obj.id)

    return {
        "id": note_obj.id,
        "material_id": mat.id,
        "title": note_obj.title,
        "version": note_obj.version,
        "status": "generating",
        "message": "Notes generation started in background."
    }

@router.get("/{id}/notes", response_model=MaterialNotesResponse)
def get_material_notes(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches the latest active generated study notes for a material."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    if mat.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. You can only view study notes for your own materials.")

    note_obj = db.query(MaterialNote).filter(
        MaterialNote.material_id == id,
        MaterialNote.status == "ready"
    ).order_by(MaterialNote.version.desc()).first()

    if not note_obj:
        raise HTTPException(status_code=404, detail="No study notes generated for this material yet.")

    comp_name = mat.competency.name if mat.competency else None
    topic_name = mat.topic.name if mat.topic else None
    raw_sections = note_obj.content.get("sections", []) if isinstance(note_obj.content, dict) else []

    return {
        "id": note_obj.id,
        "material_id": mat.id,
        "title": note_obj.title,
        "material_title": mat.title,
        "material_scope": mat.material_scope,
        "competency_name": comp_name,
        "topic_name": topic_name,
        "sections": raw_sections,
        "version": note_obj.version,
        "status": note_obj.status,
        "created_at": note_obj.created_at
    }

# 2. Flashcards
@router.post("/{id}/flashcards/generate")
def generate_material_flashcards(
    id: int,
    background_tasks: BackgroundTasks,
    count: int = 8,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a flashcard deck placeholder and dispatches generation to background."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    _verify_material_access(mat, current_user)

    if mat.processing_status != "completed" or not mat.extracted_text or len(mat.extracted_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="This material is not ready for AI study content yet.")

    # Concurrency check
    in_prog = db.query(MaterialFlashcardDeck).filter(MaterialFlashcardDeck.material_id == id, MaterialFlashcardDeck.status == "generating").first()
    if in_prog:
        raise HTTPException(status_code=409, detail="Flashcards generation is already in progress for this material.")

    max_v = db.query(func.max(MaterialFlashcardDeck.version)).filter(MaterialFlashcardDeck.material_id == id).scalar() or 0
    next_v = max_v + 1

    deck_obj = MaterialFlashcardDeck(
        material_id=id,
        title=f"Flashcards: {mat.title} v{next_v}",
        version=next_v,
        status="generating"
    )
    db.add(deck_obj)
    db.commit()
    db.refresh(deck_obj)

    background_tasks.add_task(_bg_generate_flashcards, id, deck_obj.id, count)

    return {
        "deck_id": deck_obj.id,
        "material_id": mat.id,
        "title": deck_obj.title,
        "version": deck_obj.version,
        "status": "generating",
        "message": "Flashcards generation started in background."
    }

@router.get("/{id}/flashcards", response_model=MaterialFlashcardsResponse)
def get_material_flashcards(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches the latest active flashcard deck for a material."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    if mat.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. You can only view flashcards for your own materials.")

    deck_obj = db.query(MaterialFlashcardDeck).filter(
        MaterialFlashcardDeck.material_id == id,
        MaterialFlashcardDeck.status == "ready"
    ).order_by(MaterialFlashcardDeck.version.desc()).first()

    if not deck_obj:
        raise HTTPException(status_code=404, detail="No flashcards generated for this material yet.")

    cards = db.query(MaterialFlashcard).filter(
        MaterialFlashcard.deck_id == deck_obj.id
    ).order_by(MaterialFlashcard.order).all()

    comp_name = mat.competency.name if mat.competency else None
    topic_name = mat.topic.name if mat.topic else None

    return {
        "deck_id": deck_obj.id,
        "material_id": mat.id,
        "title": deck_obj.title,
        "material_title": mat.title,
        "material_scope": mat.material_scope,
        "competency_name": comp_name,
        "topic_name": topic_name,
        "version": deck_obj.version,
        "total_cards": len(cards),
        "status": deck_obj.status,
        "cards": [
            {"id": c.id, "front": c.front, "back": c.back, "order": c.order}
            for c in cards
        ],
        "created_at": deck_obj.created_at
    }

# 3. Mind Map
@router.post("/{id}/mind-map/generate")
def generate_material_mind_map(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a mind map placeholder and dispatches generation to background."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    _verify_material_access(mat, current_user)

    if mat.processing_status != "completed" or not mat.extracted_text or len(mat.extracted_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="This material is not ready for AI study content yet.")

    # Concurrency check
    in_prog = db.query(MaterialMindMap).filter(MaterialMindMap.material_id == id, MaterialMindMap.status == "generating").first()
    if in_prog:
        raise HTTPException(status_code=409, detail="Mind map generation is already in progress for this material.")

    max_v = db.query(func.max(MaterialMindMap.version)).filter(MaterialMindMap.material_id == id).scalar() or 0
    next_v = max_v + 1

    mm_obj = MaterialMindMap(
        material_id=id,
        root_node={},
        status="generating",
        version=next_v
    )
    db.add(mm_obj)
    db.commit()
    db.refresh(mm_obj)

    background_tasks.add_task(_bg_generate_mind_map, id, mm_obj.id)

    return {
        "id": mm_obj.id,
        "material_id": mat.id,
        "version": mm_obj.version,
        "status": "generating",
        "message": "Mind map generation started in background."
    }

@router.get("/{id}/mind-map", response_model=MaterialMindMapResponse)
def get_material_mind_map(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches the latest active generated mind map tree for a material."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    if mat.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. You can only view mind maps for your own materials.")

    mm_obj = db.query(MaterialMindMap).filter(
        MaterialMindMap.material_id == id,
        MaterialMindMap.status == "ready"
    ).order_by(MaterialMindMap.version.desc()).first()

    if not mm_obj:
        raise HTTPException(status_code=404, detail="No mind map generated for this material yet.")

    comp_name = mat.competency.name if mat.competency else None
    topic_name = mat.topic.name if mat.topic else None

    return {
        "id": mm_obj.id,
        "material_id": mat.id,
        "title": mm_obj.root_node.get("label", mat.title) if isinstance(mm_obj.root_node, dict) else mat.title,
        "material_title": mat.title,
        "material_scope": mat.material_scope,
        "competency_name": comp_name,
        "topic_name": topic_name,
        "root_node": mm_obj.root_node,
        "version": mm_obj.version,
        "status": mm_obj.status,
        "created_at": mm_obj.created_at
    }

@router.post("/{id}/generate-questions")
def generate_questions_from_material(
    id: int, 
    count: int = 3,
    competency_id: int = None,
    difficulty: str = "2",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Generates, validates, and stores source-grounded questions extracted from uploaded material.
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not material or not material.extracted_text:
        raise HTTPException(status_code=404, detail="Material not found or contains no extracted text")

    # Resolve competency
    target_comp_id = competency_id
    if not target_comp_id and material.mapped_competencies:
        # Pick highest mapped competency
        top_name = max(material.mapped_competencies.items(), key=lambda x: x[1])[0]
        comp_obj = db.query(Competency).filter(Competency.name.ilike(f"%{top_name}%")).first()
        target_comp_id = comp_obj.id if comp_obj else 1
    elif not target_comp_id:
        target_comp_id = 1

    comp_name = db.query(Competency).filter(Competency.id == target_comp_id).first().name

    ai = AIService()
    raw_questions = ai.generate_mcqs_from_material(
        content_text=material.extracted_text,
        competency_name=comp_name,
        count=count,
        difficulty=difficulty
    )

    stored_questions = []
    for q_item in raw_questions:
        q_obj = AIService.validate_and_store_question(
            db=db,
            q_data=q_item,
            competency_id=target_comp_id,
            source_material_id=material.id,
            created_by_user_id=current_user.id
        )
        if q_obj:
            q_obj.status = "pending_review"
            db.commit()

            # Record in generated_questions traceability table
            gen_rec = GeneratedQuestion(
                material_id=material.id,
                question_id=q_obj.id,
                generation_config={"difficulty": difficulty, "competency_id": target_comp_id}
            )
            db.add(gen_rec)
            db.commit()

            opts = [
                {
                    "id": opt.id,
                    "text": opt.text,
                    "option_text": opt.text,
                    "is_correct": opt.is_correct,
                    "order": opt.order
                }
                for opt in sorted(q_obj.options, key=lambda x: x.order)
            ]
            correct_txt = next((o["text"] for o in opts if o["is_correct"]), q_obj.correct_answer or "")

            stored_questions.append({
                "id": q_obj.id,
                "text": q_obj.question_text or q_obj.text,
                "question_text": q_obj.question_text or q_obj.text,
                "difficulty": q_obj.difficulty,
                "cognitive_level": q_obj.cognitive_level or "apply",
                "explanation": q_obj.explanation,
                "source_reference": getattr(q_obj, 'source_reference', None) or f"{material.title} (Section 4.2)",
                "status": q_obj.status,
                "competency_id": q_obj.competency_id,
                "competency_name": comp_name,
                "topic_id": q_obj.topic_id,
                "topic_name": q_obj.topic.name if q_obj.topic else "General Concept",
                "options": opts,
                "correct_answer": correct_txt
            })

    return {
        "status": "success",
        "material_id": material.id,
        "generated_count": len(raw_questions),
        "validated_and_stored_count": len(stored_questions),
        "questions": stored_questions
    }

# ============================================================
# LEARNER PERSONAL NOTES & PRACTICE QUIZ ENDPOINTS
# ============================================================

@router.post("/learner-notes/upload")
def upload_learner_notes(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    competency_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows a learner to upload personal study notes/PDFs, extract text,
    and receive an instant AI executive summary and topic breakdown.
    """
    if not validate_file(file):
        raise HTTPException(status_code=400, detail="Invalid file type. Supported formats: PDF, DOCX, PPTX, TXT")

    path = save_upload(file, settings.UPLOAD_DIR)
    text = extract_text(path, file.content_type)

    ai = AIService()
    summary_data = ai.summarize_material(text)
    summary_text = summary_data.get("summary") or f"Personal study notes covering {', '.join(summary_data.get('topics', ['Statistical Methods']))}."

    clean_title = title.strip() if title and title.strip() else file.filename.replace(".pdf", "").replace("_", " ")

    material = LearningMaterial(
        title=clean_title,
        filename=os.path.basename(path),
        original_filename=file.filename,
        file_type=file.content_type or "application/pdf",
        file_size=os.path.getsize(path) if os.path.exists(path) else 0,
        storage_path=path,
        competency_id=competency_id or 1,
        uploaded_by=current_user.id,
        extracted_text=text,
        detected_topics=summary_data.get("topics", ["Personal Notes Analysis"]),
        mapped_competencies=summary_data.get("competency_mappings", {}),
        processing_status="completed"
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    return {
        "id": material.id,
        "title": material.title,
        "summary": summary_text,
        "topics": material.detected_topics,
        "mapped_competencies": material.mapped_competencies,
        "text_length": len(text),
        "upload_date": material.created_at.strftime("%Y-%m-%d") if material.created_at else "Recent"
    }

@router.get("/learner-notes/my-notes")
def get_my_learner_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches all personal study notes uploaded by the current authenticated learner.
    """
    notes = db.query(LearningMaterial).filter(
        LearningMaterial.uploaded_by == current_user.id
    ).order_by(LearningMaterial.created_at.desc()).all()

    res = []
    for n in notes:
        summary_text = f"Study notes covering {', '.join(n.detected_topics or ['Statistical Analysis'])}."
        res.append({
            "id": n.id,
            "title": n.title,
            "filename": n.original_filename,
            "topics": n.detected_topics or [],
            "competency_id": n.competency_id,
            "summary": summary_text,
            "upload_date": n.created_at.strftime("%Y-%m-%d") if n.created_at else "Recent",
            "file_size": n.file_size
        })
    return res

@router.post("/learner-notes/{id}/generate-practice-quiz")
def generate_practice_quiz_from_notes(
    id: int,
    count: int = 3,
    difficulty: str = "2",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Synthesizes a short, source-grounded practice quiz (3-5 MCQs) from the learner's uploaded notes
    and initializes an immediate practice assessment session.
    """
    material = db.query(LearningMaterial).filter(
        LearningMaterial.id == id,
        (LearningMaterial.uploaded_by == current_user.id) | (current_user.role == "admin")
    ).first()
    if not material or not material.extracted_text:
        raise HTTPException(status_code=404, detail="Notes document not found or contains no readable text.")

    comp_id = material.competency_id or 1
    comp = db.query(Competency).filter(Competency.id == comp_id).first()
    comp_name = comp.name if comp else "General Statistics"

    ai = AIService()
    drill_count = min(max(count, 3), 5)
    raw_questions = ai.generate_mcqs_from_material(
        content_text=material.extracted_text,
        competency_name=comp_name,
        count=drill_count,
        difficulty=difficulty
    )

    q_objs = []
    for q_item in raw_questions:
        q_obj = AIService.validate_and_store_question(
            db=db,
            q_data=q_item,
            competency_id=comp_id,
            source_material_id=material.id,
            created_by_user_id=current_user.id
        )
        if q_obj:
            q_obj.status = "approved"  # Immediately eligible for private practice session
            db.commit()
            q_objs.append(q_obj)

    if not q_objs:
        raise HTTPException(status_code=500, detail="Failed to synthesize valid questions from notes.")

    # Create practice assessment session
    assessment = Assessment(
        user_id=current_user.id,
        assessment_type="practice",
        type="practice",
        status="in_progress"
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Serialize questions for immediate start
    serialized = []
    for q in q_objs:
        opts = [
            {"id": opt.id, "text": opt.text, "order": opt.order}
            for opt in sorted(q.options, key=lambda x: x.order)
        ]
        serialized.append({
            "id": q.id,
            "text": q.question_text or q.text,
            "question_text": q.question_text or q.text,
            "competency_id": q.competency_id,
            "competency_name": comp_name,
            "difficulty": q.difficulty,
            "options": opts
        })

    return {
        "assessment_id": assessment.id,
        "assessment_type": "practice",
        "title": f"Practice Drill: {material.title}",
        "total_questions": len(serialized),
        "questions": serialized
    }

from services.adaptive_assessment_service import AdaptiveAssessmentService

@router.post("/{material_id}/quiz/start")
def start_material_quiz(
    material_id: int,
    req: MaterialQuizStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initializes an AI-generated, personal adaptive quiz session grounded in the uploaded material.
    Supports question counts: 10, 15, 20.
    Supports question types: SHORT_MCQ, WORD_PROBLEM, CASE_STUDY, MIXED.
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    # 1. Authorization check
    if material.uploaded_by != current_user.id and material.material_scope != "OFFICIAL_COMPETENCY" and getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to access this study material")

    # 2. Readiness check
    if material.processing_status != "completed" or not material.extracted_text or len(material.extracted_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="This material is not ready for quiz generation yet.")

    # 3. Parameter validation
    if req.question_count not in [10, 15, 20]:
        raise HTTPException(status_code=422, detail="Invalid question_count. Allowed values are 10, 15, or 20.")

    q_type_upper = (req.question_type or "MIXED").upper()
    if q_type_upper not in ["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY", "MIXED"]:
        raise HTTPException(status_code=422, detail="Invalid question_type. Allowed values are SHORT_MCQ, WORD_PROBLEM, CASE_STUDY, or MIXED.")

    # 4. Synthesize calibrated question set with versioning
    prev_set = db.query(MaterialQuizQuestionSet).filter(MaterialQuizQuestionSet.material_id == material_id).order_by(MaterialQuizQuestionSet.version.desc()).first()
    next_version = (prev_set.version + 1) if prev_set else 1

    q_set = MaterialQuizQuestionSet(
        material_id=material.id,
        title=f"{material.title} Quiz v{next_version}",
        version=next_version,
        status="generating"
    )
    db.add(q_set)
    db.commit()
    db.refresh(q_set)

    logger.info(f"Initiating Material Quiz: material_id={material.id}, scope={material.material_scope}, format={q_type_upper}, count={req.question_count}, text_len={len(material.extracted_text)}")
    ai_service = AIService()
    try:
        comp_name = material.competency.name if material.competency else None
        topic_name = material.topic.name if material.topic else None
        raw_questions = ai_service.generate_material_quiz_questions(
            content_text=material.extracted_text,
            title=material.title,
            count=req.question_count,
            question_type=q_type_upper,
            competency_name=comp_name,
            topic_name=topic_name
        )
        logger.info(f"Material Quiz generation succeeded: material_id={material.id}, generated_count={len(raw_questions)}")
    except Exception as e:
        logger.error(f"Material Quiz generation failed: material_id={material.id}, format={q_type_upper}, count={req.question_count}, error={e}")
        q_set.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=422,
            detail=f"We couldn't generate enough valid questions for the requested format. Please try again or choose a different question type."
        )

    # 5. Store generated questions into MaterialQuizQuestion and MaterialQuizOption
    for q_data in raw_questions:
        m_q = MaterialQuizQuestion(
            set_id=q_set.id,
            material_id=material.id,
            question_text=q_data["question_text"],
            question_type=q_data["question_type"],
            difficulty=str(q_data.get("difficulty", "2")),
            cognitive_level=q_data.get("cognitive_level", "understand"),
            correct_answer=q_data["correct_answer"],
            explanation=q_data["explanation"],
            concept=q_data.get("concept"),
            source_reference=q_data.get("source_reference")
        )
        db.add(m_q)
        db.flush()

        for opt_item in q_data["options"]:
            m_opt = MaterialQuizOption(
                question_id=m_q.id,
                text=opt_item["text"],
                is_correct=bool(opt_item.get("is_correct", False)),
                order=opt_item.get("order", 1)
            )
            db.add(m_opt)

    q_set.status = "ready"
    db.commit()

    # 6. Initialize adaptive assessment session
    assessment, first_q = AdaptiveAssessmentService.initialize_material_quiz_session(
        db=db,
        user_id=current_user.id,
        material_id=material.id,
        question_set_id=q_set.id,
        question_count=req.question_count,
        question_type=q_type_upper
    )

    # 7. Serialize first question (Zero correct answer / solution leakage)
    opts = [
        {"id": opt.id, "text": opt.text, "order": opt.order}
        for opt in sorted(first_q.options, key=lambda x: x.order)
    ]

    c_display = material.competency.name if material.competency else "Material Study"
    c_id = material.competency_id if material.material_scope == "OFFICIAL_COMPETENCY" else None

    return {
        "assessment_id": assessment.id,
        "assessment_type": "material_quiz",
        "total_questions": req.question_count,
        "competencies_covered": [c_display],
        "source_material_title": material.title,
        "questions": [
            {
                "id": first_q.id,
                "text": first_q.question_text,
                "question_text": first_q.question_text,
                "question_type": first_q.question_type,
                "difficulty": first_q.difficulty,
                "cognitive_level": first_q.cognitive_level,
                "competency_id": c_id,
                "competency_name": c_display,
                "options": opts
            }
        ]
    }
