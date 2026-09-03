from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from models.user import User
from auth.security import verify_password, hash_password, create_access_token
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    clean_name = request.full_name.strip()
    
    if not clean_name:
        raise HTTPException(status_code=422, detail="Full name is required.")
        
    if len(request.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters long.")
        
    if request.confirm_password is not None and request.password != request.confirm_password:
        raise HTTPException(status_code=422, detail="Passwords do not match.")

    existing_user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    user = User(
        email=clean_email,
        password_hash=hash_password(request.password),
        full_name=clean_name,
        name=clean_name,
        department_id=request.department_id,
        role="learner",
        role_id=None,
        designation=None,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        role_id=user.role_id,
        role_name=None,
        department_id=user.department_id,
        department_name=None,
        designation=user.designation,
        experience_years=user.experience_years,
        is_onboarded=False,
        baseline_completed=False,
        active_assessment_id=None,
        created_at=user.created_at
    )

from models.role import Role
from models.department import Department
from models.assessment import Assessment
from services.competency_service import check_user_baseline_completed

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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

    baseline_completed = check_user_baseline_completed(db, current_user)

    in_progress_ass = db.query(Assessment).filter(
        Assessment.user_id == current_user.id,
        Assessment.status == "in_progress",
        Assessment.assessment_type.in_(["baseline", "adaptive", "adaptive_reassessment"])
    ).order_by(Assessment.id.desc()).first()
    active_assessment_id = in_progress_ass.id if in_progress_ass else None

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        role_id=current_user.role_id,
        role_name=role_name,
        department_id=current_user.department_id,
        department_name=dept_name,
        designation=current_user.designation,
        experience_years=current_user.experience_years,
        is_onboarded=bool(current_user.role_id or current_user.designation),
        baseline_completed=baseline_completed,
        active_assessment_id=active_assessment_id,
        created_at=current_user.created_at
    )
