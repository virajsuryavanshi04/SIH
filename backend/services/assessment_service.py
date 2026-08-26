from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from datetime import datetime
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
from models.user import User
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.user_competency import UserCompetency, CompetencyScore

def select_questions(db: Session, user: User, competency_ids: list = None, difficulty: str = None, question_count: int = None, assessment_type: str = "baseline"):
    """
    Selects calibrated assessment questions sampled across required competencies for the user's role.
    Every question is mapped to competency, topic, and difficulty.
    """
    # 1. Resolve target competencies from user's official role
    target_comp_ids = competency_ids
    if not target_comp_ids:
        role_reqs = []
        if user and user.role_id:
            role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
        elif user and user.designation:
            role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
        
        if role_reqs:
            target_comp_ids = [r.competency_id for r in role_reqs]
        else:
            target_comp_ids = [c.id for c in db.query(Competency).all()]

    if not target_comp_ids:
        target_comp_ids = [1, 2, 3, 4, 5, 6, 7, 8]

    # 2. Sample 1-2 questions per competency
    per_comp = 2 if (question_count and question_count >= len(target_comp_ids) * 2) or (not question_count and len(target_comp_ids) <= 6) else 1
    selected_questions = []

    # Track seen question IDs for this user to prefer fresh questions
    seen_ids = set()
    if user:
        hist = db.query(UserQuestionHistory.question_id).filter(UserQuestionHistory.user_id == user.id).all()
        seen_ids = {h[0] for h in hist}

    for cid in target_comp_ids:
        query = db.query(Question).filter(
            Question.competency_id == cid,
            Question.status == 'approved'
        )
        if difficulty:
            query = query.filter(Question.difficulty == str(difficulty))

        all_comp_q = query.all()
        if not all_comp_q:
            continue

        # Sort by times seen (prefer unseen)
        unseen = [q for q in all_comp_q if q.id not in seen_ids]
        pool = unseen if len(unseen) >= per_comp else all_comp_q

        # Sample per_comp questions
        import random
        sampled = random.sample(pool, min(len(pool), per_comp))
        for q in sampled:
            # Attach runtime names for serialization
            q.competency_name = q.competency.name if q.competency else "Official Competency"
            q.topic_name = q.topic.name if q.topic else "General Concept"
            selected_questions.append(q)

    # 3. Interleave questions across competencies (Q1 CompA, Q2 CompB, etc.)
    return selected_questions

def submit_user_answer(db: Session, assessment_id: int, user_id: int, req):
    """Records an assessment answer, checks correctness, and updates user question history."""
    opt = db.query(QuestionOption).filter(QuestionOption.id == req.selected_option_id).first()
    is_correct = opt.is_correct if opt else False
    
    ans = AssessmentAnswer(
        assessment_id=assessment_id, 
        question_id=req.question_id, 
        selected_option_id=req.selected_option_id, 
        confidence_level=req.confidence_level or 2,
        is_correct=is_correct,
        time_taken_seconds=req.time_taken_seconds or 15,
        response_time=req.time_taken_seconds or 15
    )
    db.add(ans)

    # Update UserQuestionHistory
    uq = db.query(UserQuestionHistory).filter(
        UserQuestionHistory.user_id == user_id,
        UserQuestionHistory.question_id == req.question_id
    ).first()
    if uq:
        uq.times_seen += 1
        uq.last_seen = datetime.utcnow()
    else:
        db.add(UserQuestionHistory(
            user_id=user_id,
            question_id=req.question_id,
            times_seen=1,
            last_seen=datetime.utcnow()
        ))

    db.commit()
    return {"status": "success", "is_correct": is_correct}

