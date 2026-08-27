from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from models.user_competency import CompetencyScore, UserCompetency
from models.competency import Competency, CompetencyDependency, RoleCompetency, CompetencyTopic
from models.assessment import Assessment, AssessmentAnswer, Question
from models.user import User

def get_user_detailed_competencies(db: Session, user: User) -> List[Dict[str, Any]]:
    """
    Returns full continuous evaluation profile for the user:
    - Latest evidence-based current_score
    - Role benchmark target_score & weight
    - Previous assessment score & change points (+/- delta)
    - Percentage improvement trajectory
    - Number of assessments completed
    - Subtopic breakdown & weakest subtopic identification
    """
    # 1. Resolve role competency requirements
    role_reqs = []
    if user.role_id:
        role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
    elif user.designation:
        role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
    
    if not role_reqs:
        # Fallback to all competencies if no role assigned
        all_comps = db.query(Competency).all()
        role_reqs = [
            RoleCompetency(
                competency_id=c.id, 
                competency=c, 
                target_score=70.0, 
                weight=1.0, 
                level=c.level
            ) for c in all_comps
        ]

    # 2. Fetch live user_competencies
    user_comps = db.query(UserCompetency).filter(UserCompetency.user_id == user.id).all()
    uc_map = {uc.competency_id: uc for uc in user_comps}

    # 3. Fetch all historical measurements for this user
    all_scores = db.query(CompetencyScore).filter(
        CompetencyScore.user_id == user.id
    ).order_by(CompetencyScore.assessed_at.asc()).all()
    
    history_by_comp: Dict[int, List[CompetencyScore]] = {}
    for s in all_scores:
        history_by_comp.setdefault(s.competency_id, []).append(s)

    # 4. Fetch user answer performance by subtopic
    user_answers = db.query(AssessmentAnswer).join(Assessment).filter(
        Assessment.user_id == user.id
    ).all()

    subtopic_perf: Dict[int, Dict[str, int]] = {}
    for a in user_answers:
        if a.question and a.question.topic_id:
            tid = a.question.topic_id
            subtopic_perf.setdefault(tid, {"total": 0, "correct": 0})
            subtopic_perf[tid]["total"] += 1
            if a.is_correct:
                subtopic_perf[tid]["correct"] += 1

    results = []
    for req in role_reqs:
        cid = req.competency_id
        comp = req.competency or db.query(Competency).filter(Competency.id == cid).first()
        comp_name = comp.name if comp else f"Competency {cid}"
        domain = comp.domain if comp else "Core"
        target_score = req.target_score if hasattr(req, "target_score") and req.target_score else 70.0
        weight = req.weight if hasattr(req, "weight") and req.weight else 1.0

        uc = uc_map.get(cid)
        current_score = uc.current_score if uc else None
        confidence = uc.confidence if uc else 85.0
        status = uc.status if uc else "not_assessed"
        last_assessed = uc.last_assessed if uc else None

        # Calculate historical trajectory deltas
        c_history = history_by_comp.get(cid, [])
        assessment_count = len(c_history)
        previous_score = None
        change_points = None
        percentage_improvement = None
        trend = "unassessed"

        if assessment_count >= 2:
            previous_score = c_history[-2].score
            curr = current_score if current_score is not None else c_history[-1].score
            change_points = round(curr - previous_score, 1)
            percentage_improvement = round((change_points / previous_score) * 100.0, 1) if previous_score > 0 else 0.0
            trend = "improving" if change_points > 0 else ("declining" if change_points < 0 else "steady")
        elif assessment_count == 1:
            previous_score = c_history[0].score
            change_points = 0.0
            percentage_improvement = 0.0
            trend = "new"

        gap = max(0.0, target_score - current_score) if current_score is not None else None

        # Build subtopics breakdown
        topics = db.query(CompetencyTopic).filter(CompetencyTopic.competency_id == cid).all()
        subtopic_items = []
        weakest_subtopic_name = None
        min_subtopic_acc = 101.0

        for t in topics:
            p = subtopic_perf.get(t.id, {"total": 0, "correct": 0})
            tot = p["total"]
            corr = p["correct"]
            if tot > 0:
                acc = round((corr / tot) * 100.0, 1)
                st_status = "strong" if acc >= 80 else ("on_track" if acc >= 60 else "weak")
                if acc < min_subtopic_acc:
                    min_subtopic_acc = acc
                    weakest_subtopic_name = t.name
            else:
                acc = None
                st_status = "untested"

            subtopic_items.append({
                "topic_id": t.id,
                "topic_name": t.name,
                "competency_id": cid,
                "score": acc,
                "questions_total": tot,
                "questions_correct": corr,
                "status": st_status
            })

        results.append({
            "competency_id": cid,
            "competency_name": comp_name,
            "domain": domain,
            "current_score": current_score,
            "target_score": target_score,
            "weight": weight,
            "gap": gap,
            "previous_score": previous_score,
            "change_points": change_points,
            "percentage_improvement": percentage_improvement,
            "assessment_count": assessment_count,
            "trend": trend,
            "confidence": confidence,
            "status": status,
            "last_assessed": last_assessed,
            "subtopics": subtopic_items,
            "weakest_subtopic": weakest_subtopic_name
        })

    return results

