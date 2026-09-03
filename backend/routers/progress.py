from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import datetime

from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.assessment import Assessment, AssessmentAnswer, Question
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.user_competency import CompetencyScore, UserCompetency
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.course import Course
from models.role import Role
from services.competency_service import (
    get_user_detailed_competencies,
    get_user_competency_insights,
    get_user_ranked_gaps
)
from schemas.progress import (
    ProgressOverviewResponse,
    MilestonesCompletedSummary,
    CompetencyProgressItem,
    CompetencyScorePoint,
    ProgressAnalyticsResponse,
    DifficultyBreakdown,
    DifficultyAccuracy,
    ConfidenceCalibration,
    TimelineItemResponse
)

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/overview", response_model=ProgressOverviewResponse)
def get_progress_overview(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Returns high-level longitudinal learner progress metrics:
    - Overall role readiness percentage
    - Net capability improvement points
    - Target benchmarks met vs total required
    - Active critical gaps count
    - Verified learning milestones count across courses, items, and quizzes
    """
    insights = get_user_competency_insights(db, current_user)
    detailed = get_user_detailed_competencies(db, current_user)

    benchmarks_met = sum(1 for d in detailed if d["current_score"] is not None and d["current_score"] >= d["target_score"])
    total_competencies = len(detailed)
    critical_gaps_count = sum(1 for d in detailed if d["current_score"] is not None and (d["target_score"] - d["current_score"]) > 20.0)

    # Count actual completed milestones
    courses_count = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.status == "completed"
    ).count()

    lp_items_count = db.query(LearningPathItem).join(LearningPath).filter(
        LearningPath.user_id == current_user.id,
        LearningPathItem.status == "completed"
    ).count()

    material_quizzes_count = db.query(Assessment).filter(
        Assessment.user_id == current_user.id,
        Assessment.assessment_type == "material_quiz",
        Assessment.status == "completed"
    ).count()

    reassessments_count = db.query(Assessment).filter(
        Assessment.user_id == current_user.id,
        Assessment.assessment_type.in_(["adaptive_reassessment", "reassessment"]),
        Assessment.status == "completed"
    ).count()

    role_name = None
    if current_user.role_id:
        role_obj = getattr(current_user, "role_rel", None) or db.query(Role).filter(Role.id == current_user.role_id).first()
        if role_obj:
            role_name = role_obj.name
    if not role_name:
        role_name = current_user.designation or "Statistical Officer"

    return ProgressOverviewResponse(
        user_id=current_user.id,
        role_name=role_name,
        overall_readiness=insights["overall_readiness"],
        total_improvement_points=insights["total_improvement_points"],
        has_baseline_history=insights.get("has_baseline_history", False),
        assessed_competencies_count=insights.get("assessed_competencies_count", 0),
        benchmarks_met=benchmarks_met,
        total_competencies=total_competencies,
        critical_gaps_count=critical_gaps_count,
        milestones_completed=MilestonesCompletedSummary(
            courses=courses_count,
            learning_path_items=lp_items_count,
            material_quizzes=material_quizzes_count,
            reassessments=reassessments_count
        )
    )

@router.get("/competencies", response_model=List[CompetencyProgressItem])
def get_competency_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full continuous evaluation scorecard per competency, including
    subtopic mastery breakdown and chronological score progression history.
    """
    detailed = get_user_detailed_competencies(db, current_user)

    # Fetch all historical scores for user
    all_scores = db.query(CompetencyScore).filter(
        CompetencyScore.user_id == current_user.id
    ).order_by(CompetencyScore.assessed_at.asc()).all()

    scores_by_cid: Dict[int, List[CompetencyScore]] = {}
    for s in all_scores:
        scores_by_cid.setdefault(s.competency_id, []).append(s)

    items = []
    for d in detailed:
        cid = d["competency_id"]
        c_history = scores_by_cid.get(cid, [])

        history_points = [
            CompetencyScorePoint(
                date=h.assessed_at.isoformat() if h.assessed_at else datetime.utcnow().isoformat(),
                score=h.score,
                source=h.source or "assessment",
                assessment_id=h.assessment_id
            )
            for h in c_history
        ]

        items.append(CompetencyProgressItem(
            competency_id=cid,
            competency_name=d["competency_name"],
            domain=d.get("domain"),
            current_score=d.get("current_score"),
            target_score=d.get("target_score", 70.0),
            gap=d.get("gap"),
            previous_score=d.get("previous_score"),
            change_points=d.get("change_points"),
            trend=d.get("trend", "unassessed"),
            status=d.get("status", "not_assessed"),
            assessment_count=d.get("assessment_count", 0),
            last_assessed=d.get("last_assessed"),
            weakest_subtopic=d.get("weakest_subtopic"),
            subtopics=d.get("subtopics", []),
            history_points=history_points
        ))

    return items

@router.get("/analytics", response_model=ProgressAnalyticsResponse)
def get_progress_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns authentic assessment telemetry analytics:
    - Performance accuracy broken down by question difficulty (Levels 1, 2, 3)
    - Confidence calibration matrix (identifying overconfidence misconceptions)
    - Average response speed
    - Assessment completion volume across assessment modes
    """
    user_answers = db.query(AssessmentAnswer).join(Assessment).filter(
        Assessment.user_id == current_user.id
    ).all()

    # 1. Difficulty breakdown
    diff_stats = {
        1: {"total": 0, "correct": 0},
        2: {"total": 0, "correct": 0},
        3: {"total": 0, "correct": 0}
    }

    # 2. Confidence calibration matrix
    conf_stats = {
        "high_corr": 0,
        "high_incorr": 0,
        "low_corr": 0,
        "low_incorr": 0
    }

    response_times = []

    for ans in user_answers:
        # Determine difficulty: use question.difficulty or material_quiz_question.difficulty
        diff = None
        if ans.question and ans.question.difficulty:
            try:
                diff = int(ans.question.difficulty)
            except (ValueError, TypeError):
                diff = 2
        elif ans.material_quiz_question and ans.material_quiz_question.difficulty:
            try:
                diff = int(ans.material_quiz_question.difficulty)
            except (ValueError, TypeError):
                diff = 2
        diff = diff if diff in [1, 2, 3] else 2

        diff_stats[diff]["total"] += 1
        if ans.is_correct:
            diff_stats[diff]["correct"] += 1

        # Confidence calibration: 3 on 3-point scale or >= 4 on 5-point scale is High
        c_lvl = ans.confidence_level or 2
        if c_lvl >= 3:
            if ans.is_correct:
                conf_stats["high_corr"] += 1
            else:
                conf_stats["high_incorr"] += 1
        else:
            if ans.is_correct:
                conf_stats["low_corr"] += 1
            else:
                conf_stats["low_incorr"] += 1

        if ans.time_taken_seconds is not None and ans.time_taken_seconds > 0:
            response_times.append(ans.time_taken_seconds)

    diff_bd = DifficultyBreakdown(
        level_1=DifficultyAccuracy(
            total=diff_stats[1]["total"],
            correct=diff_stats[1]["correct"],
            accuracy=round((diff_stats[1]["correct"] / diff_stats[1]["total"]) * 100.0, 1) if diff_stats[1]["total"] > 0 else 0.0
        ),
        level_2=DifficultyAccuracy(
            total=diff_stats[2]["total"],
            correct=diff_stats[2]["correct"],
            accuracy=round((diff_stats[2]["correct"] / diff_stats[2]["total"]) * 100.0, 1) if diff_stats[2]["total"] > 0 else 0.0
        ),
        level_3=DifficultyAccuracy(
            total=diff_stats[3]["total"],
            correct=diff_stats[3]["correct"],
            accuracy=round((diff_stats[3]["correct"] / diff_stats[3]["total"]) * 100.0, 1) if diff_stats[3]["total"] > 0 else 0.0
        )
    )

    conf_cal = ConfidenceCalibration(
        high_confidence_correct=conf_stats["high_corr"],
        high_confidence_incorrect=conf_stats["high_incorr"],
        low_confidence_correct=conf_stats["low_corr"],
        low_confidence_incorrect=conf_stats["low_incorr"]
    )

    avg_speed = round(sum(response_times) / len(response_times), 1) if response_times else 0.0

    # 3. Assessment volume by type
    completed_assessments = db.query(
        Assessment.assessment_type, 
        func.count(Assessment.id)
    ).filter(
        Assessment.user_id == current_user.id,
        Assessment.status == "completed"
    ).group_by(Assessment.assessment_type).all()

    type_counts = {t or "assessment": count for t, count in completed_assessments}

    return ProgressAnalyticsResponse(
        difficulty_breakdown=diff_bd,
        confidence_calibration=conf_cal,
        average_response_time_seconds=avg_speed,
        assessments_completed_by_type=type_counts
    )

@router.get("/timeline", response_model=List[TimelineItemResponse])
def get_progress_timeline(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns unified chronological activity timeline strictly based on actual
    database event completions (assessments, reassessments, courses, learning path items).
    """
    events = []

    # 1. Completed Assessments (Baseline, Adaptive, Reassessment, Material Quiz)
    assessments = db.query(Assessment).filter(
        Assessment.user_id == current_user.id,
        Assessment.status == "completed"
    ).all()

    for a in assessments:
        t_stamp = a.completed_at or a.started_at or datetime.utcnow()
        a_type = a.assessment_type or "diagnostic"

        if a_type == "adaptive_reassessment":
            title = f"Targeted Reassessment #{a.id}"
            desc = f"Completed single-competency reassessment with score {a.overall_score}%."
        elif a_type == "material_quiz":
            title = f"Material Adaptive Quiz #{a.id}"
            desc = f"Completed document-level recall quiz with score {a.overall_score}%."
        elif a_type == "practice":
            title = f"Targeted Practice #{a.id}"
            desc = f"Completed practice module with score {a.overall_score}%."
        else:
            title = f"Diagnostic Assessment #{a.id}"
            desc = f"Completed comprehensive evaluation with overall readiness {a.overall_score}%."

        events.append({
            "id": f"assessment_{a.id}",
            "event_type": a_type,
            "title": title,
            "description": desc,
            "score": a.overall_score,
            "delta": None,
            "timestamp": t_stamp,
            "metadata": {"assessment_id": a.id, "type": a_type}
        })

    # 2. Completed Courses
    courses = db.query(LearningProgress, Course).join(
        Course, LearningProgress.course_id == Course.id
    ).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.status == "completed"
    ).all()

    for prog, c in courses:
        t_stamp = prog.completed_at or prog.started_at or datetime.utcnow()
        events.append({
            "id": f"course_{c.id}",
            "event_type": "course",
            "title": f"Course Completed: {c.title}",
            "description": f"Mastered official curriculum module from {c.provider or 'iGOT Karmayogi'}.",
            "score": 100.0,
            "delta": None,
            "timestamp": t_stamp,
            "metadata": {"course_id": c.id}
        })

    # 3. Completed Learning Path Items
    lp_items = db.query(LearningPathItem).join(LearningPath).filter(
        LearningPath.user_id == current_user.id,
        LearningPathItem.status == "completed"
    ).all()

    for item in lp_items:
        t_stamp = getattr(item, 'completed_at', None) or (item.learning_path.created_at if getattr(item, 'learning_path', None) else None) or datetime.utcnow()
        events.append({
            "id": f"lp_item_{item.id}",
            "event_type": "learning_path",
            "title": f"Milestone: {item.title}",
            "description": "Completed structured capability milestone.",
            "score": None,
            "delta": None,
            "timestamp": t_stamp,
            "metadata": {"item_id": item.id}
        })

    # Sort strictly chronological (newest first)
    events.sort(key=lambda x: x["timestamp"], reverse=True)

    return [TimelineItemResponse(**e) for e in events[:limit]]

# Backward compatibility routes
@router.get("/")
def get_progress_legacy(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Legacy backward-compatible endpoint."""
    return get_competency_progress(db, current_user)

@router.get("/improvement")
def get_improvement_legacy(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Legacy backward-compatible endpoint."""
    return get_progress_overview(db, current_user)
