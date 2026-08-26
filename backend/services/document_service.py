import os
import uuid
from fastapi import UploadFile

def validate_file(file: UploadFile):
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain"]
    if file.content_type not in allowed_types:
        return False
    return True

def save_upload(file: UploadFile, upload_dir: str):
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(upload_dir, safe_name)
    with open(path, "wb") as f:
        f.write(file.file.read())
    return path

def extract_text(file_path: str, file_type: str):
    text = ""
    try:
        if "pdf" in file_type:
            import fitz
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
        elif "wordprocessingml" in file_type:
            from docx import Document
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif "presentationml" in file_type:
            from pptx import Presentation
            prs = Presentation(file_path)
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
    except Exception as e:
        text = f"Error extracting text: {str(e)}"
    return text

def chunk_text(text: str, max_chunk_size: int = 3000):
    return [text[i:i+max_chunk_size] for i in range(0, len(text), max_chunk_size)]
