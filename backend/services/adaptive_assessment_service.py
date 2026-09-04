from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import random

from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
from models.material import LearningMaterial, MaterialQuizQuestionSet, MaterialQuizQuestion, MaterialQuizOption
from models.competency import Competency, CompetencyTopic, RoleCompetency
from models.user_competency import UserCompetency, CompetencyScore
from models.user import User

class AdaptiveAssessmentService:
    """
    Core Adaptive Assessment Engine for SmartLearn.
    Handles per-competency/topic difficulty adaptation, weak subtopic probing,
    anti-repetition question selection, and deterministic scoring.
    """

    @staticmethod
    def normalize_difficulty_int(val: Any) -> int:
        """Normalizes difficulty values ('1', '2', '3', 'beginner', 'intermediate', 'advanced') to int 1, 2, 3."""
        if val in (1, '1', 'beginner', 'easy'):
            return 1
        if val in (3, '3', 'advanced', 'hard'):
            return 3
        return 2  # default Medium

    @staticmethod
    def difficulty_str_list(diff_int: int) -> List[str]:
        """Returns string matching patterns for a numeric difficulty."""
        if diff_int == 1:
            return ["1", "beginner", "easy"]
        if diff_int == 3:
            return ["3", "advanced", "hard"]
        return ["2", "intermediate", "medium"]

    @classmethod
    def initialize_adaptive_state(
        cls, 
        db: Session, 
        user: User, 
        competency_ids: Optional[List[int]] = None, 
        target_question_count: int = 10,
        question_type: Optional[str] = "MIXED"
    ) -> Dict[str, Any]:
        """
        Initializes per-competency and per-topic starting difficulty based on user's existing evidence.
        """
        # Resolve target competencies
        comp_ids = competency_ids
        if not comp_ids:
            if user and user.role_id:
                reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
                comp_ids = [r.competency_id for r in reqs]
            elif user and user.designation:
                reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
                comp_ids = [r.competency_id for r in reqs]
            else:
                comp_ids = [c.id for c in db.query(Competency).all()]

        if not comp_ids:
            comp_ids = [1, 2, 3, 4, 5, 6, 7, 8]

        # Fetch existing user competency scores
        user_comps = db.query(UserCompetency).filter(
            UserCompetency.user_id == user.id,
            UserCompetency.competency_id.in_(comp_ids)
        ).all()
        comp_score_map = {uc.competency_id: uc.current_score for uc in user_comps}

        per_comp_diff = {}
        for cid in comp_ids:
            score = comp_score_map.get(cid)
            if score is not None:
                if score >= 80.0:
                    start_diff = 3  # Start Hard if proficient
                elif score < 50.0:
                    start_diff = 1  # Start Easy if struggling
                else:
                    start_diff = 2  # Medium
            else:
                start_diff = 2  # Default Medium for unassessed
            per_comp_diff[str(cid)] = start_diff

        # Initialize subtopic states
        topics = db.query(CompetencyTopic).filter(CompetencyTopic.competency_id.in_(comp_ids)).all()
        per_topic_diff = {str(t.id): per_comp_diff.get(str(t.competency_id), 2) for t in topics}

        # Strict Invariant: NEVER drop or substitute any required competency in the schedule
        schedule_comps = list(comp_ids)
        num_comps = len(schedule_comps)
        
        base_quota = target_question_count // num_comps if num_comps > 0 else 1
        remainder = target_question_count % num_comps if num_comps > 0 else 0
        
        # Build deterministic competency schedule for target_question_count
        # Consecutive grouping by competency: [C1, C1, C2, C2, C3, C3, ...]
        competency_schedule = []
        competency_quotas = {}
        for i, c in enumerate(schedule_comps):
            count = base_quota + (1 if i < remainder else 0)
            competency_quotas[str(c)] = count
            competency_schedule.extend([c] * count)

        # Guarantee that every required competency appears at least once
        if len(competency_schedule) < num_comps:
            for c in schedule_comps:
                if c not in competency_schedule:
                    competency_schedule.append(c)

        first_cid = competency_schedule[0] if competency_schedule else comp_ids[0]
        first_topics = [t.id for t in topics if t.competency_id == first_cid]
        first_tid = first_topics[0] if first_topics else None

        normalized_q_type = (question_type or "MIXED").upper()

        state = {
            "competency_ids": comp_ids,
            "competency_schedule": competency_schedule,
            "competency_quotas": competency_quotas,
            "competency_answers": {str(cid): [] for cid in comp_ids},
            "question_type": normalized_q_type,
            "per_competency_difficulty": {str(cid): 2 for cid in comp_ids},
            "per_topic_difficulty": {str(t.id): 2 for t in topics},
            "streaks": {str(cid): {"correct": 0, "incorrect": 0} for cid in comp_ids},
            "topic_streaks": {str(t.id): {"correct": 0, "incorrect": 0} for t in topics},
            "performance_by_topic": {},
            "performance_by_difficulty": {
                "1": {"total": 0, "correct": 0},
                "2": {"total": 0, "correct": 0},
                "3": {"total": 0, "correct": 0}
            },
            "current_competency_id": first_cid,
            "current_topic_id": first_tid,
            "current_difficulty": 2,  # Strict Invariant: First question of every competency is ALWAYS Medium (2)
            "answered_count": 0,
            "target_question_count": target_question_count,
            "total_steps": target_question_count,
            "seen_question_ids": [],
            "pending_question_id": None
        }
        return state

    @classmethod
    def compute_next_difficulty(
        cls, 
        current_diff: int, 
        is_correct: bool, 
        correct_streak: int, 
        incorrect_streak: int
    ) -> Tuple[int, int, int]:
        """
        Calculates adapted difficulty following competency-local rules:
        - Medium (2) + Correct -> Hard (3)
        - Medium (2) + Incorrect -> Easy (1)
        """
        if is_correct:
            new_diff = 3
            c_streak = correct_streak + 1
            i_streak = 0
        else:
            new_diff = 1
            i_streak = incorrect_streak + 1
            c_streak = 0
        return new_diff, c_streak, i_streak

    @classmethod
    def select_adaptive_question(
        cls, 
        db: Session, 
        user_id: int, 
        competency_id: int, 
        topic_id: Optional[int], 
        difficulty: int, 
        excluded_ids: List[int],
        question_type: Optional[str] = None
    ) -> Tuple[Optional[Question], bool]:
        """
        Finds an approved question matching the scheduled competency, question_type, and adapted difficulty.
        Strictly restricts candidate search within the assigned competency (NEVER crosses competency boundaries).
        Relaxation hierarchy within SAME competency:
        1. Exact topic + target difficulty + question_type
        2. Competency + target difficulty + question_type
        3. Competency + relaxed difficulties within same competency:
           - If target is Hard (3): try Medium (2), then Easy (1)
           - If target is Easy (1): try Medium (2), then Hard (3)
           - If target is Medium (2): try Hard (3), then Easy (1)
        4. Session-only fallback (excluded_ids only)
        5. Format relaxation (excluded_ids only)
        Returns: (Question | None, question_generation_required: bool)
        """
        # Fetch user's persistent seen questions history
        hist = db.query(UserQuestionHistory.question_id).filter(UserQuestionHistory.user_id == user_id).all()
        user_seen = {h[0] for h in hist}
        all_excluded = set(excluded_ids).union(user_seen)

        diff_aliases = cls.difficulty_str_list(difficulty)
        norm_type = (question_type or "MIXED").upper()

        from sqlalchemy import or_

        def apply_type_filter(q_query):
            q_query = q_query.filter(Question.options.any())
            if norm_type == "SHORT_MCQ":
                return q_query.filter(or_(Question.question_type == "SHORT_MCQ", Question.question_type.is_(None)))
            elif norm_type in ["WORD_PROBLEM", "CASE_STUDY"]:
                return q_query.filter(Question.question_type == norm_type)
            elif norm_type == "MIXED":
                return q_query.filter(or_(Question.question_type.in_(["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY"]), Question.question_type.is_(None)))
            return q_query

        # 1. Exact Topic + Target Difficulty Match (unseen across history)
        if topic_id:
            query = db.query(Question).filter(
                Question.competency_id == competency_id,
                Question.topic_id == topic_id,
                Question.difficulty.in_(diff_aliases),
                Question.status == "approved"
            )
            query = apply_type_filter(query)
            if all_excluded:
                query = query.filter(Question.id.not_in(all_excluded))
            candidate = query.first()
            if candidate:
                return candidate, False

        # 2. Competency + Target Difficulty Match (unseen across history)
        query = db.query(Question).filter(
            Question.competency_id == competency_id,
            Question.difficulty.in_(diff_aliases),
            Question.status == "approved"
        )
        query = apply_type_filter(query)
        if all_excluded:
            query = query.filter(Question.id.not_in(all_excluded))
        candidate = query.first()
        if candidate:
            return candidate, False

        # 3. Competency + Target Difficulty Match (session-only fallback for repeat test takers)
        query = db.query(Question).filter(
            Question.competency_id == competency_id,
            Question.difficulty.in_(diff_aliases),
            Question.status == "approved"
        )
        query = apply_type_filter(query)
        if excluded_ids:
            query = query.filter(Question.id.not_in(excluded_ids))
        candidate = query.first()
        if candidate:
            return candidate, False

        # 4. Difficulty Relaxation within SAME competency (unseen across history)
        if difficulty == 3:
            fallback_diffs = [2, 1]
        elif difficulty == 1:
            fallback_diffs = [2, 3]
        else:
            fallback_diffs = [3, 1]

        for alt_d in fallback_diffs:
            alt_aliases = cls.difficulty_str_list(alt_d)
            query = db.query(Question).filter(
                Question.competency_id == competency_id,
                Question.difficulty.in_(alt_aliases),
                Question.status == "approved"
            )
            query = apply_type_filter(query)
            if all_excluded:
                query = query.filter(Question.id.not_in(all_excluded))
            candidate = query.first()
            if candidate:
                return candidate, False

        # 5. Difficulty Relaxation within SAME competency (session-only fallback)
        for alt_d in fallback_diffs:
            alt_aliases = cls.difficulty_str_list(alt_d)
            query = db.query(Question).filter(
                Question.competency_id == competency_id,
                Question.difficulty.in_(alt_aliases),
                Question.status == "approved"
            )
            query = apply_type_filter(query)
            if excluded_ids:
                query = query.filter(Question.id.not_in(excluded_ids))
            candidate = query.first()
            if candidate:
                return candidate, False

        # 6. Format relaxation within SAME competency (session-only fallback)
        relax_format_query = db.query(Question).filter(
            Question.competency_id == competency_id,
            Question.status == "approved",
            Question.options.any()
        )
        if excluded_ids:
            relax_format_query = relax_format_query.filter(Question.id.not_in(excluded_ids))
        candidate = relax_format_query.first()
        if candidate:
            return candidate, False

        # Strict Invariant: Never cross competency boundary. Return None if competency pool is truly exhausted.
        return None, True

    @classmethod
    def choose_next_target(
        cls, 
        db: Session, 
        state: Dict[str, Any]
    ) -> Tuple[int, Optional[int], int]:
        """
        Determines next competency, subtopic, and difficulty strictly following the rules:
        1. Next competency is chosen strictly from the persisted competency_schedule.
        2. First question of EVERY competency is ALWAYS Medium (2).
        3. If previous answer in THIS SAME competency was Correct -> Hard (3).
        4. If previous answer in THIS SAME competency was Incorrect -> Easy (1).
        5. Global streaks or other competencies NEVER override this competency-local rule.
        Returns: (next_competency_id, next_topic_id, next_difficulty)
        """
        comp_ids = state.get("competency_ids", [1])
        schedule = state.get("competency_schedule", [])
        answered = state.get("answered_count", 0)

        # 1. Determine scheduled competency strictly from immutable schedule
        if schedule and answered < len(schedule):
            next_cid = schedule[answered]
        else:
            next_cid = comp_ids[answered % len(comp_ids)]

        # 2. Determine target difficulty strictly based on competency-local answers
        comp_answers = state.get("competency_answers", {}).get(str(next_cid), [])
        if len(comp_answers) == 0:
            # First question of every competency is ALWAYS Medium (2)
            next_diff = 2
        elif len(comp_answers) == 1:
            # Second question for this competency:
            # Medium + Correct -> Hard (3)
            # Medium + Incorrect -> Easy (1)
            last_ans = comp_answers[-1]
            if last_ans.get("is_correct", False):
                next_diff = 3
            else:
                next_diff = 1
        else:
            # Third (or subsequent) question for this competency:
            # Determine difficulty using existing competency-local adaptive state
            last_ans = comp_answers[-1]
            last_diff = last_ans.get("difficulty", 2)
            if last_ans.get("is_correct", False):
                next_diff = min(3, last_diff + 1)
            else:
                next_diff = max(1, last_diff - 1)

        perf_topics = state.get("performance_by_topic", {})

        # 3. Subtopic selection WITHIN the assigned competency
        comp_topics = db.query(CompetencyTopic).filter(CompetencyTopic.competency_id == next_cid).all()
        tested_tids = {int(k) for k in perf_topics.keys()}
        untested = [t.id for t in comp_topics if t.id not in tested_tids]

        if untested:
            next_tid = untested[0]
        elif comp_topics:
            next_tid = comp_topics[0].id
        else:
            next_tid = None

        return next_cid, next_tid, next_diff

    @classmethod
    def process_adaptive_step(
        cls, 
        db: Session, 
        assessment_id: int, 
        user_id: int, 
        question_id: int, 
        selected_option_id: int, 
        confidence_level: int = 2, 
        time_taken_seconds: int = 15
    ) -> Dict[str, Any]:
        """
        Processes an answer submission, updates topic performance & streaks,
        adapts difficulty, and determines the next question or finalizes.
        """
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise ValueError("Assessment session not found")

        # Invariant 5: Completed Assessment Immutability
        if assessment.status == "completed":
            from services.assessment_service import get_assessment_result
            return {
                "is_completed": True,
                "assessment_id": assessment_id,
                "result": get_assessment_result(db, assessment_id, user_id)
            }

        state = assessment.adaptive_state or cls.initialize_adaptive_state(db, assessment.user)

        if assessment.assessment_type == "material_quiz" or assessment.source_material_id is not None:
            return cls.process_material_quiz_adaptive_step(
                db=db,
                assessment=assessment,
                user_id=user_id,
                question_id=question_id,
                selected_option_id=selected_option_id,
                confidence_level=confidence_level,
                time_taken_seconds=time_taken_seconds
            )

        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise ValueError("Question not found")

        opt = db.query(QuestionOption).filter(QuestionOption.id == selected_option_id).first()
        is_correct = opt.is_correct if opt else False

        # 1. Record Answer
        ans = AssessmentAnswer(
            assessment_id=assessment_id,
            question_id=question_id,
            selected_option_id=selected_option_id,
            confidence_level=confidence_level,
            is_correct=is_correct,
            response_time=time_taken_seconds,
            time_taken_seconds=time_taken_seconds
        )
        db.add(ans)

        # 2. Update persistent UserQuestionHistory
        uq = db.query(UserQuestionHistory).filter(
            UserQuestionHistory.user_id == user_id,
            UserQuestionHistory.question_id == question_id
        ).first()
        if uq:
            uq.times_seen += 1
            uq.last_seen = datetime.utcnow()
        else:
            db.add(UserQuestionHistory(
                user_id=user_id,
                question_id=question_id,
                times_seen=1,
                last_seen=datetime.utcnow()
            ))

        # Update competency-local answers history
        cid_str = str(question.competency_id)
        tid_str = str(question.topic_id) if question.topic_id else None
        q_diff_int = cls.normalize_difficulty_int(question.difficulty)

        if "competency_answers" not in state:
            state["competency_answers"] = {}
        if cid_str not in state["competency_answers"]:
            state["competency_answers"][cid_str] = []
        state["competency_answers"][cid_str].append({
            "question_id": question_id,
            "is_correct": is_correct,
            "difficulty": q_diff_int
        })

        # Update difficulty performance tally
        diff_key = str(q_diff_int)
        if diff_key not in state["performance_by_difficulty"]:
            state["performance_by_difficulty"][diff_key] = {"total": 0, "correct": 0}
        state["performance_by_difficulty"][diff_key]["total"] += 1
        if is_correct:
            state["performance_by_difficulty"][diff_key]["correct"] += 1

        # Update subtopic performance
        if tid_str:
            if tid_str not in state["performance_by_topic"]:
                t_obj = db.query(CompetencyTopic).filter(CompetencyTopic.id == question.topic_id).first()
                state["performance_by_topic"][tid_str] = {
                    "name": t_obj.name if t_obj else "Subtopic",
                    "competency_id": question.competency_id,
                    "total": 0,
                    "correct": 0
                }
            state["performance_by_topic"][tid_str]["total"] += 1
            if is_correct:
                state["performance_by_topic"][tid_str]["correct"] += 1

        # Update streak and compute adapted difficulty for this competency
        c_streaks = state["streaks"].get(cid_str, {"correct": 0, "incorrect": 0})
        curr_comp_diff = state["per_competency_difficulty"].get(cid_str, 2)
        new_comp_diff, new_c_streak, new_i_streak = cls.compute_next_difficulty(
            curr_comp_diff, is_correct, c_streaks["correct"], c_streaks["incorrect"]
        )
        state["streaks"][cid_str] = {"correct": new_c_streak, "incorrect": new_i_streak}
        state["per_competency_difficulty"][cid_str] = new_comp_diff

        # Update topic difficulty
        if tid_str:
            t_streaks = state["topic_streaks"].get(tid_str, {"correct": 0, "incorrect": 0})
            curr_top_diff = state["per_topic_difficulty"].get(tid_str, curr_comp_diff)
            new_top_diff, new_tc_streak, new_ti_streak = cls.compute_next_difficulty(
                curr_top_diff, is_correct, t_streaks["correct"], t_streaks["incorrect"]
            )
            state["topic_streaks"][tid_str] = {"correct": new_tc_streak, "incorrect": new_ti_streak}
            state["per_topic_difficulty"][tid_str] = new_top_diff

        # Update progress counters and clear previous pending question
        state["answered_count"] += 1
        state["pending_question_id"] = None
        if question_id not in state["seen_question_ids"]:
            state["seen_question_ids"].append(question_id)

        # 4. Check Completion Condition
        from sqlalchemy.orm.attributes import flag_modified
        target_count = state.get("target_question_count", 10)
        if state["answered_count"] >= target_count:
            assessment.status = "completed"
            assessment.completed_at = datetime.utcnow()
            assessment.adaptive_state = state
            flag_modified(assessment, "adaptive_state")
            db.commit()
            final_result = cls.finalize_adaptive_assessment(db, assessment_id, user_id)
            return {
                "is_completed": True,
                "assessment_id": assessment_id,
                "result": final_result
            }

        # 5. Determine Next Question Target strictly according to persistent competency_schedule
        next_cid, next_tid, next_diff = cls.choose_next_target(db, state)
        q_type_constraint = state.get("question_type", "MIXED")
        next_q, gen_required = cls.select_adaptive_question(
            db, user_id, next_cid, next_tid, next_diff, state["seen_question_ids"], question_type=q_type_constraint
        )

        state["current_competency_id"] = next_cid
        state["current_topic_id"] = next_tid
        state["current_difficulty"] = next_diff
        state["pending_question_id"] = next_q.id if next_q else None
        assessment.adaptive_state = state
        flag_modified(assessment, "adaptive_state")
        db.commit()

        if gen_required or not next_q:
            return {
                "is_completed": False,
                "question_generation_required": True,
                "pending_competency_id": next_cid,
                "pending_topic_id": next_tid,
                "pending_difficulty": next_diff,
                "message": "question_generation_required"
            }

        # Format next question
        opts = [
            {"id": o.id, "text": o.text, "order": o.order} 
            for o in sorted(next_q.options, key=lambda x: x.order)
        ]
        
        return {
            "is_completed": False,
            "question_generation_required": False,
            "step": state["answered_count"] + 1,
            "total_steps": target_count,
            "next_question": {
                "id": next_q.id,
                "text": next_q.question_text or next_q.text,
                "question_type": next_q.question_type or "SHORT_MCQ",
                "difficulty": str(next_q.difficulty),
                "competency_id": next_q.competency_id,
                "competency_name": next_q.competency.name if next_q.competency else "Competency",
                "topic_id": next_q.topic_id,
                "topic_name": next_q.topic.name if next_q.topic else None,
                "cognitive_level": next_q.cognitive_level or "understand",
                "options": opts
            }
        }

    @classmethod
    def get_resumable_assessment_session(
        cls,
        db: Session,
        assessment_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Reconstructs the exact existing assessment session without creating new records
        or altering historical telemetry.
        """
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise ValueError("Assessment session not found")
        if assessment.user_id != user_id:
            raise PermissionError("Access denied to this assessment session")

        # If completed, return completion status
        if assessment.status == "completed":
            from services.assessment_service import get_assessment_result
            res = get_assessment_result(db, assessment_id, user_id)
            return {
                "assessment_id": assessment_id,
                "is_completed": True,
                "status": "completed",
                "result": res
            }

        state = assessment.adaptive_state or {}
        target_count = state.get("target_question_count", 10)
        answered_count = state.get("answered_count", 0)

        # Check if there is an active pending question
        pending_qid = state.get("pending_question_id")
        pending_q = None
        if pending_qid:
            pending_q = db.query(Question).filter(Question.id == pending_qid).first()

        # If not present, determine target strictly from immutable competency_schedule
        if not pending_q:
            next_cid, next_tid, next_diff = cls.choose_next_target(db, state)
            q_type_constraint = state.get("question_type", "MIXED")
            pending_q, _ = cls.select_adaptive_question(
                db, user_id, next_cid, next_tid, next_diff, state.get("seen_question_ids", []), question_type=q_type_constraint
            )
            if pending_q:
                state["pending_question_id"] = pending_q.id
                state["current_competency_id"] = next_cid
                state["current_topic_id"] = next_tid
                state["current_difficulty"] = next_diff
                assessment.adaptive_state = state
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(assessment, "adaptive_state")
                db.commit()

        if not pending_q:
            raise ValueError("Insufficient approved questions available to resume session")

        opts = [
            {"id": o.id, "text": o.text, "order": o.order}
            for o in sorted(pending_q.options, key=lambda x: x.order)
        ]

        comp_names = []
        for cid in state.get("competency_ids", []):
            c_name = db.query(Competency.name).filter(Competency.id == cid).scalar()
            if c_name:
                comp_names.append(c_name)

        return {
            "assessment_id": assessment.id,
            "assessment_type": assessment.assessment_type or "adaptive",
            "status": "in_progress",
            "is_completed": False,
            "step": answered_count + 1,
            "total_steps": target_count,
            "answered_count": answered_count,
            "competencies_covered": comp_names or ["Official Competency"],
            "current_question": {
                "id": pending_q.id,
                "text": pending_q.question_text or pending_q.text,
                "question_text": pending_q.question_text or pending_q.text,
                "question_type": pending_q.question_type or "SHORT_MCQ",
                "difficulty": str(pending_q.difficulty),
                "competency_id": pending_q.competency_id,
                "competency_name": pending_q.competency.name if pending_q.competency else "Competency",
                "topic_id": pending_q.topic_id,
                "topic_name": pending_q.topic.name if pending_q.topic else None,
                "cognitive_level": pending_q.cognitive_level or "understand",
                "options": opts
            }
        }

    @classmethod
    def finalize_adaptive_assessment(
        cls, 
        db: Session, 
        assessment_id: int, 
        user_id: int
    ) -> Dict[str, Any]:
        """
        Calculates final competency scores, subtopic scores, difficulty performance,
        strongest/weakest topics, and writes persistent history & user_competency state.
        """
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        user = db.query(User).filter(User.id == user_id).first()
        answers = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).all()
        state = assessment.adaptive_state or {}

        # Resolve role targets
        role_targets = {}
        if user and user.role_id:
            reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
            role_targets = {r.competency_id: r.target_score for r in reqs}
        elif user and user.designation:
            reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
            role_targets = {r.competency_id: r.target_score for r in reqs}

        # Strict Invariant: Completion Validation for Baseline Assessments
        # The baseline assessment is valid ONLY if:
        # 1. Total actual questions served is between 15 and 20.
        # 2. Every required role competency has received at least 2 actual questions.
        if assessment.assessment_type == "baseline":
            role_reqs = []
            if user and user.role_id:
                role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == user.role_id).all()
            elif user and user.designation:
                role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == user.designation).all()
            if not role_reqs and user and user.role_id:
                from models.role import Role
                r_obj = db.query(Role).filter(Role.id == user.role_id).first()
                if r_obj:
                    role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_name == r_obj.name).all()

            required_comp_ids = {r.competency_id for r in role_reqs}
            from collections import Counter
            actual_comp_counts = Counter()
            for a in answers:
                cid = None
                if a.question and a.question.competency_id:
                    cid = a.question.competency_id
                elif a.question_id:
                    q = db.query(Question.competency_id).filter(Question.id == a.question_id).first()
                    if q and q[0]:
                        cid = q[0]
                if cid is not None:
                    actual_comp_counts[cid] += 1

            total_actual = len(answers)
            if not (15 <= total_actual <= 20):
                assessment.status = "in_progress"
                db.commit()
                raise ValueError(
                    f"Baseline assessment invalid: Total actual questions {total_actual} is not within required 15–20 range."
                )

            for cid in required_comp_ids:
                count = actual_comp_counts.get(cid, 0)
                if count < 2:
                    assessment.status = "in_progress"
                    db.commit()
                    raise ValueError(
                        f"Baseline assessment incomplete: Required competency ID {cid} only received {count} actual question(s). Minimum 2 questions required per competency."
                    )

            state["actual_questions_by_competency"] = {str(k): v for k, v in actual_comp_counts.items()}

        # 1. Competency Performance
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

        # 1. Update competencies via unified CompetencyEngine
        from services.competency_engine import CompetencyEngine
        CompetencyEngine.update_competencies_from_assessment(db, assessment_id, user_id)

        # 2. Subtopic Performance Analysis
        topic_perf = state.get("performance_by_topic", {})
        topic_scores = []
        for tid_str, tp in topic_perf.items():
            tot = tp.get("total", 0)
            corr = tp.get("correct", 0)
            acc = round((corr / tot) * 100.0, 1) if tot > 0 else 0.0
            topic_scores.append({
                "topic_id": int(tid_str),
                "topic_name": tp.get("name", "Subtopic"),
                "competency_id": tp.get("competency_id"),
                "questions_total": tot,
                "questions_correct": corr,
                "score": acc
            })

        # Identify strongest & weakest topics
        topic_scores.sort(key=lambda x: x["score"])
        weakest_topic = topic_scores[0] if topic_scores else None
        strongest_topic = topic_scores[-1] if topic_scores else None

        # 3. Difficulty Performance Breakdown
        diff_perf = state.get("performance_by_difficulty", {})
        diff_summary = {}
        for d_key, label in [("1", "Easy"), ("2", "Medium"), ("3", "Hard")]:
            d_data = diff_perf.get(d_key, {"total": 0, "correct": 0})
            d_tot = d_data.get("total", 0)
            d_corr = d_data.get("correct", 0)
            d_acc = round((d_corr / d_tot) * 100.0, 1) if d_tot > 0 else 0.0
            diff_summary[label] = {
                "total": d_tot,
                "correct": d_corr,
                "accuracy_percent": d_acc
            }

        # 4. Finalize Assessment Record
        overall = round((total_correct / total_questions) * 100.0, 1) if total_questions > 0 else 0.0
        assessment.overall_score = overall
        assessment.status = "completed"
        assessment.completed_at = datetime.utcnow()
        assessment.adaptive_state = state
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(assessment, "adaptive_state")
        db.commit()

        from services.assessment_service import get_assessment_result
        return get_assessment_result(db, assessment_id, user_id)

    @classmethod
    def initialize_material_quiz_session(
        cls,
        db: Session,
        user_id: int,
        material_id: int,
        question_set_id: int,
        question_count: int = 10,
        question_type: str = "MIXED",
        adaptive_mode: bool = True
    ) -> tuple[Assessment, MaterialQuizQuestion]:
        """
        Initializes an adaptive assessment session for personal material quiz.
        Reuses Assessment section initialization: starts at difficulty Level 2 (Medium).
        Supports adaptive_mode toggle (ON/OFF).
        """
        mat = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
        if not mat:
            raise ValueError("Learning material not found")

        q_set = db.query(MaterialQuizQuestionSet).filter(MaterialQuizQuestionSet.id == question_set_id).first()
        if not q_set:
            raise ValueError("Material quiz question set not found")

        adaptive_state = {
            "material_id": material_id,
            "material_quiz_set_id": question_set_id,
            "target_question_count": question_count,
            "question_type": question_type,
            "adaptive_mode": bool(adaptive_mode),
            "current_difficulty": 2,  # Strict Invariant: Always start at Medium (2)
            "streaks": {"correct": 0, "incorrect": 0},
            "answered_count": 0,
            "seen_question_ids": [],
            "answers_history": [],
            "performance_by_difficulty": {
                "1": {"total": 0, "correct": 0},
                "2": {"total": 0, "correct": 0},
                "3": {"total": 0, "correct": 0}
            }
        }

        # Pick first question at Medium difficulty (Level 2) matching Assessment start rule
        first_q = db.query(MaterialQuizQuestion).filter(
            MaterialQuizQuestion.set_id == question_set_id,
            MaterialQuizQuestion.difficulty == "2"
        ).first()

        if not first_q:
            first_q = db.query(MaterialQuizQuestion).filter(
                MaterialQuizQuestion.set_id == question_set_id
            ).first()

        if not first_q:
            raise ValueError("No questions found in this material quiz set")

        adaptive_state["seen_question_ids"].append(first_q.id)

        assessment = Assessment(
            user_id=user_id,
            source_material_id=material_id,
            material_quiz_set_id=question_set_id,
            assessment_type="material_quiz",
            status="in_progress",
            started_at=datetime.utcnow(),
            adaptive_state=adaptive_state
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        return assessment, first_q

    @classmethod
    def process_material_quiz_adaptive_step(
        cls,
        db: Session,
        assessment: Assessment,
        user_id: int,
        question_id: int,
        selected_option_id: int,
        confidence_level: int = 2,
        time_taken_seconds: int = 15
    ) -> Dict[str, Any]:
        """
        Processes adaptive difficulty step for personal material quiz reusing the Assessment engine:
        - Evaluates learner correctness
        - Tracks streaks (consecutive correct / incorrect)
        - Dynamic difficulty adaptation:
          * Step 1: Correct -> Hard (3), Incorrect -> Easy (1)
          * Subsequent: Correct -> min(3, curr+1), Incorrect -> max(1, curr-1)
          * If adaptive_mode is False: keeps sequential delivery without difficulty jump
        - Anti-repetition: guarantees zero duplicate questions in the session
        - Difficulty relaxation hierarchy: if target difficulty is exhausted, relaxes [2, 1] for 3, [2, 3] for 1
        """
        assessment_id = assessment.id
        state = assessment.adaptive_state or {}
        adaptive_mode = state.get("adaptive_mode", True)

        question = db.query(MaterialQuizQuestion).filter(MaterialQuizQuestion.id == question_id).first()
        if not question:
            raise ValueError("Material quiz question not found")

        opt = db.query(MaterialQuizOption).filter(MaterialQuizOption.id == selected_option_id).first()
        is_correct = opt.is_correct if opt else False

        # 1. Record Answer
        ans = AssessmentAnswer(
            assessment_id=assessment_id,
            material_quiz_question_id=question_id,
            selected_material_option_id=selected_option_id,
            confidence_level=confidence_level,
            is_correct=is_correct,
            response_time=time_taken_seconds,
            time_taken_seconds=time_taken_seconds
        )
        db.add(ans)

        # 2. Update Performance by Difficulty
        q_diff_int = cls.normalize_difficulty_int(question.difficulty)
        diff_key = str(q_diff_int)
        if "performance_by_difficulty" not in state:
            state["performance_by_difficulty"] = {"1": {"total": 0, "correct": 0}, "2": {"total": 0, "correct": 0}, "3": {"total": 0, "correct": 0}}
        if diff_key not in state["performance_by_difficulty"]:
            state["performance_by_difficulty"][diff_key] = {"total": 0, "correct": 0}
        state["performance_by_difficulty"][diff_key]["total"] += 1
        if is_correct:
            state["performance_by_difficulty"][diff_key]["correct"] += 1

        # Track history
        if "answers_history" not in state:
            state["answers_history"] = []
        state["answers_history"].append({
            "question_id": question_id,
            "difficulty": q_diff_int,
            "is_correct": is_correct
        })

        # 3. Compute next difficulty reusing Assessment engine methodology
        streaks = state.get("streaks", {"correct": 0, "incorrect": 0})
        curr_diff = state.get("current_difficulty", 2)

        if is_correct:
            new_c_streak = streaks.get("correct", 0) + 1
            new_i_streak = 0
        else:
            new_i_streak = streaks.get("incorrect", 0) + 1
            new_c_streak = 0
        state["streaks"] = {"correct": new_c_streak, "incorrect": new_i_streak}

        if adaptive_mode:
            answers_count = len(state["answers_history"])
            if answers_count == 1:
                # Step 1 adaptation rule from Assessment:
                # Medium + Correct -> Hard (3); Medium + Incorrect -> Easy (1)
                new_diff = 3 if is_correct else 1
            else:
                # Subsequent adaptation rule:
                # Correct -> promote by 1 level; Incorrect -> demote by 1 level
                if is_correct:
                    new_diff = min(3, curr_diff + 1)
                else:
                    new_diff = max(1, curr_diff - 1)
        else:
            # Fixed difficulty mode (adaptive calibration disabled)
            new_diff = curr_diff

        state["current_difficulty"] = new_diff

        # Update progress counters
        state["answered_count"] = state.get("answered_count", 0) + 1
        if "seen_question_ids" not in state:
            state["seen_question_ids"] = []
        if question_id not in state["seen_question_ids"]:
            state["seen_question_ids"].append(question_id)

        # 4. Check Completion Condition
        target_count = state.get("target_question_count", 10)
        if state["answered_count"] >= target_count:
            from sqlalchemy.orm.attributes import flag_modified
            assessment.adaptive_state = state
            assessment.status = "completed"
            assessment.completed_at = datetime.utcnow()
            flag_modified(assessment, "adaptive_state")

            all_ans = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).all()
            corr = sum(1 for a in all_ans if a.is_correct)
            assessment.overall_score = round((corr / len(all_ans)) * 100.0, 1) if all_ans else 0.0

            # Update competencies via CompetencyEngine
            from services.competency_engine import CompetencyEngine
            CompetencyEngine.update_competencies_from_assessment(db, assessment_id, user_id)

            db.commit()

            from services.assessment_service import get_assessment_result
            final_result = get_assessment_result(db, assessment_id, user_id)
            return {
                "is_completed": True,
                "assessment_id": assessment_id,
                "feedback": {"is_correct": is_correct},
                "result": final_result
            }

        # 5. Choose Next Question from Session Pool with Assessment relaxation hierarchy
        set_id = assessment.material_quiz_set_id
        seen_ids = state["seen_question_ids"]

        # Exact difficulty match
        next_q = db.query(MaterialQuizQuestion).filter(
            MaterialQuizQuestion.set_id == set_id,
            MaterialQuizQuestion.difficulty == str(new_diff),
            MaterialQuizQuestion.id.not_in(seen_ids)
        ).first()

        # Relaxation hierarchy matching Assessment select_adaptive_question
        if not next_q:
            if new_diff == 3:
                fallback_diffs = [2, 1]
            elif new_diff == 1:
                fallback_diffs = [2, 3]
            else:
                fallback_diffs = [3, 1]

            for alt_d in fallback_diffs:
                next_q = db.query(MaterialQuizQuestion).filter(
                    MaterialQuizQuestion.set_id == set_id,
                    MaterialQuizQuestion.difficulty == str(alt_d),
                    MaterialQuizQuestion.id.not_in(seen_ids)
                ).first()
                if next_q:
                    break

        # Fallback 2: Any unseen in set
        if not next_q:
            next_q = db.query(MaterialQuizQuestion).filter(
                MaterialQuizQuestion.set_id == set_id,
                MaterialQuizQuestion.id.not_in(seen_ids)
            ).first()

        if next_q:
            state["seen_question_ids"].append(next_q.id)
            from sqlalchemy.orm.attributes import flag_modified
            assessment.adaptive_state = state
            flag_modified(assessment, "adaptive_state")
            db.commit()

            opts = []
            for o in sorted(next_q.options, key=lambda x: x.order):
                opts.append({
                    "id": o.id,
                    "text": o.text,
                    "order": o.order
                })

            c_name = next_q.material.title if next_q.material else "Material Study"
            return {
                "is_completed": False,
                "step": state["answered_count"] + 1,
                "total_steps": target_count,
                "feedback": {"is_correct": is_correct},
                "next_question": {
                    "id": next_q.id,
                    "text": next_q.question_text,
                    "question_text": next_q.question_text,
                    "question_type": next_q.question_type,
                    "difficulty": next_q.difficulty,
                    "cognitive_level": next_q.cognitive_level,
                    "competency_id": None,
                    "competency_name": c_name,
                    "options": opts
                }
            }
        else:
            # Pool exhausted -> finalize
            from sqlalchemy.orm.attributes import flag_modified
            assessment.adaptive_state = state
            assessment.status = "completed"
            assessment.completed_at = datetime.utcnow()
            flag_modified(assessment, "adaptive_state")

            all_ans = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).all()
            corr = sum(1 for a in all_ans if a.is_correct)
            assessment.overall_score = round((corr / len(all_ans)) * 100.0, 1) if all_ans else 0.0
            db.commit()

            from services.assessment_service import get_assessment_result
            final_result = get_assessment_result(db, assessment_id, user_id)
            return {
                "is_completed": True,
                "assessment_id": assessment_id,
                "result": final_result
            }
