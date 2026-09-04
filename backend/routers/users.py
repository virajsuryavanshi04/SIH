from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.role import Role
from models.department import Department
from models.competency import RoleCompetency, Competency
from models.user_competency import UserCompetency, CompetencyScore
from models.assessment import Assessment
from schemas.user import UserProfileResponse, UserOnboardingRequest, UserRoleUpdateRequest, DepartmentResponse
from services.competency_service import compute_user_gaps, check_user_baseline_completed

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

    # Baseline completion check: Learner must have at least one completed assessment covering ALL required role competencies
    baseline_completed = check_user_baseline_completed(db, current_user)

    in_progress_ass = db.query(Assessment).filter(
        Assessment.user_id == current_user.id,
        Assessment.status == "in_progress",
        Assessment.assessment_type.in_(["baseline", "adaptive", "adaptive_reassessment"])
    ).order_by(Assessment.id.desc()).first()
    active_assessment_id = in_progress_ass.id if in_progress_ass else None

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
        baseline_completed=baseline_completed,
        active_assessment_id=active_assessment_id,
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
    """Complete initial professional onboarding: assign professional cadre role, department, and initialize role competency framework."""
    role = db.query(Role).filter(
        Role.id == req.role_id,
        Role.is_official == True,
        ~Role.name.ilike("%temp%"),
        ~Role.name.ilike("%test%"),
        ~Role.name.ilike("%demo%"),
        ~Role.name.ilike("%mock%"),
        ~Role.name.ilike("%zero%")
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Selected professional role not found")
    
    if "admin" in role.name.lower() or "administrator" in role.name.lower():
        raise HTTPException(status_code=403, detail="Administrator is a privileged system role and cannot be self-selected.")

    current_user.role_id = role.id
    current_user.designation = role.name
    if current_user.role != "admin":
        current_user.role = "learner"
    
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
@router.patch("/me/role", response_model=UserProfileResponse)
def update_user_role(
    req: UserRoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change official professional role. Recalculates gaps against new role targets without deleting historical assessment data."""
    role = db.query(Role).filter(
        Role.id == req.role_id,
        Role.is_official == True,
        ~Role.name.ilike("%temp%"),
        ~Role.name.ilike("%test%"),
        ~Role.name.ilike("%demo%"),
        ~Role.name.ilike("%mock%"),
        ~Role.name.ilike("%zero%")
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Selected professional role not found")

    if "admin" in role.name.lower() or "administrator" in role.name.lower():
        raise HTTPException(status_code=403, detail="Administrator is a privileged system role and cannot be self-selected.")

    current_user.role_id = role.id
    current_user.designation = role.name
    # System authorization role is strictly preserved and cannot be escalated
    if current_user.role != "admin":
        current_user.role = "learner"

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

@router.patch("/me", response_model=UserProfileResponse)
@router.put("/me", response_model=UserProfileResponse)
def update_profile(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update profile attributes. Explicitly forbids privilege escalation on system roles.
    """
    if "role" in req or "system_role" in req:
        new_role = req.get("role") or req.get("system_role")
        if new_role != current_user.role and current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Privilege escalation is forbidden. System authorization roles cannot be self-assigned by learners."
            )
        if current_user.role == "admin" and new_role:
            current_user.role = new_role

    if "full_name" in req and req["full_name"]:
        current_user.full_name = req["full_name"]
        current_user.name = req["full_name"]
    if "experience_years" in req and req["experience_years"] is not None:
        current_user.experience_years = req["experience_years"]
    if "department_id" in req and req["department_id"] is not None:
        current_user.department_id = req["department_id"]

    db.commit()
    db.refresh(current_user)
    return get_current_user_profile(current_user, db)
