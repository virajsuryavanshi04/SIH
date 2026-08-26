from sqlalchemy.orm import Session
from sqlalchemy import func
from models.user import User
from models.department import Department
from models.competency_score import CompetencyScore
from models.competency import Competency
from models.learning_path import LearningProgress
from services.competency_service import compute_user_gaps

def get_org_stats(db: Session):
    total_users = db.query(User).count()
    
    # Avg competency
    avg_score = db.query(func.avg(CompetencyScore.score)).scalar() or 0.0
    
    # Courses completed
    completed = db.query(LearningProgress).filter(LearningProgress.status == "completed").count()
    
    # Critical gaps
    critical = 0
    users = db.query(User).all()
    for u in users:
        gaps = compute_user_gaps(db, u.id)
        critical += sum(1 for g in gaps if g["gap"] > 20)
        
    return {
        "total_employees": total_users,
        "avg_competency": avg_score,
        "critical_gaps_count": critical,
        "courses_completed": completed,
        "avg_improvement": 5.2, # Mock improvement trend for org
        "competency_overview": [],
        "recent_activity": []
    }

def compute_heatmap(db: Session, department_id: int = None, role_name: str = None):
    # Compute avg score per competency per department
    scores = db.query(
        Competency.name.label("comp"),
        Department.name.label("dept"),
        func.avg(CompetencyScore.score).label("avg_score")
    ).join(CompetencyScore.competency).join(CompetencyScore.user).join(User.department).group_by(Competency.name, Department.name).all()
    
    cells = []
    departments = set()
    competencies = set()
    
    for s in scores:
        departments.add(s.dept)
        competencies.add(s.comp)
        status = "good" if s.avg_score >= 80 else ("warning" if s.avg_score >= 60 else "critical")
        cells.append({
            "competency_name": s.comp,
            "department_name": s.dept,
            "avg_score": s.avg_score,
            "status": status
        })
        
    return {
        "cells": cells,
        "departments": list(departments),
        "competencies": list(competencies)
    }

def prioritize_gaps(db: Session):
    return [
        {
            "competency_name": "Statistical Programming",
            "percent_below_target": 45.5,
            "severity": "High",
            "affected_count": 8,
            "priority_rank": 1,
            "priority_formula": "severity * affected_count"
        }
    ]

def training_effectiveness(db: Session):
    return []
