from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user, require_admin
from models.user import User
from models.material import LearningMaterial, GeneratedQuestion
from models.assessment import Assessment, Question, QuestionOption
from models.competency import Competency
from services.document_service import validate_file, save_upload, extract_text
from ai.service import AIService
from config import settings
from typing import Optional
import os

router = APIRouter(prefix="/api/materials", tags=["materials"])

@router.post("/upload")
def upload_material(
    file: UploadFile = File(...), 
    title: Optional[str] = Form(None),
    competency_id: Optional[int] = Form(None),
    topic_id: Optional[int] = Form(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin)
):
    """
    Uploads official training material (PDF/Word/Text), extracts text,
    and identifies mapped competencies/topics via AIService.
    """
    if not validate_file(file):
        raise HTTPException(status_code=400, detail="Invalid file type. Supported formats: PDF, DOCX, PPTX, TXT")
    
    path = save_upload(file, settings.UPLOAD_DIR)
    text = extract_text(path, file.content_type)
    
    ai = AIService()
    summary = ai.summarize_material(text)
    
    material = LearningMaterial(
        title=title or file.filename,
        filename=os.path.basename(path),
        original_filename=file.filename,
        file_type=file.content_type or "application/pdf",
        file_size=os.path.getsize(path) if os.path.exists(path) else 0,
        storage_path=path,
        uploaded_by=current_user.id,
        extracted_text=text,
        detected_topics=summary.get("topics", []),
        mapped_competencies=summary.get("competency_mappings", {}),
        processing_status="completed"
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    
    return {
        "id": material.id, 
        "title": material.title, 
        "processing_status": material.processing_status,
        "topics": material.detected_topics,
        "mapped_competencies": material.mapped_competencies,
        "text_length": len(text)
    }

@router.get("/")
def list_materials(db: Session = Depends(get_db)):
    """Lists all uploaded training documents and textbooks."""
    materials = db.query(LearningMaterial).order_by(LearningMaterial.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "filename": m.original_filename or m.filename,
            "file_type": m.file_type,
            "file_size": m.file_size,
            "uploaded_by": m.uploaded_by,
            "upload_date": m.upload_date or m.created_at,
            "processing_status": m.processing_status,
            "detected_topics": m.detected_topics,
            "mapped_competencies": m.mapped_competencies,
            "competency_id": m.competency_id,
        }
        for m in materials
    ]

@router.get("/{id}")
def get_material(id: int, db: Session = Depends(get_db)):
    """Fetches details for an uploaded material."""
    mat = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    return {
        "id": mat.id,
        "title": mat.title,
        "filename": mat.original_filename or mat.filename,
        "file_type": mat.file_type,
        "file_size": mat.file_size,
        "uploaded_by": mat.uploaded_by,
        "upload_date": mat.upload_date or mat.created_at,
        "processing_status": mat.processing_status,
        "detected_topics": mat.detected_topics,
        "mapped_competencies": mat.mapped_competencies,
        "competency_id": mat.competency_id,
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
