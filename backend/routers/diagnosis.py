import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from models.assessment import Assessment, AssessmentAnswer, Question, QuestionOption
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.user_competency import CompetencyScore, UserCompetency
from models.recommendation import AIDiagnosis
from models.material import (
    LearningMaterial, 
    MaterialNote, 
    MaterialFlashcardDeck, 
    MaterialMindMap, 
    MaterialQuizQuestionSet
)
from models.course import Course
from services.competency_service import get_user_ranked_gaps, get_user_detailed_competencies
from services.recommendation_service import RecommendationService
from services.external_learning_service import ExternalLearningResourceService
from ai.service import AIService
from schemas.diagnosis import (
    AssessmentDiagnosisResponse,
    MisconceptionItem,
    RemediationActionItem,
    ExternalLearningResourceItem,
    CompetencyRemediationResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])

@router.get("/assessment/{assessment_id}", response_model=AssessmentDiagnosisResponse)
def get_assessment_diagnosis(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns cognitive diagnosis of an assessment session grounded in item-level telemetry.
    Strictly restricted to the authenticated assessment owner.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Ownership Check
    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this assessment")

    # Completed-assessment requirement (no active answer leakage)
    if assessment.status != "completed":
        raise HTTPException(status_code=400, detail="Diagnosis is only available after assessment completion")

    # Determine primary competency and official vs unofficial material scope
    primary_cid = None
    comp_name = "Statistical Officer Framework"
    mat_scope = None
    is_official = True
    source_mat = None

    if assessment.assessment_type == "material_quiz" or assessment.source_material_id is not None:
        source_mat = assessment.source_material or (
            db.query(LearningMaterial).filter(LearningMaterial.id == assessment.source_material_id).first()
            if assessment.source_material_id else None
        )
        if source_mat:
            mat_scope = source_mat.material_scope or ("OFFICIAL_COMPETENCY" if source_mat.competency_id else "OTHER_LEARNING")
            if mat_scope == "OFFICIAL_COMPETENCY":
                is_official = True
                if source_mat.competency:
                    primary_cid = source_mat.competency_id
                    comp_name = source_mat.competency.name
                else:
                    comp_name = source_mat.title
            else:
                is_official = False
                primary_cid = None
                comp_name = source_mat.title
        else:
            is_official = False
            comp_name = "Practice Material"

    # Fetch all answers with related question & options in batch
    answers = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.assessment_id == assessment_id
    ).all()

    # Determine competency from questions if official and not yet resolved
    if is_official and not primary_cid:
        for ans in answers:
            if ans.question and ans.question.competency_id:
                primary_cid = ans.question.competency_id
                if ans.question.competency:
                    comp_name = ans.question.competency.name
                break

    # 1. Check for Cached AIDiagnosis
    cached = db.query(AIDiagnosis).filter(
        AIDiagnosis.assessment_id == assessment_id,
        AIDiagnosis.user_id == current_user.id
    ).first()

    if cached and cached.explanation:
        try:
            cached_data = json.loads(cached.explanation)
            if isinstance(cached_data, dict) and "primary_bottleneck" in cached_data:
                # Reconstruct response with cached AI interpretation
                misconceptions = [
                    MisconceptionItem(**m) for m in cached_data.get("misconceptions", [])
                ]
                
                # Build recommended actions dynamically
                if is_official:
                    rec_actions = _build_remediation_actions(db, current_user, primary_cid, comp_name)
                    ext_resources = []
                    b_topic = cached.primary_gap or cached_data.get("primary_bottleneck", "Competency Gap")
                    b_reason = cached.root_cause or cached_data.get("remediation_focus", "Review recommended curriculum modules.")
                else:
                    rec_actions = []
                    bottleneck_res = ExternalLearningResourceService.generate_bottleneck_recommendations(
                        source_mat, 
                        answers, 
                        ai_primary_bottleneck=cached.primary_gap
                    ) if source_mat else {"primary_bottleneck_topic": "General Practice", "primary_bottleneck_reason": "Review practice material.", "resources": []}
                    ext_resources = bottleneck_res["resources"]
                    b_topic = bottleneck_res["primary_bottleneck_topic"]
                    b_reason = bottleneck_res["primary_bottleneck_reason"]

                return AssessmentDiagnosisResponse(
                    assessment_id=assessment_id,
                    competency_id=primary_cid,
                    competency_name=comp_name,
                    overall_score=assessment.overall_score or 0.0,
                    primary_bottleneck=b_topic,
                    primary_bottleneck_topic=b_topic,
                    primary_bottleneck_reason=b_reason,
                    diagnostic_confidence=cached_data.get("diagnostic_confidence", "MEDIUM"),
                    evidence_summary=cached_data.get("evidence_summary", "Diagnostic evidence retrieved from completed evaluation."),
                    misconceptions=misconceptions,
                    remediation_focus=b_reason,
                    recommended_actions=rec_actions,
                    is_official=is_official,
                    material_scope=mat_scope,
                    external_learning_resources=ext_resources,
                    is_cached=True
                )
        except Exception:
            pass

    # 2. Extract Deterministic Diagnostic Evidence from Answers
    total_q = len(answers)
    incorrect_answers = [a for a in answers if a.is_correct is False]
    incorrect_count = len(incorrect_answers)
    overall_sc = assessment.overall_score if assessment.overall_score is not None else (
        round(((total_q - incorrect_count) / total_q) * 100.0, 1) if total_q > 0 else 0.0
    )

    # If 100% score or 0 errors -> Mastery Verified (No fabricated misconception)
    if incorrect_count == 0:
        if not cached:
            diag_obj = {
                "primary_bottleneck": "No Critical Bottlenecks Detected",
                "diagnostic_confidence": "HIGH",
                "evidence_summary": f"Mastery demonstrated across all {total_q} evaluated questions. No cognitive misconceptions or knowledge gaps observed.",
                "misconceptions": [],
                "remediation_focus": "Proficiency verified at benchmark level. Continue standard operational workflow."
            }
            cached = AIDiagnosis(
                user_id=current_user.id,
                assessment_id=assessment_id,
                competency_id=primary_cid,
                primary_gap="No Critical Bottlenecks Detected",
                root_cause="Proficiency verified at benchmark level.",
                explanation=json.dumps(diag_obj),
                confidence=95.0
            )
            db.add(cached)
            db.commit()

        if is_official:
            rec_actions = [
                RemediationActionItem(
                    action_type="REASSESSMENT",
                    title="Maintain Role Benchmark",
                    reason="All evaluated items answered correctly. Retain proficiency with periodic evaluations.",
                    route="/assessment",
                    resource_type="assessment"
                )
            ]
            ext_resources = []
            b_topic = "No Critical Bottlenecks Detected"
            b_reason = "Proficiency verified at benchmark level. Continue standard operational workflow."
        else:
            rec_actions = []
            bottleneck_res = ExternalLearningResourceService.generate_bottleneck_recommendations(source_mat, answers) if source_mat else {"primary_bottleneck_topic": "No Critical Bottlenecks Detected", "primary_bottleneck_reason": f"Mastery demonstrated across all evaluated items in {comp_name}.", "resources": []}
            ext_resources = bottleneck_res["resources"]
            b_topic = bottleneck_res["primary_bottleneck_topic"]
            b_reason = bottleneck_res["primary_bottleneck_reason"]

        return AssessmentDiagnosisResponse(
            assessment_id=assessment_id,
            competency_id=primary_cid,
            competency_name=comp_name,
            overall_score=overall_sc,
            primary_bottleneck=b_topic,
            primary_bottleneck_topic=b_topic,
            primary_bottleneck_reason=b_reason,
            diagnostic_confidence="HIGH",
            evidence_summary=f"Mastery demonstrated across all {total_q} evaluated questions. No cognitive misconceptions or knowledge gaps observed.",
            misconceptions=[],
            remediation_focus=b_reason,
            recommended_actions=rec_actions,
            is_official=is_official,
            material_scope=mat_scope,
            external_learning_resources=ext_resources,
            is_cached=False
        )

    # Group errors and analyze high-confidence errors vs low-confidence gaps
    topic_error_counts: Dict[str, int] = {}
    high_conf_errors = 0
    error_items = []

    for ans in incorrect_answers:
        q = ans.question or ans.material_quiz_question
        top_name = None
        if hasattr(q, "concept") and q.concept:
            top_name = q.concept
        elif hasattr(q, "topic") and q.topic:
            top_name = q.topic.name
        elif hasattr(q, "material") and q.material:
            top_name = q.material.title
        top_name = top_name or comp_name or "General Topic"
        topic_error_counts[top_name] = topic_error_counts.get(top_name, 0) + 1

        c_lvl = ans.confidence_level or 3
        if c_lvl >= 4:
            high_conf_errors += 1

        # Extract selected and correct option texts safely
        sel_text = ans.selected_answer or (
            ans.selected_option.text if getattr(ans, "selected_option", None)
            else (ans.selected_material_option.text if getattr(ans, "selected_material_option", None) else "Selected incorrect option")
        )
        corr_text = "Standard correct formula/definition"
        if q:
            if hasattr(q, "correct_answer") and q.correct_answer:
                corr_text = q.correct_answer
            elif hasattr(q, "options") and q.options:
                c_opt = next((o for o in q.options if getattr(o, "is_correct", False)), None)
                if c_opt:
                    corr_text = c_opt.text

        error_items.append({
            "question_text": getattr(q, "question_text", None) or getattr(q, "text", None) or f"Question #{ans.id}",
            "selected_answer": sel_text,
            "correct_answer": corr_text,
            "topic": top_name,
            "concept": getattr(q, "concept", None),
            "confidence": c_lvl,
            "difficulty": int(q.difficulty) if q and str(getattr(q, "difficulty", "2")).isdigit() else 2
        })

    evidence_data = {
        "role": current_user.designation or "Statistical Officer",
        "competency_name": comp_name,
        "overall_score": overall_sc,
        "target_score": 70.0,
        "total_questions": total_q,
        "incorrect_count": incorrect_count,
        "high_confidence_errors": high_conf_errors,
        "topic_error_counts": topic_error_counts,
        "errors": error_items
    }

    # 3. AI Diagnostic Interpretation
    ai = AIService()
    diag_res = ai.diagnose_assessment_evidence(evidence_data)

    # Validate output schema
    misconceptions = []
    for m in diag_res.get("misconceptions", []):
        try:
            misconceptions.append(MisconceptionItem(
                topic=m.get("topic", "General Topic"),
                pattern=m.get("pattern", "Observed error pattern"),
                classification=m.get("classification", "OBSERVED_PATTERN"),
                evidence_count=int(m.get("evidence_count", 1)),
                explanation=m.get("explanation", "Review recommended."),
                high_confidence_error=bool(m.get("high_confidence_error", False))
            ))
        except Exception:
            continue

    primary_bottleneck = diag_res.get("primary_bottleneck", "Competency Deficit")
    diag_confidence = diag_res.get("diagnostic_confidence", "MEDIUM")
    evidence_summary = diag_res.get("evidence_summary", f"Observed {incorrect_count} errors across {len(topic_error_counts)} topics.")
    remediation_focus = diag_res.get("remediation_focus", f"Review core principles of {comp_name}.")

    # 4. Cache Diagnosis in AIDiagnosis
    if not cached:
        cached = AIDiagnosis(
            user_id=current_user.id,
            assessment_id=assessment_id,
            competency_id=primary_cid,
            primary_gap=primary_bottleneck,
            root_cause=remediation_focus,
            explanation=json.dumps(diag_res),
            confidence=90.0 if diag_confidence == "HIGH" else 75.0 if diag_confidence == "MEDIUM" else 60.0
        )
        db.add(cached)
    else:
        cached.primary_gap = primary_bottleneck
        cached.root_cause = remediation_focus
        cached.explanation = json.dumps(diag_res)
        cached.confidence = 90.0 if diag_confidence == "HIGH" else 75.0 if diag_confidence == "MEDIUM" else 60.0
    
    db.commit()

    # 5. Build dynamic recommended actions vs external learning resources
    if is_official:
        rec_actions = _build_remediation_actions(db, current_user, primary_cid, comp_name)
        ext_resources = []
        b_topic = primary_bottleneck
        b_reason = remediation_focus
    else:
        rec_actions = []
        bottleneck_res = ExternalLearningResourceService.generate_bottleneck_recommendations(
            source_mat, 
            answers, 
            ai_primary_bottleneck=primary_bottleneck
        ) if source_mat else {"primary_bottleneck_topic": primary_bottleneck, "primary_bottleneck_reason": f"Targeted external learning resources for {comp_name}.", "resources": []}
        ext_resources = bottleneck_res["resources"]
        b_topic = bottleneck_res["primary_bottleneck_topic"]
        b_reason = bottleneck_res["primary_bottleneck_reason"]

    return AssessmentDiagnosisResponse(
        assessment_id=assessment_id,
        competency_id=primary_cid,
        competency_name=comp_name,
        overall_score=overall_sc,
        primary_bottleneck=b_topic,
        primary_bottleneck_topic=b_topic,
        primary_bottleneck_reason=b_reason,
        diagnostic_confidence=diag_confidence,
        evidence_summary=evidence_summary,
        misconceptions=misconceptions,
        remediation_focus=b_reason if not is_official else remediation_focus,
        recommended_actions=rec_actions,
        is_official=is_official,
        material_scope=mat_scope,
        external_learning_resources=ext_resources,
        is_cached=False
    )

