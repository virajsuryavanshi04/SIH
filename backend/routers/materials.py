from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.material import LearningMaterial, GeneratedQuestion
from models.assessment import Question, QuestionOption
from services.document_service import validate_file, save_upload, extract_text
from ai.service import AIService
from config import settings
import os

router = APIRouter(prefix="/api/materials", tags=["materials"])

@router.post("/upload")
def upload_material(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not validate_file(file):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    path = save_upload(file, settings.UPLOAD_DIR)
    text = extract_text(path, file.content_type)
    
    ai = AIService()
    summary = ai.summarize_material(text)
    
    material = LearningMaterial(
        title=file.filename,
        filename=os.path.basename(path),
        original_filename=file.filename,
        file_type=file.content_type,
        file_size=0,
        uploaded_by=current_user.id,
        extracted_text=text,
        detected_topics=summary.get("topics", []),
        mapped_competencies=summary.get("competency_mappings", {})
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return {"id": material.id, "title": material.title, "processing_status": material.processing_status}

@router.get("/")
def list_materials(db: Session = Depends(get_db)):
    return db.query(LearningMaterial).all()

@router.get("/{id}")
def get_material(id: int, db: Session = Depends(get_db)):
    return db.query(LearningMaterial).filter(LearningMaterial.id == id).first()

@router.post("/{id}/generate-questions")
def generate_questions(id: int, db: Session = Depends(get_db)):
    material = db.query(LearningMaterial).filter(LearningMaterial.id == id).first()
    if not material or not material.extracted_text:
        raise HTTPException(404, "Material not found or no text extracted")
        
    ai = AIService()
    qs = ai.generate_questions(material.extracted_text, 5, "intermediate", "mcq", "understand")
    
    return {"status": "started", "generated": qs}