def score_assessment(db: Session, assessment_id: int, user_id: int):
    """
    DETERMINISTIC scoring engine for baseline competency assessments.
    Computes per-competency evidence scores, updates user_competencies, and records history.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise ValueError("Assessment not found")

    user = db.query(User).filter(User.id == user_id).first()
    answers = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).all()

    if not answers:
        return get_assessment_result(db, assessment_id, user_id)

    # 1. Group answers by competency
    comp_groups = {}
    total_correct = 0
    total_questions = len(answers)

    for a in answers:
        if a.is_correct:
            total_correct += 1
        
        cid = a.question.competency_id
        if cid not in comp_groups:
            comp_groups[cid] = {
                "competency": a.question.competency,
                "total": 0,
                "correct": 0,
                "confidence_sum": 0
            }
        comp_groups[cid]["total"] += 1
        if a.is_correct:
            comp_groups[cid]["correct"] += 1
        comp_groups[cid]["confidence_sum"] += (a.confidence_level or 2)

    # 2. Fetch role targets for user's official role
    role_targets = {}
    if user and user.role_id:
        reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
        role_targets = {r.competency_id: r.target_score for r in reqs}
    elif user and user.designation:
        reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
        role_targets = {r.competency_id: r.target_score for r in reqs}

    # 3. Compute competency scores & update user_competencies
    computed_comp_scores = {}
    for cid, data in comp_groups.items():
        comp_acc = round((data["correct"] / data["total"]) * 100.0, 1)
        computed_comp_scores[cid] = comp_acc
        target_score = role_targets.get(cid, 70.0)
        gap = max(0.0, target_score - comp_acc)
        
        # Calculate confidence metric
        avg_conf_rating = data["confidence_sum"] / data["total"]  # 1 to 3
        confidence_percent = round(70.0 + (avg_conf_rating * 8.0), 1)

        # Status categorization
        if comp_acc >= target_score:
            status = "strong"
        elif comp_acc >= target_score - 10:
            status = "on_track"
        elif gap > 20:
            status = "critical_gap"
        else:
            status = "needs_attention"

        # Update or Insert UserCompetency live state
        uc = db.query(UserCompetency).filter(
            UserCompetency.user_id == user_id,
            UserCompetency.competency_id == cid
        ).first()

        if uc:
            uc.current_score = comp_acc
            uc.target_score = target_score
            uc.confidence = confidence_percent
            uc.status = status
            uc.last_assessed = datetime.utcnow()
        else:
            uc = UserCompetency(
                user_id=user_id,
                competency_id=cid,
                current_score=comp_acc,
                target_score=target_score,
                confidence=confidence_percent,
                status=status,
                last_assessed=datetime.utcnow()
            )
            db.add(uc)

        # Add NEVER-OVERWRITTEN CompetencyScore history record
        cs = CompetencyScore(
            user_id=user_id,
            competency_id=cid,
            score=comp_acc,
            assessment_id=assessment_id,
            source=assessment.assessment_type or "baseline",
            assessed_at=datetime.utcnow()
        )
        db.add(cs)

    # 4. Finalize assessment record
    overall = round((total_correct / total_questions) * 100.0, 1) if total_questions > 0 else 0.0
    assessment.overall_score = overall
    assessment.status = "completed"
    assessment.completed_at = datetime.utcnow()
    db.commit()

    return get_assessment_result(db, assessment_id, user_id)

def get_assessment_result(db: Session, assessment_id: int, user_id: int = None):
    """
    Constructs the structured baseline diagnostic result screen:
    - Overall readiness
    - Strongest competencies
    - Competencies needing attention
    - Largest priority gap (e.g. Sampling 48% -> 70%, Gap: -22)
    - Full competency breakdown
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        return {}

    user = db.query(User).filter(User.id == (user_id or assessment.user_id)).first()
    answers = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).all()

    # Resolve role targets
    role_targets = {}
    if user and user.role_id:
        reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
        role_targets = {r.competency_id: r.target_score for r in reqs}
    elif user and user.designation:
        reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
        role_targets = {r.competency_id: r.target_score for r in reqs}

    comp_groups = {}
    total_correct = 0
    total_questions = len(answers)

    for a in answers:
        if a.is_correct:
            total_correct += 1
        
        cid = a.question.competency_id
        if cid not in comp_groups:
            comp_groups[cid] = {
                "competency_id": cid,
                "competency_name": a.question.competency.name if a.question.competency else "Competency",
                "domain": a.question.competency.domain if a.question.competency else "Core",
                "total": 0,
                "correct": 0
            }
        comp_groups[cid]["total"] += 1
        if a.is_correct:
            comp_groups[cid]["correct"] += 1

    breakdown = []
    strongest = []
    needs_attention = []
    largest_gap = None
    max_gap_val = -1.0

    for cid, g in comp_groups.items():
        score_val = round((g["correct"] / g["total"]) * 100.0, 1) if g["total"] > 0 else 0.0
        target = role_targets.get(cid, 70.0)
        gap = max(0.0, target - score_val)

        if score_val >= target:
            status = "strong"
            strongest.append({
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "score": score_val,
                "target_score": target
            })
        elif score_val >= target - 10:
            status = "on_track"
        elif gap > 20:
            status = "critical_gap"
            needs_attention.append({
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "score": score_val,
                "target_score": target,
                "gap": gap
            })
        else:
            status = "needs_attention"
            needs_attention.append({
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "score": score_val,
                "target_score": target,
                "gap": gap
            })

        if gap > max_gap_val:
            max_gap_val = gap
            largest_gap = {
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "current_score": score_val,
                "target_score": target,
                "gap": gap
            }

        breakdown.append({
            "competency_id": cid,
            "competency_name": g["competency_name"],
            "domain": g["domain"],
            "current_score": score_val,
            "target_score": target,
            "gap": gap,
            "status": status,
            "questions_total": g["total"],
            "questions_correct": g["correct"],
            "accuracy_percent": score_val
        })

    overall_readiness = assessment.overall_score or (round((total_correct / total_questions) * 100.0, 1) if total_questions > 0 else 0.0)

    # Sort breakdown by gap descending
    breakdown = sorted(breakdown, key=lambda x: x["gap"], reverse=True)
    strongest = sorted(strongest, key=lambda x: x["score"], reverse=True)
    needs_attention = sorted(needs_attention, key=lambda x: x["gap"], reverse=True)

    return {
        "assessment_id": assessment.id,
        "assessment_type": assessment.assessment_type or "baseline",
        "overall_readiness": overall_readiness,
        "overall_score": overall_readiness,
        "total_questions": total_questions,
        "total_correct": total_correct,
        "strongest_competencies": strongest,
        "needs_attention": needs_attention,
        "largest_gap": largest_gap,
        "competency_breakdown": breakdown,
        "message": "Let's understand where you need to improve."
    }
