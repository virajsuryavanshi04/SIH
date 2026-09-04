from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from datetime import datetime
import math
from sqlalchemy.orm import Session

from models.user_competency import UserCompetency, CompetencyScore
from models.assessment import Assessment, AssessmentAnswer, Question
from models.competency import Competency, RoleCompetency
from models.material import LearningMaterial, MaterialQuizQuestion

@dataclass
class EvidenceItem:
    """Represents an atomic item-level response observation."""
    is_correct: bool
    difficulty: int = 2  # 1=Easy, 2=Medium, 3=Hard
    confidence_level: int = 2  # 1 to 5 (learner stated confidence)
    time_taken_seconds: Optional[int] = None
    answered_at: Optional[datetime] = None
    session_weight: float = 1.0  # Recency/session weight (1.0 for current, 0.85 for past)

@dataclass
class CompetencyEstimation:
    """Authoritative outcome of competency estimation for a single competency."""
    score: Optional[float]  # None if UNASSESSED, else 0.0 - 100.0
    confidence: float  # 0.0 to 100.0%
    evidence_count: int  # Total questions attempted
    correct_count: int  # Total correct answers
    evidence_level: str  # "UNASSESSED", "LOW", "MEDIUM", "HIGH"
    status: str  # "not_assessed", "strong", "on_track", "needs_attention", "critical_gap"
    gap: Optional[float]  # None if UNASSESSED, else max(0.0, target - score)
    accuracy_percent: Optional[float] = None  # Raw percentage for immediate test display

