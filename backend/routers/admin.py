from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import require_admin
from models.user import User
from services.admin_service import get_org_stats, compute_heatmap, prioritize_gaps, training_effectiveness

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return get_org_stats(db)

@router.get("/employees")
def employees(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).all()

@router.get("/competencies/heatmap")
def heatmap(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return compute_heatmap(db)

@router.get("/gaps/priorities")
def priorities(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return prioritize_gaps(db)

@router.get("/analytics/training-effectiveness")
def effectiveness(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return training_effectiveness(db)

@router.get("/analytics/improvement-trends")
def trends(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return []
