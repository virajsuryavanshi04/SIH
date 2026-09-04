from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from datetime import datetime
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
from models.user import User
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.user_competency import UserCompetency, CompetencyScore

def select_questions(
    db: Session, 
    user: User, 
    competency_ids: list = None, 
    difficulty: str = None, 
    question_count: int = None, 
    assessment_type: str = "baseline",
    question_type: str = None
):
    """
    Selects calibrated assessment questions sampled across required competencies for the user's role.
    Every question is mapped to competency, topic, difficulty, and question_type.
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

    # 2. Sample questions per competency
    target_total = question_count if question_count in (10, 15, 20) else (len(target_comp_ids) if len(target_comp_ids) <= 8 else 8)
    per_comp = max(1, target_total // len(target_comp_ids))
    selected_questions = []

    # Track seen question IDs for this user to prefer fresh questions
    seen_ids = set()
    if user:
        hist = db.query(UserQuestionHistory.question_id).filter(UserQuestionHistory.user_id == user.id).all()
        seen_ids = {h[0] for h in hist}

    norm_type = (question_type or "MIXED").upper()
    from sqlalchemy import or_

    for cid in target_comp_ids:
        query = db.query(Question).filter(
            Question.competency_id == cid,
            Question.status == 'approved'
        )
        if norm_type == "SHORT_MCQ":
            query = query.filter(or_(Question.question_type == "SHORT_MCQ", Question.question_type.is_(None)))
        elif norm_type in ["WORD_PROBLEM", "CASE_STUDY"]:
            query = query.filter(Question.question_type == norm_type)
        elif norm_type == "MIXED":
            query = query.filter(or_(Question.question_type.in_(["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY"]), Question.question_type.is_(None)))

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

    # If count is short due to rounding, supplement with unseen approved questions from pool
    if len(selected_questions) < target_total:
        chosen_ids = {q.id for q in selected_questions}
        supp_query = db.query(Question).filter(
            Question.competency_id.in_(target_comp_ids),
            Question.status == 'approved',
            Question.id.not_in(chosen_ids)
        )
        if norm_type == "SHORT_MCQ":
            supp_query = supp_query.filter(or_(Question.question_type == "SHORT_MCQ", Question.question_type.is_(None)))
        elif norm_type in ["WORD_PROBLEM", "CASE_STUDY"]:
            supp_query = supp_query.filter(Question.question_type == norm_type)
        elif norm_type == "MIXED":
            supp_query = supp_query.filter(or_(Question.question_type.in_(["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY"]), Question.question_type.is_(None)))
        
        remaining = supp_query.all()
        needed = target_total - len(selected_questions)
        if remaining:
            import random
            extra = random.sample(remaining, min(len(remaining), needed))
            for q in extra:
                q.competency_name = q.competency.name if q.competency else "Official Competency"
                q.topic_name = q.topic.name if q.topic else "General Concept"
                selected_questions.append(q)

    return selected_questions[:target_total]

def submit_user_answer(db: Session, assessment_id: int, user_id: int, req):
    """Records an assessment answer, checks correctness, and updates user question history."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if assessment and (assessment.assessment_type == "material_quiz" or assessment.source_material_id is not None):
        from models.material import MaterialQuizOption
        opt = db.query(MaterialQuizOption).filter(MaterialQuizOption.id == req.selected_option_id).first()
        is_correct = opt.is_correct if opt else False
        ans = AssessmentAnswer(
            assessment_id=assessment_id,
            material_quiz_question_id=req.question_id,
            selected_material_option_id=req.selected_option_id,
            confidence_level=req.confidence_level or 2,
            is_correct=is_correct,
            time_taken_seconds=req.time_taken_seconds or 15,
            response_time=req.time_taken_seconds or 15
        )
        db.add(ans)
        db.commit()
        return {"status": "success", "is_correct": is_correct}

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

    # 3. Compute competency scores & update user_competencies via unified CompetencyEngine
    from services.competency_engine import CompetencyEngine
    CompetencyEngine.update_competencies_from_assessment(db, assessment_id, user_id)

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
        
        q_obj = a.question if a.question else a.material_quiz_question
        cid = getattr(q_obj, 'competency_id', None)
        if cid is not None:
            if cid not in comp_groups:
                c_name = q_obj.competency.name if getattr(q_obj, 'competency', None) else "Competency"
                c_domain = q_obj.competency.domain if getattr(q_obj, 'competency', None) else "Core"
                comp_groups[cid] = {
                    "competency_id": cid,
                    "competency_name": c_name,
                    "domain": c_domain,
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
        accuracy_val = round((g["correct"] / g["total"]) * 100.0, 1) if g["total"] > 0 else 0.0
        target = role_targets.get(cid, 70.0)

        # Retrieve live UserCompetency state updated by CompetencyEngine
        uc = db.query(UserCompetency).filter(
            UserCompetency.user_id == (user_id or assessment.user_id),
            UserCompetency.competency_id == cid
        ).first()

        if uc and uc.current_score is not None:
            comp_score = uc.current_score
            comp_status = uc.status or "on_track"
            evidence_count = uc.evidence_count or g["total"]
            evidence_level = uc.evidence_level or ("LOW" if evidence_count <= 3 else "MEDIUM")
            conf = uc.confidence
            gap = round(max(0.0, target - comp_score), 1)
        else:
            comp_score = accuracy_val
            evidence_count = g["total"]
            evidence_level = "LOW" if evidence_count <= 3 else ("MEDIUM" if evidence_count <= 8 else "HIGH")
            conf = round(70.0 + ((g["confidence_sum"] / g["total"]) * 8.0), 1) if g["total"] > 0 else 70.0
            gap = round(max(0.0, target - comp_score), 1)
            if comp_score >= target:
                comp_status = "strong"
            elif comp_score >= target - 10:
                comp_status = "on_track"
            elif gap > 20:
                comp_status = "critical_gap"
            else:
                comp_status = "needs_attention"

        if comp_score >= target:
            strongest.append({
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "score": comp_score,
                "target_score": target
            })
        elif comp_score >= target - 10:
            pass
        elif gap > 20:
            needs_attention.append({
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "score": comp_score,
                "target_score": target,
                "gap": gap
            })
        else:
            needs_attention.append({
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "score": comp_score,
                "target_score": target,
                "gap": gap
            })

        if gap > max_gap_val:
            max_gap_val = gap
            largest_gap = {
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "current_score": comp_score,
                "target_score": target,
                "gap": gap
            }

        breakdown.append({
            "competency_id": cid,
            "competency_name": g["competency_name"],
            "domain": g["domain"],
            "current_score": comp_score,
            "target_score": target,
            "gap": gap,
            "status": comp_status,
            "questions_total": g["total"],
            "questions_correct": g["correct"],
            "accuracy_percent": accuracy_val,
            "estimated_competency": comp_score,
            "evidence_count": evidence_count,
            "evidence_level": evidence_level,
            "confidence": conf
        })

    total_incorrect = max(0, total_questions - total_correct)
    overall_readiness = assessment.overall_score if assessment.overall_score is not None else (round((total_correct / total_questions) * 100.0, 1) if total_questions > 0 else 0.0)

    # Sort breakdown by gap descending
    breakdown = sorted(breakdown, key=lambda x: x["gap"], reverse=True)
    strongest = sorted(strongest, key=lambda x: x["score"], reverse=True)
    needs_attention = sorted(needs_attention, key=lambda x: x["gap"], reverse=True)

    # 3. Question-by-Question Response Review & Dimension Aggregations
    responses = []
    q_type_groups = {}
    diff_groups = {}
    conf_summary = {
        "high_count": 0, "high_correct": 0,
        "medium_count": 0, "medium_correct": 0,
        "low_count": 0, "low_correct": 0
    }

    # Ensure answers are sorted in chronological order
    sorted_answers = sorted(answers, key=lambda x: (x.id or 0))

    for idx, a in enumerate(sorted_answers, 1):
        q = a.question if a.question else a.material_quiz_question
        if not q:
            continue

        raw_type = (q.question_type or "SHORT_MCQ").upper()
        type_display = {
            "SHORT_MCQ": "Short MCQ",
            "WORD_PROBLEM": "Word Problem",
            "CASE_STUDY": "Case Study"
        }.get(raw_type, "Short MCQ")

        # Question Type aggregation
        if type_display not in q_type_groups:
            q_type_groups[type_display] = {"total": 0, "correct": 0}
        q_type_groups[type_display]["total"] += 1
        if a.is_correct:
            q_type_groups[type_display]["correct"] += 1

        # Difficulty aggregation
        raw_diff = str(q.difficulty or "2").lower()
        diff_display = {
            "1": "Easy", "beginner": "Easy", "easy": "Easy",
            "2": "Medium", "intermediate": "Medium", "medium": "Medium",
            "3": "Hard", "advanced": "Hard", "hard": "Hard"
        }.get(raw_diff, "Medium")

        if diff_display not in diff_groups:
            diff_groups[diff_display] = {"total": 0, "correct": 0}
        diff_groups[diff_display]["total"] += 1
        if a.is_correct:
            diff_groups[diff_display]["correct"] += 1

        # Confidence aggregation
        c_level = a.confidence_level or 2
        if c_level == 3:
            conf_summary["high_count"] += 1
            if a.is_correct:
                conf_summary["high_correct"] += 1
        elif c_level == 1:
            conf_summary["low_count"] += 1
            if a.is_correct:
                conf_summary["low_correct"] += 1
        else:
            conf_summary["medium_count"] += 1
            if a.is_correct:
                conf_summary["medium_correct"] += 1

        # Options formatting
        opts = []
        correct_opt = None
        for opt in sorted(q.options, key=lambda x: x.order):
            is_c = bool(opt.is_correct)
            if is_c:
                correct_opt = opt
            opts.append({
                "id": opt.id,
                "text": opt.text,
                "order": opt.order,
                "is_correct": is_c
            })

        selected_opt = a.selected_option if a.selected_option else a.selected_material_option
        learner_text = selected_opt.text if selected_opt else (a.selected_answer or None)
        learner_opt_id = selected_opt.id if selected_opt else (a.selected_option_id or a.selected_material_option_id)
        correct_text = correct_opt.text if correct_opt else None

        if hasattr(q, 'competency') and q.competency:
            c_name = q.competency.name
        elif hasattr(q, 'material') and q.material:
            c_name = q.material.title
        else:
            c_name = "Material Study" if getattr(q, 'material_id', None) else "Official Competency"

        t_name = q.topic.name if (hasattr(q, 'topic') and q.topic) else None
        c_id = getattr(q, 'competency_id', None)
        t_id = getattr(q, 'topic_id', None)

        responses.append({
            "question_id": q.id,
            "question_number": idx,
            "question_type": raw_type,
            "question_text": q.question_text or getattr(q, 'text', ''),
            "difficulty": str(q.difficulty or "2"),
            "competency_id": c_id,
            "competency_name": c_name,
            "topic_id": t_id,
            "topic_name": t_name,
            "options": opts,
            "learner_selected_option_id": learner_opt_id,
            "learner_selected_text": learner_text,
            "correct_option_id": correct_opt.id if correct_opt else None,
            "correct_option_text": correct_text,
            "is_correct": bool(a.is_correct),
            "confidence_level": a.confidence_level or 2,
            "time_taken_seconds": a.time_taken_seconds or a.response_time or 15,
            "explanation": q.explanation or "Official evaluation rationale recorded."
        })

    # Question-type performance list
    q_type_perf = []
    for name, data in q_type_groups.items():
        acc = round((data["correct"] / data["total"]) * 100.0, 1) if data["total"] > 0 else 0.0
        q_type_perf.append({
            "name": name,
            "total": data["total"],
            "correct": data["correct"],
            "accuracy_percent": acc
        })

    # Difficulty performance list in canonical order: Easy -> Medium -> Hard
    diff_perf = []
    for diff_name in ["Easy", "Medium", "Hard"]:
        if diff_name in diff_groups:
            data = diff_groups[diff_name]
            acc = round((data["correct"] / data["total"]) * 100.0, 1) if data["total"] > 0 else 0.0
            diff_perf.append({
                "name": diff_name,
                "total": data["total"],
                "correct": data["correct"],
                "accuracy_percent": acc
            })

    # Configuration summary
    state = assessment.adaptive_state or {}
    config_q_type = state.get("question_type", "MIXED")
    config_q_type_display = {
        "SHORT_MCQ": "Short MCQ",
        "WORD_PROBLEM": "Word Problem",
        "CASE_STUDY": "Case Study",
        "MIXED": "Mixed"
    }.get(config_q_type, "Mixed")

    if len(comp_groups) == 1:
        single_comp_name = list(comp_groups.values())[0]["competency_name"]
        comp_summary = single_comp_name
    elif len(comp_groups) > 1:
        comp_summary = f"{len(comp_groups)} Role Competencies"
    else:
        comp_summary = "Role Framework Diagnostic"

    config_summary = {
        "competency_summary": comp_summary,
        "question_type": config_q_type_display,
        "question_count": state.get("target_question_count", total_questions),
        "difficulty_mode": "Adaptive Difficulty Engine" if (assessment.assessment_type == "adaptive" or state.get("target_question_count")) else "Standard"
    }

    # Weak areas / areas to review (strictly from actual scores < 70%)
    weak_areas = []
    for item in breakdown:
        if item["accuracy_percent"] < 70.0:
            weak_areas.append(f"{item['competency_name']} ({item['accuracy_percent']}%)")
    for q_item in q_type_perf:
        if q_item["accuracy_percent"] < 70.0 and len(q_type_perf) > 1:
            weak_areas.append(f"{q_item['name']} questions ({q_item['accuracy_percent']}%)")

    adaptive_summary = (
        "Difficulty was dynamically adjusted during the assessment based on your response accuracy."
        if (assessment.assessment_type == "adaptive" or state.get("target_question_count"))
        else None
    )

    # 4. Reassessment Summary (for targeted reassessments or single competency assessments)
    reassessment_summary = None
    if comp_groups and (assessment.assessment_type == "adaptive_reassessment" or len(comp_groups) == 1):
        main_cid = list(comp_groups.keys())[0]
        main_g = comp_groups[main_cid]
        curr_score = round((main_g["correct"] / main_g["total"]) * 100.0, 1) if main_g["total"] > 0 else 0.0
        t_score = role_targets.get(main_cid, 70.0)

        # Retrieve prior CompetencyScore strictly preceding this assessment
        from sqlalchemy import or_
        prior_query = db.query(CompetencyScore).filter(
            CompetencyScore.user_id == (user_id or assessment.user_id),
            CompetencyScore.competency_id == main_cid,
            or_(CompetencyScore.assessment_id.is_(None), CompetencyScore.assessment_id != assessment.id)
        )
        if assessment.started_at:
            prior_query = prior_query.filter(CompetencyScore.assessed_at <= assessment.started_at)
        elif assessment.completed_at:
            prior_query = prior_query.filter(CompetencyScore.assessed_at < assessment.completed_at)

        prior_score_rec = prior_query.order_by(CompetencyScore.assessed_at.desc()).first()

        prev_score = prior_score_rec.score if prior_score_rec else None
        s_delta = round(curr_score - prev_score, 1) if prev_score is not None else 0.0
        prev_gap = max(0.0, t_score - prev_score) if prev_score is not None else None
        curr_gap = max(0.0, t_score - curr_score)

        if prev_score is None:
            r_status = "INITIAL_MEASUREMENT"
        elif curr_score >= t_score:
            r_status = "MET_BENCHMARK"
        elif curr_score > prev_score:
            r_status = "IMPROVED_ON_TRACK"
        else:
            r_status = "NEEDS_ADDITIONAL_PRACTICE"

        reassessment_summary = {
            "competency_id": main_cid,
            "competency_name": main_g["competency_name"],
            "previous_score": prev_score,
            "current_score": curr_score,
            "target_score": t_score,
            "score_delta": s_delta,
            "previous_gap": prev_gap,
            "current_gap": curr_gap,
            "status": r_status
        }

    return {
        "assessment_id": assessment.id,
        "assessment_type": assessment.assessment_type or "baseline",
        "source_material_id": assessment.source_material_id,
        "source_material_title": assessment.source_material.title if assessment.source_material else None,
        "material_scope": assessment.source_material.material_scope if assessment.source_material else None,
        "is_official": bool(assessment.assessment_type != "material_quiz" or (assessment.source_material and assessment.source_material.material_scope == "OFFICIAL_COMPETENCY")),
        "overall_readiness": overall_readiness,
        "overall_score": overall_readiness,
        "total_questions": total_questions,
        "total_correct": total_correct,
        "total_incorrect": total_incorrect,
        "configuration": config_summary,
        "strongest_competencies": strongest,
        "needs_attention": needs_attention,
        "largest_gap": largest_gap,
        "competency_breakdown": breakdown,
        "question_type_performance": q_type_perf,
        "difficulty_performance": diff_perf,
        "confidence_performance": conf_summary,
        "weak_areas": weak_areas,
        "adaptive_summary": adaptive_summary,
        "reassessment_summary": reassessment_summary,
        "responses": responses,
        "message": "Assessment diagnostic results recorded."
    }
