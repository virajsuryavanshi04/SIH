from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any

class AdminDashboardResponse(BaseModel):
    total_employees: int
    avg_competency: float
    critical_gaps_count: int
    courses_completed: int
    avg_improvement: float
    competency_overview: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    model_config = ConfigDict(from_attributes=True)

class HeatmapCell(BaseModel):
    competency_name: str
    department_name: str
    avg_score: float
    status: str
    model_config = ConfigDict(from_attributes=True)

class HeatmapResponse(BaseModel):
    cells: List[HeatmapCell]
    departments: List[str]
    competencies: List[str]
    model_config = ConfigDict(from_attributes=True)

class GapPriorityResponse(BaseModel):
    competency_name: str
    percent_below_target: float
    severity: str
    affected_count: int
    priority_rank: int
    priority_formula: str
    model_config = ConfigDict(from_attributes=True)

class QuestionBankResponse(BaseModel):
    questions: List[Dict[str, Any]]
    total: int
    page: int
    per_page: int
    model_config = ConfigDict(from_attributes=True)
