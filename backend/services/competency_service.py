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
        role_reqs = db.query(RoleCompetency).join(Competency).filter(
            RoleCompetency.role_id == user.role_id,
            Competency.is_official == True
        ).all()
    elif user.designation:
        role_reqs = db.query(RoleCompetency).join(Competency).filter(
            RoleCompetency.role_name == user.designation,
            Competency.is_official == True
        ).all()
    
    if not role_reqs:
        # Fallback to all official competencies if no role assigned
        all_comps = db.query(Competency).filter(
            Competency.is_official == True,
            ~Competency.name.ilike("%temp%"),
            ~Competency.name.ilike("%test%"),
            ~Competency.name.ilike("%zero%"),
            ~Competency.name.ilike("%demo%"),
            ~Competency.name.ilike("%mock%")
        ).order_by(Competency.id.asc()).all()
        role_reqs = [
            RoleCompetency(
                competency_id=c.id, 
                competency=c, 
                target_score=70.0, 
                weight=1.0, 
                target_level=3
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

        evidence_count = uc.evidence_count if (uc and uc.evidence_count is not None) else 0
        evidence_level = uc.evidence_level if (uc and uc.evidence_level) else ("UNASSESSED" if current_score is None else ("LOW" if evidence_count <= 3 else ("MEDIUM" if evidence_count <= 8 else "HIGH")))

        results.append({
            "competency_id": cid,
            "competency_name": comp_name,
            "domain": domain,
            "current_score": current_score,
            "target_score": target_score,
            "weight": weight,
            "gap": gap,
            "evidence_count": evidence_count,
            "evidence_level": evidence_level,
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
        is_assessed = curr is not None

        if is_assessed:
            gap = round(max(0.0, target - curr), 1)
            priority_weight = round(gap * item.get("weight", 1.0), 1)
            if item.get("weakest_subtopic") and gap > 0:
                action = f"Review foundational modules for {item['weakest_subtopic']}"
            elif curr >= target:
                action = "Proficiency verified • Maintain with periodic pulse checks"
            else:
                action = f"Targeted practice recommended for {item['competency_name']}"
        else:
            gap = None
            priority_weight = 0.0
            action = f"Take diagnostic assessment to evaluate {item['competency_name']}"

        gaps.append({
            "competency_id": item["competency_id"],
            "competency_name": item["competency_name"],
            "domain": item["domain"],
            "current_score": curr,
            "target_score": target,
            "gap": gap,
            "is_assessed": is_assessed,
            "evidence_count": item.get("evidence_count", 0),
            "evidence_level": item.get("evidence_level", "UNASSESSED"),
            "priority_weight": priority_weight,
            "status": item["status"],
            "weakest_subtopic": item.get("weakest_subtopic"),
            "recommended_action": action
        })

    # Sort: 1) Active assessed deficits by priority_weight desc, 2) Unassessed, 3) Verified proficient
    def sort_key(x):
        if x["is_assessed"]:
            if (x["gap"] or 0.0) > 0:
                return (2, x["priority_weight"], -x["competency_id"])
            return (0, -(x["current_score"] or 0.0), -x["competency_id"])
        return (1, 0.0, -x["competency_id"])

    return sorted(gaps, key=sort_key, reverse=True)


def get_canonical_learner_gap_state(db: Session, user: User) -> Dict[str, Any]:
    """
    SINGLE SOURCE OF TRUTH for the learner's current competency gap and intervention state.
    Used across:
    - Dashboard Priority Gap & Scorecard
    - Diagnostic Evidence (/api/competencies/me/diagnosis)
    - Recommended Intervention (/api/courses/recommended)
    - Learning Journey Stepper
    - Learning Path (/api/learning-path/)
    - iGOT Learning / Courses Deep Linking
    - Progress Scorecards
    """
    from models.course import Course, CourseCompetency
    from models.recommendation import AIDiagnosis
    from models.role import Role

    detailed = get_user_detailed_competencies(db, user)
    ranked_gaps = get_user_ranked_gaps(db, user)

    # 1. Identify Canonical Primary Gap
    assessed_deficits = [g for g in ranked_gaps if g["is_assessed"] and (g["gap"] or 0.0) > 0]
    
    if assessed_deficits:
        primary_gap = assessed_deficits[0]
    elif any(g["is_assessed"] for g in ranked_gaps):
        assessed_all = [g for g in ranked_gaps if g["is_assessed"]]
        primary_gap = sorted(assessed_all, key=lambda x: (x["current_score"] - x["target_score"], x["competency_id"]))[0]
    elif ranked_gaps:
        primary_gap = ranked_gaps[0]
    else:
        primary_gap = None

    target_cid = primary_gap["competency_id"] if primary_gap else 1
    target_cname = primary_gap["competency_name"] if primary_gap else "Statistical Literacy & Reasoning"
    target_domain = primary_gap.get("domain", "Core Theory") if primary_gap else "Core Theory"

    # 2. Identify Canonical Recommendation targeting target_cid
    candidate_courses = db.query(Course).join(CourseCompetency).filter(
        CourseCompetency.competency_id == target_cid,
        Course.is_active == True
    ).all()
    if not candidate_courses:
        candidate_courses = db.query(Course).filter(
            Course.competency_id == target_cid,
            Course.is_active == True
        ).all()

    from services.recommendation_service import RecommendationService
    role_comp_ids = [d["competency_id"] for d in detailed]
    
    scored_candidates = []
    for c in candidate_courses:
        score_data = RecommendationService.calculate_recommendation_score(c, user, detailed, role_comp_ids)
        scored_candidates.append({
            "course": c,
            "match_percent": score_data["match_percent"],
            "score_data": score_data
        })

    scored_candidates.sort(key=lambda x: (x["match_percent"], -(x["course"].duration_hours or 2.0)), reverse=True)

    canonical_rec = None
    if scored_candidates:
        best = scored_candidates[0]
        c = best["course"]
        sd = best["score_data"]
        canonical_rec = {
            "id": c.id,
            "course_id": c.id,
            "title": c.title,
            "name": c.title,
            "description": c.description,
            "provider": c.provider or "iGOT Karmayogi",
            "resource_type": c.resource_type or "igot_course",
            "igot_identifier": c.igot_identifier or c.external_id,
            "external_id": c.external_id or c.igot_identifier,
            "external_url": c.external_url or "https://igotkarmayogi.gov.in/",
            "difficulty": c.difficulty or "intermediate",
            "duration_hours": c.duration_hours or 2.0,
            "duration_display": c.duration_display or f"{c.duration_hours}h",
            "competency_id": target_cid,
            "competency_name": target_cname,
            "topic_id": c.topic_id,
            "topic_name": c.topic.name if c.topic else None,
            "match_percent": sd["match_percent"],
            "explanation": sd["explanation"],
            "is_igot": c.is_igot if c.is_igot is not None else True,
            "confidence": "High"
        }
    else:
        all_recs = RecommendationService.get_personalized_recommendations(db, user, limit=1)
        canonical_rec = all_recs[0] if all_recs else None

    # 3. Identify Canonical Diagnosis strictly for target_cid
    cached_diag = db.query(AIDiagnosis).filter(
        AIDiagnosis.user_id == user.id,
        AIDiagnosis.competency_id == target_cid
    ).order_by(AIDiagnosis.created_at.desc()).first()

    weak_sub = primary_gap.get("weakest_subtopic") if primary_gap else None

    if cached_diag:
        canonical_diag = {
            "assessment_id": cached_diag.assessment_id,
            "competency_id": target_cid,
            "competency_name": target_cname,
            "domain": target_domain,
            "primary_gap": cached_diag.primary_gap or f"{target_cname} Deficit",
            "root_cause": cached_diag.root_cause,
            "explanation": cached_diag.explanation,
            "confidence": cached_diag.confidence or 88.0,
            "weakest_subtopic_name": weak_sub,
            "is_cached": True
        }
    else:
        is_assessed = primary_gap.get("is_assessed", False) if primary_gap else False
        gap_val = primary_gap.get("gap") if primary_gap else 0.0
        target_score = primary_gap.get("target_score", 70.0) if primary_gap else 70.0
        curr_score = primary_gap.get("current_score") if primary_gap else None

        if is_assessed and gap_val and gap_val > 0:
            explanation = (
                f"Assessment telemetry indicates an active {gap_val} point deficit against the "
                f"national {target_score}% benchmark. Dedicated intervention in {target_cname} is recommended."
            )
            root_cause = (
                f"Subtopic mastery deficit observed in {weak_sub}."
                if weak_sub
                else f"Foundational application gaps identified in {target_cname}."
            )
        elif is_assessed:
            explanation = f"Proficiency verified at {curr_score}% against the {target_score}% role benchmark."
            root_cause = "Core competencies benchmark satisfied."
        else:
            explanation = f"Diagnostic assessment pending to establish verified baseline for {target_cname}."
            root_cause = "Initial role-specific baseline evaluation required."

        canonical_diag = {
            "assessment_id": None,
            "competency_id": target_cid,
            "competency_name": target_cname,
            "domain": target_domain,
            "primary_gap": f"{target_cname} Deficit" if (is_assessed and gap_val and gap_val > 0) else f"{target_cname} Evaluation",
            "root_cause": root_cause,
            "explanation": explanation,
            "confidence": 88.0,
            "weakest_subtopic_name": weak_sub,
            "is_cached": False
        }

    role_name = None
    if user.role_id:
        r_obj = db.query(Role).filter(Role.id == user.role_id).first()
        if r_obj:
            role_name = r_obj.name
    if not role_name:
        role_name = user.designation or "Statistical Officer"

    return {
        "user_id": user.id,
        "role_id": user.role_id,
        "role_name": role_name,
        "primary_gap": primary_gap,
        "canonical_recommendation": canonical_rec,
        "canonical_diagnosis": canonical_diag,
        "competencies": detailed,
        "ranked_gaps": ranked_gaps
    }


def get_user_competency_insights(db: Session, user: User) -> Dict[str, Any]:
    """
    Computes deterministic, explainable readiness analytics:
    - Weighted role readiness score across assessed competencies
    - Total points gained across continuous assessments
    - Strongest verified capability
    - Priority bottleneck deficit gap (only for assessed gaps)
    - Subtopic granular insight
    """
    state = get_canonical_learner_gap_state(db, user)
    detailed = state["competencies"]
    
    total_weighted_score = 0.0
    assessed_weights = 0.0
    total_weights = 0.0
    assessed_count = 0
    targets_met_count = 0
    critical_gaps_count = 0
    total_points_gained = 0.0

    strongest_item = None
    max_score = -1.0
    bottleneck_item = state["primary_gap"] if (state["primary_gap"] and state["primary_gap"].get("is_assessed") and (state["primary_gap"].get("gap") or 0) > 0) else None
    weakest_subtopic_info = None

    for item in detailed:
        w = item.get("weight", 1.0)
        curr = item["current_score"]
        target = item["target_score"]

        total_weights += w

        if curr is not None:
            assessed_count += 1
            assessed_weights += w
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

        # Track weakest subtopic
        if item.get("weakest_subtopic") and (not weakest_subtopic_info or (item.get("gap") or 0) > (weakest_subtopic_info.get("gap") or 0)):
            weakest_subtopic_info = {
                "competency_name": item["competency_name"],
                "subtopic_name": item["weakest_subtopic"],
                "gap": item.get("gap") or 0
            }

    # If bottleneck_item is present and has weakest_subtopic, align weakest_subtopic_info with bottleneck_item
    if bottleneck_item and bottleneck_item.get("weakest_subtopic"):
        weakest_subtopic_info = {
            "competency_name": bottleneck_item["competency_name"],
            "subtopic_name": bottleneck_item["weakest_subtopic"],
            "gap": bottleneck_item.get("gap") or 0
        }

    # Track total improvement points gained since initial baseline assessment
    all_scores = db.query(CompetencyScore).filter(
        CompetencyScore.user_id == user.id
    ).order_by(CompetencyScore.assessed_at.asc()).all()
    
    comp_history: Dict[int, List[float]] = {}
    for s in all_scores:
        comp_history.setdefault(s.competency_id, []).append(s.score)

    has_multi_history = any(len(scores_list) >= 2 for scores_list in comp_history.values())

    for cid, scores_list in comp_history.items():
        if len(scores_list) >= 2:
            growth = round(scores_list[-1] - scores_list[0], 1)
            if growth > 0:
                total_points_gained += growth

    overall_readiness = round((total_weighted_score / assessed_weights), 1) if assessed_weights > 0 else 0.0

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
    elif assessed_count == 0:
        summary = "No diagnostic assessments completed yet. Begin with your baseline assessment."

    return {
        "overall_readiness": overall_readiness,
        "total_assessments_taken": total_assessments,
        "total_improvement_points": round(total_points_gained, 1),
        "has_baseline_history": has_multi_history,
        "assessed_competencies_count": assessed_count,
        "total_role_competencies_count": len(detailed),
        "targets_met_count": targets_met_count,
        "critical_gaps_count": critical_gaps_count,
        "strongest_competency": strongest_item,
        "priority_bottleneck_gap": bottleneck_item,
        "canonical_recommendation": state["canonical_recommendation"],
        "canonical_diagnosis": state["canonical_diagnosis"],
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
    competencies = db.query(Competency).filter(
        Competency.is_official == True,
        ~Competency.name.ilike("%temp%"),
        ~Competency.name.ilike("%test%"),
        ~Competency.name.ilike("%zero%"),
        ~Competency.name.ilike("%demo%"),
        ~Competency.name.ilike("%mock%")
    ).order_by(Competency.id.asc()).all()
    deps = db.query(CompetencyDependency).all()
    tree_nodes = {c.id: {"id": c.id, "name": c.name, "score": None, "required": None, "children": []} for c in competencies}
    for dep in deps:
        if dep.competency_id in tree_nodes and dep.prerequisite_id in tree_nodes:
            tree_nodes[dep.prerequisite_id]["children"].append(tree_nodes[dep.competency_id])
    child_ids = {dep.competency_id for dep in deps}
    return [node for c_id, node in tree_nodes.items() if c_id not in child_ids]

def check_user_baseline_completed(db: Session, user: User) -> bool:
    """
    Authoritative baseline completion check:
    A learner is considered baseline-complete ONLY when they have completed an official
    assessment whose actual served question evidence (Question.competency_id) covers
    ALL competencies required by their selected cadre.
    """
    if user.role == "admin":
        return True

    from models.role import Role

    # 1. Resolve role required competencies
    role_reqs = []
    if user.role_id:
        role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
    if not role_reqs and user.designation:
        role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
    if not role_reqs and user.role_id:
        role_obj = db.query(Role).filter(Role.id == user.role_id).first()
        if role_obj:
            role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == role_obj.name).all()

    required_comp_ids = {r.competency_id for r in role_reqs}
    if not required_comp_ids:
        return False

    # 2. Check completed assessments
    completed_assessments = db.query(Assessment).filter(
        Assessment.user_id == user.id,
        Assessment.status == "completed",
        Assessment.assessment_type.in_(["baseline", "adaptive", "adaptive_reassessment", "diagnostic"])
    ).all()

    for ass in completed_assessments:
        answers = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == ass.id).all()
        actual_comp_counts = {}
        for a in answers:
            cid = None
            if a.question and a.question.competency_id:
                cid = a.question.competency_id
            elif a.question_id:
                q = db.query(Question.competency_id).filter(Question.id == a.question_id).first()
                if q and q[0]:
                    cid = q[0]
            if cid:
                actual_comp_counts[cid] = actual_comp_counts.get(cid, 0) + 1

        if ass.assessment_type == "baseline":
            # Strict Baseline Validation: 15–20 total actual questions and >= 2 per required competency
            total_actual = len(answers)
            if 15 <= total_actual <= 20 and all(actual_comp_counts.get(cid, 0) >= 2 for cid in required_comp_ids):
                return True
        elif not actual_comp_counts:
            # If answer records are absent (e.g. historical seeded assessment), check CompetencyScore table for this assessment
            scores = db.query(CompetencyScore.competency_id).filter(
                CompetencyScore.user_id == user.id,
                CompetencyScore.assessment_id == ass.id
            ).all()
            assessed_comp_ids = {s[0] for s in scores}
            if required_comp_ids.issubset(assessed_comp_ids):
                return True
        elif required_comp_ids.issubset(set(actual_comp_counts.keys())):
            return True

    # 3. Fallback specifically for historical seeded learners (e.g. Arjun Patel id <= 20)
    if user.id and user.id <= 20:
        historical_comp_ids = set(
            s[0] for s in db.query(CompetencyScore.competency_id).filter(
                CompetencyScore.user_id == user.id
            ).all()
        ) | set(
            u[0] for u in db.query(UserCompetency.competency_id).filter(
                UserCompetency.user_id == user.id
            ).all()
        )
        if required_comp_ids.issubset(historical_comp_ids) and bool(completed_assessments):
            return True

    return False

