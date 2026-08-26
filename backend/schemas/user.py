from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserOnboardingRequest(BaseModel):
    role_id: int
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    experience_years: Optional[int] = 0
    work_areas: Optional[List[str]] = []

class UserRoleUpdateRequest(BaseModel):
    role_id: int

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str

    model_config = ConfigDict(from_attributes=True)

class UserProfileResponse(BaseModel):
    id: int
    name: str
    full_name: str
    email: str
    role: str
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None
    experience_years: Optional[int] = None
    is_onboarded: bool = False
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
