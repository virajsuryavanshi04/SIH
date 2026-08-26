from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class RoleCompetencyItem(BaseModel):
    competency_id: int
    competency_name: str
    target_score: float
    target_level: int
    weight: float

    model_config = ConfigDict(from_attributes=True)

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RoleDetailResponse(RoleResponse):
    competencies: List[RoleCompetencyItem] = []
