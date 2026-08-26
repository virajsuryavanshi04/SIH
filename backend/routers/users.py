from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.role import Role
from models.department import Department
from models.competency import RoleCompetency, Competency
from models.user_competency import UserCompetency, CompetencyScore
from schemas.user import UserProfileResponse, UserOnboardingRequest, UserRoleUpdateRequest, DepartmentResponse
from services.competency_service import compute_user_gaps

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get authenticated user profile with resolved role and department metadata."""
    role_name = current_user.designation
    if current_user.role_id:
        role_obj = db.query(Role).filter(Role.id == current_user.role_id).first()
        if role_obj:
            role_name = role_obj.name
            
    dept_name = current_user.department_name
    if current_user.department_id:
        dept_obj = db.query(Department).filter(Department.id == current_user.department_id).first()
        if dept_obj:
            dept_name = dept_obj.name

    is_onboarded = bool(current_user.role_id or current_user.designation)

    return UserProfileResponse(
        id=current_user.id,
        name=current_user.full_name or current_user.name,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        role_id=current_user.role_id,
        role_name=role_name,
        department_id=current_user.department_id,
        department_name=dept_name,
        designation=current_user.designation,
        experience_years=current_user.experience_years or 0,
        is_onboarded=is_onboarded,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    """List all official departments and statistical divisions."""
    return db.query(Department).all()

@router.post("/onboarding", response_model=UserProfileResponse)
def complete_onboarding(
    req: UserOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete initial professional onboarding: assign role, department, and initialize role competency framework."""
    role = db.query(Role).filter(Role.id == req.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Selected role not found")

    current_user.role_id = role.id
    current_user.designation = role.name
    
    if req.department_id:
        dept = db.query(Department).filter(Department.id == req.department_id).first()
        if dept:
            current_user.department_id = dept.id
            current_user.department_name = dept.name
    elif req.department_name:
        current_user.department_name = req.department_name

    if req.experience_years is not None:
        current_user.experience_years = req.experience_years

    # Initialize / update role competency requirements in user_competencies
    role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == role.id).all()
    
    for r in role_reqs:
        existing_uc = db.query(UserCompetency).filter(
            UserCompetency.user_id == current_user.id,
            UserCompetency.competency_id == r.competency_id
        ).first()

        if existing_uc:
            existing_uc.target_score = r.target_score
        else:
            # Create unassessed entry (No manual scores allowed! Derived only from assessments)
            new_uc = UserCompetency(
                user_id=current_user.id,
                competency_id=r.competency_id,
                current_score=None,
                target_score=r.target_score,
                confidence=0.0,
                status="not_assessed",
                last_assessed=None
            )
            db.add(new_uc)

    db.commit()
    db.refresh(current_user)

    return get_current_user_profile(current_user, db)

@router.put("/me/role", response_model=UserProfileResponse)
def update_user_role(
    req: UserRoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change official role. Recalculates gaps against new role targets without deleting historical assessment data."""
    role = db.query(Role).filter(Role.id == req.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Selected role not found")

    current_user.role_id = role.id
    current_user.designation = role.name

    # Fetch new role competency requirements
    role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == role.id).all()
    req_comp_map = {r.competency_id: r for r in role_reqs}

    # Fetch existing assessment scores
    latest_scores = {}
    for cs in db.query(CompetencyScore).filter(CompetencyScore.user_id == current_user.id).order_by(CompetencyScore.assessed_at.asc()).all():
        latest_scores[cs.competency_id] = cs.score

    # Update or insert user_competencies
    for comp_id, r in req_comp_map.items():
        existing_uc = db.query(UserCompetency).filter(
            UserCompetency.user_id == current_user.id,
            UserCompetency.competency_id == comp_id
        ).first()

        score_val = latest_scores.get(comp_id, None)
        
        if score_val is not None:
            gap = max(0.0, r.target_score - score_val)
            if score_val >= r.target_score:
                status = "strong"
            elif score_val >= r.target_score - 10:
                status = "on_track"
            elif gap > 20:
                status = "critical_gap"
            else:
                status = "needs_attention"
        else:
            status = "not_assessed"

        if existing_uc:
            existing_uc.target_score = r.target_score
            if existing_uc.current_score is not None:
                existing_uc.status = status
        else:
            new_uc = UserCompetency(
                user_id=current_user.id,
                competency_id=comp_id,
                current_score=score_val,
                target_score=r.target_score,
                confidence=80.0 if score_val is not None else 0.0,
                status=status,
                last_assessed=None
            )
            db.add(new_uc)

    db.commit()
    db.refresh(current_user)
    return get_current_user_profile(current_user, db)
