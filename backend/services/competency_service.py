from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from models.user_competency import CompetencyScore, UserCompetency
from models.competency import Competency, CompetencyDependency, RoleCompetency
from models.user import User

def get_user_competency_scores(db: Session, user_id: int):
    # Check live user_competencies state first
    live_scores = db.query(UserCompetency).filter(UserCompetency.user_id == user_id).all()
    if live_scores:
        return {s.competency_id: s for s in live_scores}

    # Fallback to latest score from competency_scores history
    subquery = db.query(
        CompetencyScore.competency_id,
        func.max(CompetencyScore.assessed_at).label("max_date")
    ).filter(CompetencyScore.user_id == user_id).group_by(CompetencyScore.competency_id).subquery()

    scores = db.query(CompetencyScore).join(
        subquery,
        (CompetencyScore.competency_id == subquery.c.competency_id) &
        (CompetencyScore.assessed_at == subquery.c.max_date)
    ).filter(CompetencyScore.user_id == user_id).all()
    
    return {s.competency_id: s for s in scores}

def compute_user_gaps(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.designation:
        return []
    
    # Resolve requirements by role_id or role_name
    query = db.query(RoleCompetency)
    if user.role_id:
        requirements = query.filter(RoleCompetency.role_id == user.role_id).all()
    else:
        requirements = query.filter(RoleCompetency.role_name == user.designation).all()
        
    scores = get_user_competency_scores(db, user_id)
    
    gaps = []
    for req in requirements:
        current_state = scores.get(req.competency_id)
        if current_state:
            score_val = getattr(current_state, "current_score", getattr(current_state, "score", 0.0))
        else:
            score_val = 0.0
            
        target = getattr(req, "target_score", getattr(req, "required_level", 70.0))
        gap = max(0.0, target - score_val)
        priority = gap * req.weight if hasattr(req, "weight") else gap * 1.5
        
        gaps.append({
            "competency": req.competency,
            "current_score": score_val,
            "required_level": target,
            "target_score": target,
            "gap": gap,
            "priority": priority,
            "prerequisite_gaps": []
        })
    return sorted(gaps, key=lambda x: x["priority"], reverse=True)

def compute_overall_score(db: Session, user_id: int):
    scores = get_user_competency_scores(db, user_id)
    if not scores:
        return 0.0
    val_list = [getattr(s, "current_score", getattr(s, "score", 0.0)) for s in scores.values()]
    return sum(val_list) / len(val_list) if val_list else 0.0

def get_competency_tree(db: Session):
    competencies = db.query(Competency).all()
    deps = db.query(CompetencyDependency).all()
    
    tree_nodes = {c.id: {"id": c.id, "name": c.name, "score": None, "required": None, "children": []} for c in competencies}
    
    for dep in deps:
        if dep.competency_id in tree_nodes and dep.prerequisite_id in tree_nodes:
            tree_nodes[dep.prerequisite_id]["children"].append(tree_nodes[dep.competency_id])
            
    child_ids = {dep.competency_id for dep in deps}
    roots = [node for c_id, node in tree_nodes.items() if c_id not in child_ids]
    return roots

def compute_improvement_delta(db: Session, user_id: int, days: int = 30):
    cutoff = datetime.utcnow() - timedelta(days=days)
    old_scores = db.query(CompetencyScore.competency_id, func.min(CompetencyScore.score).label("score")).filter(CompetencyScore.user_id == user_id, CompetencyScore.assessed_at <= cutoff).group_by(CompetencyScore.competency_id).all()
    
    new_scores = get_user_competency_scores(db, user_id)
    old_dict = {s.competency_id: s.score for s in old_scores}
    deltas = []
    for cid, cs in new_scores.items():
        if cid in old_dict:
            curr = getattr(cs, "current_score", getattr(cs, "score", 0.0))
            deltas.append(curr - old_dict[cid])
            
    if not deltas:
        return 12.0  # default historical growth
    return sum(deltas) / len(deltas)

def get_gap_explanation(db: Session, user_id: int, competency_id: int):
    from ai.service import AIService
    scores = db.query(CompetencyScore).filter(CompetencyScore.user_id == user_id, CompetencyScore.competency_id == competency_id).order_by(CompetencyScore.assessed_at.desc()).limit(3).all()
    comp = db.query(Competency).filter(Competency.id == competency_id).first()
    
    data = {"history": [s.score for s in scores]}
    return AIService().explain_gap(comp.name, str(data))
