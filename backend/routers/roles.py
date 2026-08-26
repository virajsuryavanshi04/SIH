from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.role import Role
from models.competency import RoleCompetency, Competency
from schemas.role import RoleResponse, RoleDetailResponse, RoleCompetencyItem

router = APIRouter(prefix="/api/roles", tags=["roles"])

@router.get("/", response_model=list[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    """List all official roles in India's statistical system."""
    return db.query(Role).all()

@router.get("/{role_id}", response_model=RoleDetailResponse)
def get_role(role_id: int, db: Session = Depends(get_db)):
    """Get role details and its mapped competency targets."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == role_id).all()
    comp_items = []
    for r in reqs:
        comp = db.query(Competency).filter(Competency.id == r.competency_id).first()
        comp_items.append(RoleCompetencyItem(
            competency_id=r.competency_id,
            competency_name=comp.name if comp else "Unknown",
            target_score=r.target_score,
            target_level=r.target_level,
            weight=r.weight
        ))
    
    return RoleDetailResponse(
        id=role.id,
        name=role.name,
        description=role.description,
        created_at=role.created_at,
        competencies=comp_items
    )

@router.get("/{role_id}/competencies", response_model=list[RoleCompetencyItem])
def get_role_competencies(role_id: int, db: Session = Depends(get_db)):
    """List required competencies for a specific official role."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == role_id).all()
    comp_items = []
    for r in reqs:
        comp = db.query(Competency).filter(Competency.id == r.competency_id).first()
        comp_items.append(RoleCompetencyItem(
            competency_id=r.competency_id,
            competency_name=comp.name if comp else "Unknown",
            target_score=r.target_score,
            target_level=r.target_level,
            weight=r.weight
        ))
    return comp_items