class CompetencyEngine:
    """
    Unified Evidence-Based Competency Estimation Engine.
    
    Principles:
    1. Single Source of Truth: All competency scores across SmartLearn are produced
       exclusively by this engine.
    2. Bayesian Evidence Accumulation: Limited evidence (1-2 questions) produces a
       moderate estimate regularized by a neutral prior, NEVER 0% or 100%.
    3. Item Difficulty Weighting: Hard correct answers provide stronger competency signals
       than Easy correct answers. Missing Easy questions provides stronger negative signals
       than missing Hard questions.
    4. Strict UNASSESSED Semantics: If no evidence exists, score remains NULL / None.
       Unassessed topics are never converted to 0% and do not create false deficit gaps.
    5. Clean Separation of Concerns:
       - Quiz Score: Immediate test accuracy percentage (e.g. 8/10 = 80%).
       - Competency Score: Latent ability estimate (e.g. 73.4% Estimated Competency, Moderate Evidence).
    """

    # Neutral uninformative prior
    PRIOR_MEAN = 50.0
    PRIOR_WEIGHT = 2.5

    @classmethod
    def normalize_difficulty(cls, diff_val: Any) -> int:
        """Normalizes difficulty representations to integer 1, 2, or 3."""
        if diff_val is None:
            return 2
        s = str(diff_val).strip().lower()
        if s in ("1", "easy", "beginner", "basic"):
            return 1
        if s in ("3", "hard", "advanced", "expert", "complex"):
            return 3
        return 2

    @classmethod
    def calculate_competency(
        cls,
        evidence: List[EvidenceItem],
        target_score: float = 70.0
    ) -> CompetencyEstimation:
        """
        Pure function: Computes Bayesian competency estimate and evidence metrics
        from a list of response evidence items.
        """
        if not evidence:
            return CompetencyEstimation(
                score=None,
                confidence=0.0,
                evidence_count=0,
                correct_count=0,
                evidence_level="UNASSESSED",
                status="not_assessed",
                gap=None,
                accuracy_percent=None
            )

        n_total = len(evidence)
        n_correct = sum(1 for e in evidence if e.is_correct)
        raw_accuracy = round((n_correct / n_total) * 100.0, 1)

        # Prior anchor
        total_weighted_signal = cls.PRIOR_MEAN * cls.PRIOR_WEIGHT
        total_weight = cls.PRIOR_WEIGHT

        for item in evidence:
            d = cls.normalize_difficulty(item.difficulty)
            sw = getattr(item, "session_weight", 1.0)

            if item.is_correct:
                if d == 1:
                    base_signal = 70.0
                    base_weight = 1.0
                elif d == 2:
                    base_signal = 82.0
                    base_weight = 1.2
                else:  # d == 3 (Hard)
                    base_signal = 95.0
                    base_weight = 1.5
                
                # Confidence calibration: boost for confident correct
                if item.confidence_level >= 4:
                    base_signal += 3.0
            else:
                if d == 1:  # Missing an easy question indicates noticeable gap
                    base_signal = 20.0
                    base_weight = 1.4
                elif d == 2:
                    base_signal = 30.0
                    base_weight = 1.2
                else:  # d == 3 (Hard)
                    base_signal = 42.0
                    base_weight = 1.0

                # Confidence calibration: penalty for high-confidence misconception
                if item.confidence_level >= 4:
                    base_signal -= 5.0

            effective_weight = base_weight * sw
            effective_signal = max(5.0, min(98.0, base_signal))

            total_weighted_signal += effective_signal * effective_weight
            total_weight += effective_weight

        # Posterior estimated score
        estimated_score = round(total_weighted_signal / total_weight, 1)
        estimated_score = max(0.0, min(100.0, estimated_score))

        # Confidence metric (0.0 to 100.0% saturation curve)
        effective_item_weight = total_weight - cls.PRIOR_WEIGHT
        conf = round(100.0 * (1.0 - (1.0 / (1.0 + 0.35 * effective_item_weight))), 1)
        conf = max(0.0, min(99.0, conf))

        # Categorize evidence strength
        if n_total <= 3:
            evidence_level = "LOW"
        elif n_total <= 8:
            evidence_level = "MEDIUM"
        else:
            evidence_level = "HIGH"

        # Competency status relative to target
        gap = round(max(0.0, target_score - estimated_score), 1)
        if estimated_score >= target_score:
            status = "strong"
        elif estimated_score >= target_score - 10.0:
            status = "on_track"
        elif (target_score - estimated_score) > 20.0 and conf >= 40.0:
            status = "critical_gap"
        else:
            status = "needs_attention"

        return CompetencyEstimation(
            score=estimated_score,
            confidence=conf,
            evidence_count=n_total,
            correct_count=n_correct,
            evidence_level=evidence_level,
            status=status,
            gap=gap,
            accuracy_percent=raw_accuracy
        )

    @classmethod
    def collect_user_competency_evidence(
        cls,
        db: Session,
        user_id: int,
        competency_id: int,
        exclude_assessment_id: Optional[int] = None
    ) -> List[EvidenceItem]:
        """
        Collects all historical item-level answers for a user on a given competency,
        weighting older sessions gently (session_weight = 0.85).
        """
        query = db.query(AssessmentAnswer).join(Assessment).filter(
            Assessment.user_id == user_id,
            Assessment.status == "completed"
        )
        if exclude_assessment_id:
            query = query.filter(Assessment.id != exclude_assessment_id)

        answers = query.order_by(Assessment.completed_at.asc()).all()

        evidence_items = []
        for a in answers:
            # Check if this answer pertains to the target competency
            cid = None
            diff = 2
            if a.question and a.question.competency_id == competency_id:
                cid = a.question.competency_id
                diff = cls.normalize_difficulty(a.question.difficulty)
            elif a.material_quiz_question:
                mat = a.assessment.source_material
                if mat and mat.competency_id == competency_id:
                    cid = mat.competency_id
                    diff = cls.normalize_difficulty(a.material_quiz_question.difficulty)

            if cid == competency_id and a.is_correct is not None:
                evidence_items.append(EvidenceItem(
                    is_correct=bool(a.is_correct),
                    difficulty=diff,
                    confidence_level=a.confidence_level or 2,
                    time_taken_seconds=a.time_taken_seconds or a.response_time or 15,
                    answered_at=a.answered_at or a.assessment.completed_at,
                    session_weight=0.85  # Prior session weight
                ))

        return evidence_items

    @classmethod
    def update_competencies_from_assessment(
        cls,
        db: Session,
        assessment_id: int,
        user_id: int
    ) -> Dict[int, CompetencyEstimation]:
        """
        Updates live UserCompetency and records CompetencyScore history for all
        competencies evaluated in the given assessment session.
        
        Strict Invariant:
        Unassessed competencies that were NOT evaluated in this assessment are
        PRESERVED without modification (never overwritten, never reset).
        """
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            return {}

        current_answers = db.query(AssessmentAnswer).filter(
            AssessmentAnswer.assessment_id == assessment_id
        ).all()

        if not current_answers:
            return {}

        # 1. Group current assessment answers by competency
        session_answers_by_comp: Dict[int, List[EvidenceItem]] = {}
        for a in current_answers:
            cid = None
            diff = 2
            if a.question and a.question.competency_id:
                cid = a.question.competency_id
                diff = cls.normalize_difficulty(a.question.difficulty)
            elif a.material_quiz_question:
                mat = assessment.source_material
                if mat and mat.competency_id and mat.material_scope == "OFFICIAL_COMPETENCY":
                    cid = mat.competency_id
                    diff = cls.normalize_difficulty(a.material_quiz_question.difficulty)

            if cid is not None and a.is_correct is not None:
                session_answers_by_comp.setdefault(cid, []).append(EvidenceItem(
                    is_correct=bool(a.is_correct),
                    difficulty=diff,
                    confidence_level=a.confidence_level or 2,
                    time_taken_seconds=a.time_taken_seconds or a.response_time or 15,
                    answered_at=a.answered_at or datetime.utcnow(),
                    session_weight=1.0  # Current session has full weight
                ))

        # 2. Fetch role targets
        user = assessment.user
        role_targets: Dict[int, float] = {}
        if user and user.role_id:
            reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
            role_targets = {r.competency_id: r.target_score for r in reqs}
        elif user and user.designation:
            reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
            role_targets = {r.competency_id: r.target_score for r in reqs}

        results: Dict[int, CompetencyEstimation] = {}

        # 3. Process each evaluated competency
        for cid, session_items in session_answers_by_comp.items():
            target = role_targets.get(cid, 70.0)

            # Accumulate prior historical evidence + current session items
            prior_items = cls.collect_user_competency_evidence(
                db, user_id, cid, exclude_assessment_id=assessment_id
            )
            combined_evidence = prior_items + session_items

            estimation = cls.calculate_competency(combined_evidence, target_score=target)
            results[cid] = estimation

            # Update or create live UserCompetency record
            uc = db.query(UserCompetency).filter(
                UserCompetency.user_id == user_id,
                UserCompetency.competency_id == cid
            ).first()

            if assessment.assessment_type == "adaptive_reassessment":
                # Targeted reassessment score is the direct evaluated score from this reassessment session
                final_score = round((sum(1 for e in session_items if e.is_correct) / len(session_items)) * 100.0, 1) if session_items else (estimation.score or 0.0)
                final_status = "strong" if final_score >= target else ("on_track" if final_score >= target - 10.0 else ("critical_gap" if (target - final_score) > 20.0 else "needs_attention"))
            else:
                final_score = estimation.score
                final_status = estimation.status

            if uc:
                uc.current_score = final_score
                uc.target_score = target
                uc.confidence = estimation.confidence
                uc.evidence_count = estimation.evidence_count
                uc.evidence_level = estimation.evidence_level
                uc.status = final_status
                uc.last_assessed = datetime.utcnow()
            else:
                uc = UserCompetency(
                    user_id=user_id,
                    competency_id=cid,
                    current_score=final_score,
                    target_score=target,
                    confidence=estimation.confidence,
                    evidence_count=estimation.evidence_count,
                    evidence_level=estimation.evidence_level,
                    status=final_status,
                    last_assessed=datetime.utcnow()
                )
                db.add(uc)

            # Record immutable historical audit trail in CompetencyScore
            cs = CompetencyScore(
                user_id=user_id,
                competency_id=cid,
                score=final_score or 0.0,
                assessment_id=assessment_id,
                source=assessment.assessment_type or "assessment",
                assessed_at=datetime.utcnow()
            )
            db.add(cs)

        db.commit()
        return results

    @classmethod
    def recalculate_all_for_user(cls, db: Session, user_id: int):
        """
        Recomputes live competency scores for a user strictly from actual
        accumulated answer evidence in the database.
        
        Preserves UNASSESSED (None) for competencies with zero evidence.
        """
        user = db.query(UserCompetency).filter(UserCompetency.user_id == user_id).first()
        if not user:
            return

        user_comps = db.query(UserCompetency).filter(UserCompetency.user_id == user_id).all()
        for uc in user_comps:
            evidence = cls.collect_user_competency_evidence(db, user_id, uc.competency_id)
            if evidence:
                est = cls.calculate_competency(evidence, target_score=uc.target_score)
                uc.current_score = est.score
                uc.confidence = est.confidence
                uc.evidence_count = est.evidence_count
                uc.evidence_level = est.evidence_level
                uc.status = est.status
            else:
                # Retain unassessed state if no evidence exists
                if uc.evidence_count == 0:
                    uc.current_score = None
                    uc.confidence = 0.0
                    uc.evidence_level = "UNASSESSED"
                    uc.status = "not_assessed"

        db.commit()
