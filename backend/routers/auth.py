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
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        department_id=request.department_id,
        role="learner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

from models.role import Role
from models.department import Department

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
        created_at=current_user.created_at
    )