def get_user_competency_history(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """Fetches chronological historical measurement trail across all assessments."""
    scores = db.query(CompetencyScore).filter(
        CompetencyScore.user_id == user_id
    ).order_by(CompetencyScore.assessed_at.desc()).all()

    return [
        {
            "id": s.id,
            "competency_id": s.competency_id,
            "competency_name": s.competency.name if s.competency else f"Competency {s.competency_id}",
            "score": s.score,
            "assessment_id": s.assessment_id,
            "source": s.source or "assessment",
            "assessed_at": s.assessed_at
        }
        for s in scores
    ]

def get_user_ranked_gaps(db: Session, user: User) -> List[Dict[str, Any]]:
    """Returns deficit gaps ranked by weighted impact for targeted learning interventions."""
    detailed = get_user_detailed_competencies(db, user)
    gaps = []
    
    for item in detailed:
        curr = item["current_score"]
        target = item["target_score"]
        gap = max(0.0, target - (curr or 0.0))
        priority_weight = round(gap * item.get("weight", 1.0), 1)

        action = f"Complete targeted diagnostic for {item['competency_name']}"
        if item.get("weakest_subtopic"):
            action = f"Review foundational modules for {item['weakest_subtopic']}"
        elif curr is not None and curr >= target:
            action = "Proficiency verified • Maintain with periodic pulse checks"

        gaps.append({
            "competency_id": item["competency_id"],
            "competency_name": item["competency_name"],
            "domain": item["domain"],
            "current_score": curr,
            "target_score": target,
            "gap": gap,
            "priority_weight": priority_weight,
            "status": item["status"],
            "weakest_subtopic": item.get("weakest_subtopic"),
            "recommended_action": action
        })

    return sorted(gaps, key=lambda x: x["priority_weight"], reverse=True)

def get_user_competency_insights(db: Session, user: User) -> Dict[str, Any]:
    """
    Computes deterministic, explainable readiness analytics:
    - Weighted role readiness score
    - Total points gained across continuous assessments
    - Strongest verified capability
    - Priority bottleneck deficit gap
    - Subtopic granular insight
    """
    detailed = get_user_detailed_competencies(db, user)
    
    total_weighted_score = 0.0
    total_weights = 0.0
    assessed_count = 0
    targets_met_count = 0
    critical_gaps_count = 0
    total_points_gained = 0.0

    strongest_item = None
    max_score = -1.0
    bottleneck_item = None
    max_weighted_gap = -1.0
    weakest_subtopic_info = None

    for item in detailed:
        w = item.get("weight", 1.0)
        curr = item["current_score"]
        target = item["target_score"]

        total_weights += w

        if curr is not None:
            assessed_count += 1
            total_weighted_score += (curr * w)
            if curr >= target:
                targets_met_count += 1
            if (target - curr) > 20.0:
                critical_gaps_count += 1
            if curr > max_score:
                max_score = curr
                strongest_item = {
                    "competency_name": item["competency_name"],
                    "score": curr,
                    "target_score": target
                }

        # Track priority bottleneck gap (must be inside the detailed loop)
        gap = max(0.0, target - (curr or 0.0))
        w_gap = gap * w
        if w_gap > max_weighted_gap and gap > 0:
            max_weighted_gap = w_gap
            bottleneck_item = {
                "competency_name": item["competency_name"],
                "current_score": curr,
                "target_score": target,
                "gap": gap,
                "weight": w
            }

        # Track weakest subtopic (must be inside the detailed loop)
        if item.get("weakest_subtopic") and (not weakest_subtopic_info or item.get("gap", 0) > weakest_subtopic_info.get("gap", 0)):
            weakest_subtopic_info = {
                "competency_name": item["competency_name"],
                "subtopic_name": item["weakest_subtopic"],
                "gap": item.get("gap", 0)
            }

    # Track total improvement points gained since initial baseline assessment
    all_scores = db.query(CompetencyScore).filter(
        CompetencyScore.user_id == user.id
    ).order_by(CompetencyScore.assessed_at.asc()).all()
    
    comp_history: Dict[int, List[float]] = {}
    for s in all_scores:
        comp_history.setdefault(s.competency_id, []).append(s.score)

    for cid, scores_list in comp_history.items():
        if len(scores_list) >= 2:
            growth = round(scores_list[-1] - scores_list[0], 1)
            if growth > 0:
                total_points_gained += growth

    overall_readiness = round((total_weighted_score / total_weights), 1) if total_weights > 0 else 0.0

    # Total distinct assessments
    total_assessments = db.query(Assessment).filter(
        Assessment.user_id == user.id,
        Assessment.status == "completed"
    ).count()

    summary = "Continuous evaluation active."
    if bottleneck_item and weakest_subtopic_info:
        summary = f"Your overall readiness is {overall_readiness}%. Priority focus is required on {bottleneck_item['competency_name']}, specifically {weakest_subtopic_info['subtopic_name']}."
    elif targets_met_count == len(detailed) and len(detailed) > 0:
        summary = f"Exceptional readiness ({overall_readiness}%). All official role benchmarks satisfied."

    return {
        "overall_readiness": overall_readiness,
        "total_assessments_taken": total_assessments,
        "total_improvement_points": round(total_points_gained, 1),
        "assessed_competencies_count": assessed_count,
        "total_role_competencies_count": len(detailed),
        "targets_met_count": targets_met_count,
        "critical_gaps_count": critical_gaps_count,
        "strongest_competency": strongest_item,
        "priority_bottleneck_gap": bottleneck_item,
        "weakest_subtopic_insight": weakest_subtopic_info,
        "diagnostic_summary": summary
    }

# Legacy helpers
def get_user_competency_scores(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    detailed = get_user_detailed_competencies(db, user)
    return {d["competency_id"]: d for d in detailed}

def compute_user_gaps(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    return get_user_ranked_gaps(db, user)

def get_competency_tree(db: Session):
    competencies = db.query(Competency).all()
    deps = db.query(CompetencyDependency).all()
    tree_nodes = {c.id: {"id": c.id, "name": c.name, "score": None, "required": None, "children": []} for c in competencies}
    for dep in deps:
        if dep.competency_id in tree_nodes and dep.prerequisite_id in tree_nodes:
            tree_nodes[dep.prerequisite_id]["children"].append(tree_nodes[dep.competency_id])
    child_ids = {dep.competency_id for dep in deps}
    return [node for c_id, node in tree_nodes.items() if c_id not in child_ids]
