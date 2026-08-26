from sqlalchemy.orm import Session
from services.competency_service import compute_user_gaps
from models.course import Course, CourseCompetency
from models.learning_path import LearningPath, LearningPathItem
from ai.service import AIService

def recommend_courses(db: Session, user_id: int):
    gaps = compute_user_gaps(db, user_id)
    if not gaps:
        return []
    
    gap_comp_ids = [g["competency"].id for g in gaps]
    
    courses = db.query(Course).filter(Course.is_active == True).all()
    recommendations = []
    
    for c in courses:
        # Check competency overlap
        c_comp_ids = [cc.competency_id for cc in c.competencies]
        overlap = set(gap_comp_ids).intersection(set(c_comp_ids))
        
        if overlap:
            match_percent = (len(overlap) / len(c_comp_ids)) * 100 if c_comp_ids else 50.0
            reasons = [f"Addresses your gap in {g['competency'].name}" for g in gaps if g['competency'].id in overlap]
            recommendations.append({
                "course": c,
                "match_percent": match_percent,
                "recommendation_reasons": reasons
            })
            
    return sorted(recommendations, key=lambda x: x["match_percent"], reverse=True)

def generate_learning_path(db: Session, user_id: int):
    # Check if active path exists
    existing = db.query(LearningPath).filter(LearningPath.user_id == user_id, LearningPath.is_active == True).first()
    if existing:
        existing.is_active = False
        db.commit()
        
    gaps = compute_user_gaps(db, user_id)
    recs = recommend_courses(db, user_id)
    
    path = LearningPath(user_id=user_id, ai_reasoning="Custom path based on recent assessment gaps.")
    db.add(path)
    db.flush()
    
    items = []
    order = 1
    for rec in recs[:5]:  # Top 5 courses
        c = rec["course"]
        item = LearningPathItem(
            learning_path_id=path.id,
            title=c.title,
            description=c.description,
            item_type="course",
            reference_id=c.id,
            order=order,
            estimated_duration=f"{c.duration_hours}h",
            difficulty=c.difficulty
        )
        db.add(item)
        items.append(item)
        order += 1
        
    db.commit()
    db.refresh(path)
    return path