@router.get("/remediation/{competency_id}", response_model=CompetencyRemediationResponse)
def get_competency_remediation(
    competency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns targeted, multi-modal remediation guide connecting diagnosed gaps to
    accredited iGOT courses, learner-owned materials, notes, flashcards, and quizzes.
    """
    comp = db.query(Competency).filter(Competency.id == competency_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competency not found")

    # Get user's current score on this competency
    uc = db.query(UserCompetency).filter(
        UserCompetency.user_id == current_user.id,
        UserCompetency.competency_id == competency_id
    ).first()

    current_score = uc.current_score if uc else None
    target_score = uc.target_score if uc else 70.0
    gap = round(max(0.0, target_score - (current_score or 0.0)), 1)
    status = uc.status if uc else "unassessed"

    # Resolve latest diagnosis for this competency
    diag = db.query(AIDiagnosis).filter(
        AIDiagnosis.user_id == current_user.id,
        AIDiagnosis.competency_id == competency_id
    ).order_by(AIDiagnosis.created_at.desc()).first()

    diag_summary = diag.explanation if diag and not diag.explanation.startswith("{") else (
        diag.primary_gap if diag else f"Deficit gap of -{gap}% identified against required role benchmark."
    )
    rem_focus = diag.root_cause if diag else f"Study accredited curriculum modules on {comp.name}."

    # Identify weak subtopics from detailed competency service
    detailed = get_user_detailed_competencies(db, current_user)
    comp_detail = next((d for d in detailed if d["competency_id"] == competency_id), None)
    weak_subtopics = []
    if comp_detail and comp_detail.get("weakest_subtopic"):
        weak_subtopics.append(comp_detail["weakest_subtopic"])
    elif comp_detail and comp_detail.get("subtopics"):
        weak_subtopics = [
            st["topic_name"] for st in comp_detail["subtopics"]
            if st.get("score") is not None and st["score"] < target_score
        ]

    # Query strictly learner-owned materials (Tenant Isolation)
    materials = db.query(LearningMaterial).filter(
        LearningMaterial.uploaded_by == current_user.id,
        LearningMaterial.processing_status == "completed"
    ).all()

    # Filter materials matching this competency or general
    relevant_mats = [m for m in materials if m.competency_id == competency_id or m.material_scope == "OFFICIAL_COMPETENCY"]
    if not relevant_mats:
        relevant_mats = materials[:3]

    mat_ids = [m.id for m in relevant_mats]

    notes = db.query(MaterialNote).filter(MaterialNote.material_id.in_(mat_ids)).all() if mat_ids else []
    decks = db.query(MaterialFlashcardDeck).filter(MaterialFlashcardDeck.material_id.in_(mat_ids)).all() if mat_ids else []
    mindmaps = db.query(MaterialMindMap).filter(MaterialMindMap.material_id.in_(mat_ids)).all() if mat_ids else []
    quiz_sets = db.query(MaterialQuizQuestionSet).filter(MaterialQuizQuestionSet.material_id.in_(mat_ids)).all() if mat_ids else []

    # Get accredited iGOT courses matching competency
    courses = db.query(Course).filter(Course.competency_id == competency_id).all()
    if not courses:
        courses = db.query(Course).limit(2).all()

    return CompetencyRemediationResponse(
        competency_id=competency_id,
        competency_name=comp.name,
        current_score=current_score,
        target_score=target_score,
        gap=gap,
        status=status,
        diagnosis_summary=diag_summary,
        remediation_focus=rem_focus,
        weak_subtopics=weak_subtopics,
        learner_materials=[
            {
                "id": m.id,
                "title": m.title,
                "scope": m.material_scope,
                "status": m.processing_status
            }
            for m in relevant_mats
        ],
        study_notes=[
            {
                "id": n.id,
                "material_id": n.material_id,
                "title": n.title,
                "version": n.version
            }
            for n in notes
        ],
        flashcard_decks=[
            {
                "id": d.id,
                "material_id": d.material_id,
                "title": d.title,
                "card_count": len(d.cards) if d.cards else 0
            }
            for d in decks
        ],
        mind_maps=[
            {
                "id": mm.id,
                "material_id": mm.material_id,
                "title": (mm.root_node.get("label", "Mind Map") if isinstance(mm.root_node, dict) else "Mind Map")
            }
            for mm in mindmaps
        ],
        material_quizzes=[
            {
                "id": qs.id,
                "material_id": qs.material_id,
                "question_count": len(qs.questions) if qs.questions else 0,
                "version": qs.version
            }
            for qs in quiz_sets
        ],
        recommended_courses=[
            {
                "id": c.id,
                "title": c.title,
                "provider": c.provider or "iGOT Karmayogi",
                "duration_hours": c.duration_hours,
                "difficulty": c.difficulty
            }
            for c in courses
        ],
        targeted_reassessment_available=True
    )

@router.get("/latest", response_model=Optional[AssessmentDiagnosisResponse])
def get_latest_diagnosis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns diagnosis for the most recent completed assessment of authenticated learner."""
    latest_ass = db.query(Assessment).filter(
        Assessment.user_id == current_user.id,
        Assessment.status == "completed"
    ).order_by(Assessment.completed_at.desc()).first()

    if not latest_ass:
        return None

    return get_assessment_diagnosis(latest_ass.id, db, current_user)

def _build_remediation_actions(
    db: Session, 
    user: User, 
    competency_id: Optional[int], 
    competency_name: str
) -> List[RemediationActionItem]:
    """Helper to assemble structured remediation action items from available resources."""
    actions = []

    # 1. Learner Study Material
    user_mats = db.query(LearningMaterial).filter(
        LearningMaterial.uploaded_by == user.id,
        LearningMaterial.processing_status == "completed"
    ).all()

    target_mat = next((m for m in user_mats if m.competency_id == competency_id), None) or (user_mats[0] if user_mats else None)

    if target_mat:
        actions.append(RemediationActionItem(
            action_type="STUDY_MATERIAL",
            title=f"Review Study Content: {target_mat.title}",
            reason=f"Reinforce fundamental concepts using grounded study notes for {competency_name}.",
            route=f"/materials?materialId={target_mat.id}&tab=notes",
            resource_id=target_mat.id,
            resource_type="material"
        ))

        # Check for flashcards
        deck = db.query(MaterialFlashcardDeck).filter(MaterialFlashcardDeck.material_id == target_mat.id).first()
        if deck:
            actions.append(RemediationActionItem(
                action_type="FLASHCARDS",
                title=f"Flashcard Drill: {deck.title}",
                reason="Active recall practice on core terminology and formulas.",
                route=f"/materials?materialId={target_mat.id}&tab=flashcards",
                resource_id=deck.id,
                resource_type="flashcard_deck"
            ))

    # 2. Official iGOT Course
    course = None
    if competency_id:
        course = db.query(Course).filter(Course.competency_id == competency_id).first()
    if not course:
        course = db.query(Course).first()

    if course:
        actions.append(RemediationActionItem(
            action_type="COURSE",
            title=f"Official Course: {course.title}",
            reason=f"Accredited curriculum module from {course.provider or 'iGOT Karmayogi'}.",
            route="/courses",
            resource_id=course.id,
            resource_type="course"
        ))

    # 3. Targeted Reassessment Action
    if competency_id:
        actions.append(RemediationActionItem(
            action_type="REASSESSMENT",
            title=f"Targeted Reassessment: {competency_name}",
            reason="Verify that competency gaps and misconceptions have been closed with official questions.",
            route=f"/assessment?mode=reassessment&competencyId={competency_id}",
            resource_id=competency_id,
            resource_type="competency"
        ))

    return actions
