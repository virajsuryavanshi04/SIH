from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.competency import Competency, RoleCompetency
from models.assessment import Assessment, AssessmentAnswer, QuestionOption, Question
from schemas.assessment import (
    StartAssessmentRequest, 
    SubmitAnswerRequest, 
    AdaptiveStepRequest,
    AdaptiveStepResponse,
    AssessmentStartResponse, 
    AssessmentResultResponse,
    QuestionResponse,
    OptionResponse
)
from services.assessment_service import (
    select_questions, 
    submit_user_answer, 
    score_assessment, 
    get_assessment_result
)
from services.adaptive_assessment_service import AdaptiveAssessmentService

router = APIRouter(prefix="/api/assessments", tags=["assessments"])

@router.post("/start", response_model=AssessmentStartResponse)
def start_assessment(
    req: StartAssessmentRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Starts an official assessment session with configurable question count, question type,
    and adaptive difficulty. Validates eligible approved question pool before creation.
    """
    ass_type = req.assessment_type or "adaptive"
    
    # 1. Determine if this is a baseline assessment
    is_baseline = (ass_type == "baseline")

    # 2. Validate Question Type
    raw_type = (req.question_type or "MIXED").strip().upper()
    valid_types = ["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY", "MIXED"]
    if raw_type not in valid_types:
        raise HTTPException(
            status_code=422,
            detail="Invalid question type. Supported question types are Short MCQ, Word Problem, Case Study, or Mixed."
        )
    q_type = raw_type

    # 3. Resolve & Validate Competencies & Target Question Count
    if is_baseline:
        # AUTHORITATIVE SOURCE: Strict Role-Competency Coverage
        # The baseline assessment MUST be generated strictly from ALL competencies assigned to the authenticated learner's role.
        # Learner-supplied competency_id / competency_ids are completely ignored.
        role_reqs = []
        if current_user.role_id:
            role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == current_user.role_id).all()
        if not role_reqs and current_user.designation:
            role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == current_user.designation).all()
        if not role_reqs and current_user.role_id:
            from models.role import Role
            role_obj = db.query(Role).filter(Role.id == current_user.role_id).first()
            if role_obj:
                role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == role_obj.name).all()

        target_comp_ids = [r.competency_id for r in role_reqs]
        if not target_comp_ids:
            raise HTTPException(
                status_code=400,
                detail="No required competencies are mapped to your selected cadre. Please complete onboarding with an official cadre."
            )
        # Strict Baseline Formula:
        # minimum_required = M * 2
        # total_questions = max(15, minimum_required) subject to total_questions <= 20
        # Returns controlled configuration error if M * 2 > 20
        m_count = len(target_comp_ids)
        if m_count * 2 > 20:
            raise HTTPException(
                status_code=422,
                detail=f"Selected cadre requires {m_count} competencies which needs at least {m_count * 2} questions to satisfy minimum 2-per-competency coverage, exceeding the maximum allowed baseline total of 20 questions."
            )
        target_count = max(15, m_count * 2)
    else:
        # Validate Question Count for non-baseline assessments
        raw_count = req.question_count if req.question_count is not None else 10
        if raw_count not in [10, 15, 16, 20]:
            raise HTTPException(
                status_code=422,
                detail="Invalid question count. Supported question counts are 10, 15, or 20."
            )
        target_count = int(raw_count)

        target_comp_ids = []
        if req.competency_id:
            target_comp_ids = [req.competency_id]
        elif req.competency_ids:
            target_comp_ids = req.competency_ids
        elif current_user and current_user.role_id:
            role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == current_user.role_id).all()
            target_comp_ids = [r.competency_id for r in role_reqs]
        elif current_user and current_user.designation:
            role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == current_user.designation).all()
            target_comp_ids = [r.competency_id for r in role_reqs]

        if not target_comp_ids:
            target_comp_ids = [c.id for c in db.query(Competency).filter(Competency.is_official == True).all()]

        if not target_comp_ids:
            target_comp_ids = [1, 2, 3, 4, 5, 6, 7, 8]

    # Verify competencies exist
    existing_comps = db.query(Competency).filter(Competency.id.in_(target_comp_ids)).all()
    if len(existing_comps) != len(set(target_comp_ids)):
        raise HTTPException(status_code=422, detail="One or more specified competencies do not exist.")

    # 5. Check Approved Pool Sufficiency BEFORE Creating Assessment Record
    # For baseline assessment, every single required competency must have sufficient approved questions (at least 2)
    if is_baseline:
        required_quota_per_comp = max(2, target_count // m_count)
        for cid in target_comp_ids:
            comp_q_count = db.query(Question).filter(
                Question.status == "approved",
                Question.competency_id == cid
            ).count()
            if comp_q_count < required_quota_per_comp:
                comp_obj = db.query(Competency).filter(Competency.id == cid).first()
                c_name = comp_obj.name if comp_obj else f"Competency {cid}"
                raise HTTPException(
                    status_code=422,
                    detail=f"Required competency '{c_name}' does not have sufficient approved questions. Assessment cannot proceed without complete role coverage."
                )

    from sqlalchemy import or_
    pool_query = db.query(Question).filter(
        Question.status == "approved",
        Question.competency_id.in_(target_comp_ids)
    )
    if q_type == "SHORT_MCQ":
        pool_query = pool_query.filter(or_(Question.question_type == "SHORT_MCQ", Question.question_type.is_(None)))
    elif q_type in ["WORD_PROBLEM", "CASE_STUDY"]:
        pool_query = pool_query.filter(Question.question_type == q_type)
    elif q_type == "MIXED":
        pool_query = pool_query.filter(or_(Question.question_type.in_(["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY"]), Question.question_type.is_(None)))

    available_count = pool_query.count()
    if available_count < target_count:
        type_display = {
            "SHORT_MCQ": "Short MCQ",
            "WORD_PROBLEM": "Word Problem",
            "CASE_STUDY": "Case Study",
            "MIXED": "Mixed"
        }.get(q_type, q_type)
        
        if len(target_comp_ids) == 1:
            comp_obj = db.query(Competency).filter(Competency.id == target_comp_ids[0]).first()
            comp_display = comp_obj.name if comp_obj else "the selected competency"
        else:
            comp_display = "the selected competencies"

        raise HTTPException(
            status_code=422,
            detail=f"Only {available_count} approved {type_display} questions are currently available for {comp_display}. Please choose a smaller assessment or another question type."
        )

    # 5. Initialize Adaptive State
    adaptive_state = AdaptiveAssessmentService.initialize_adaptive_state(
        db=db,
        user=current_user,
        competency_ids=target_comp_ids,
        target_question_count=target_count,
        question_type=q_type
    )

    # 6. Create Assessment Record
    assessment = Assessment(
        user_id=current_user.id, 
        assessment_type=ass_type,
        type=ass_type,
        status="in_progress",
        adaptive_state=adaptive_state
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment.id).delete()
    db.commit()
    
    # 7. Select Initial Question(s)
    q_list = []
    comp_names = set()

    if ass_type in ["adaptive", "baseline", "adaptive_reassessment"]:
        first_cid = adaptive_state["current_competency_id"]
        first_tid = adaptive_state["current_topic_id"]
        first_diff = adaptive_state["current_difficulty"]

        first_q, _ = AdaptiveAssessmentService.select_adaptive_question(
            db=db,
            user_id=current_user.id,
            competency_id=first_cid,
            topic_id=first_tid,
            difficulty=first_diff,
            excluded_ids=[],
            question_type=q_type
        )
        if first_q:
            adaptive_state["pending_question_id"] = first_q.id
            assessment.adaptive_state = adaptive_state
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(assessment, "adaptive_state")
            db.commit()

            c_name = first_q.competency.name if first_q.competency else "Official Competency"
            comp_names.add(c_name)
            t_name = first_q.topic.name if first_q.topic else "General Concept"
            opts = [OptionResponse(id=o.id, text=o.text, order=o.order) for o in sorted(first_q.options, key=lambda x: x.order)]
            q_list.append(QuestionResponse(
                id=first_q.id,
                text=first_q.question_text or first_q.text,
                question_text=first_q.question_text or first_q.text,
                question_type=first_q.question_type or "SHORT_MCQ",
                difficulty=str(first_q.difficulty),
                competency_id=first_q.competency_id,
                competency_name=c_name,
                topic_id=first_q.topic_id,
                topic_name=t_name,
                cognitive_level=first_q.cognitive_level or "understand",
                options=opts
            ))
    else:
        questions = select_questions(
            db, 
            user=current_user, 
            competency_ids=target_comp_ids, 
            difficulty=req.difficulty, 
            question_count=target_count,
            assessment_type=ass_type,
            question_type=q_type
        )
        for q in questions:
            c_name = getattr(q, 'competency_name', q.competency.name if q.competency else "Competency")
            comp_names.add(c_name)
            t_name = getattr(q, 'topic_name', q.topic.name if q.topic else None)
            opts = [OptionResponse(id=o.id, text=o.text, order=o.order) for o in sorted(q.options, key=lambda x: x.order)]
            q_list.append(QuestionResponse(
                id=q.id,
                text=q.question_text or q.text,
                question_text=q.question_text or q.text,
                question_type=q.question_type or "SHORT_MCQ",
                difficulty=str(q.difficulty),
                competency_id=q.competency_id,
                competency_name=c_name,
                topic_id=q.topic_id,
                topic_name=t_name,
                cognitive_level=q.cognitive_level or "understand",
                options=opts
            ))
        
    all_covered_names = [c.name for c in existing_comps] if existing_comps else list(comp_names)
    return AssessmentStartResponse(
        assessment_id=assessment.id,
        assessment_type=ass_type,
        total_questions=target_count,
        competencies_covered=all_covered_names,
        questions=q_list
    )

@router.post("/{id}/adaptive-next", response_model=AdaptiveStepResponse)
def adaptive_next_step(
    id: int,
    req: AdaptiveStepRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits an answer and returns the next dynamically adapted question based on streak,
    difficulty adjustments, and weak subtopic detection within the configured question type pool.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    step_result = AdaptiveAssessmentService.process_adaptive_step(
        db=db,
        assessment_id=id,
        user_id=current_user.id,
        question_id=req.question_id,
        selected_option_id=req.selected_option_id,
        confidence_level=req.confidence_level or 2,
        time_taken_seconds=req.time_taken_seconds or 15
    )

    if step_result.get("is_completed"):
        return AdaptiveStepResponse(
            is_completed=True,
            result=step_result.get("result"),
            message="Adaptive assessment completed successfully"
        )

    if step_result.get("question_generation_required"):
        return AdaptiveStepResponse(
            is_completed=False,
            question_generation_required=True,
            message="question_generation_required"
        )

    nq = step_result["next_question"]
    opts = [OptionResponse(id=o["id"], text=o["text"], order=o["order"]) for o in nq["options"]]
    
    question_res = QuestionResponse(
        id=nq["id"],
        text=nq["text"],
        question_text=nq["text"],
        question_type=nq.get("question_type", "SHORT_MCQ"),
        difficulty=nq.get("difficulty", "2"),
        competency_id=nq.get("competency_id"),
        competency_name=nq.get("competency_name"),
        topic_id=nq.get("topic_id"),
        topic_name=nq.get("topic_name"),
        cognitive_level=nq.get("cognitive_level", "understand"),
        options=opts
    )

    return AdaptiveStepResponse(
        is_completed=False,
        step=step_result.get("step"),
        total_steps=step_result.get("total_steps"),
        next_question=question_res
    )

@router.get("/{id}")
def get_assessment(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch assessment session metadata."""
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")
    return assessment

@router.get("/{id}/resume")
def resume_assessment(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Reconstructs the exact existing assessment session without creating duplicate records
    or altering completed history.
    """
    try:
        return AdaptiveAssessmentService.get_resumable_assessment_session(db, id, current_user.id)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied to this assessment session")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{id}/answer")
@router.post("/{id}/submit-answer")
def submit_answer(
    id: int, 
    req: SubmitAnswerRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Submits answer for a question with confidence level and response time telemetry."""
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")
        
    return submit_user_answer(db, id, current_user.id, req)

@router.post("/{id}/complete", response_model=AssessmentResultResponse)
def complete_assessment(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Submits and scores assessment using deterministic logic.
    Updates user_competencies, saves immutable competency_history, and returns diagnostic results.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")
        
    return score_assessment(db, id, current_user.id)

@router.get("/{id}/result", response_model=AssessmentResultResponse)
def get_result(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch structured diagnostic results and response review for an assessment session."""
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")
        
    if assessment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own assessment results.")

    if assessment.status != "completed":
        raise HTTPException(status_code=400, detail="Assessment results are available only after assessment completion.")

    return get_assessment_result(db, id, assessment.user_id)

@router.get("/history/list")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch user's historical assessment log."""
    return db.query(Assessment).filter(
        Assessment.user_id == current_user.id
    ).order_by(Assessment.started_at.desc()).all()
