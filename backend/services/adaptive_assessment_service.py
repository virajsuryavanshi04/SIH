from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import random

from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
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
        target_question_count: int = 10
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

        first_cid = comp_ids[0]
        first_topics = [t.id for t in topics if t.competency_id == first_cid]
        first_tid = first_topics[0] if first_topics else None

        state = {
            "competency_ids": comp_ids,
            "per_competency_difficulty": per_comp_diff,
            "per_topic_difficulty": per_topic_diff,
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
            "current_difficulty": per_comp_diff.get(str(first_cid), 2),
            "answered_count": 0,
            "target_question_count": max(len(comp_ids), target_question_count),
            "seen_question_ids": []
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
        Calculates adapted difficulty following the graduated streak rules:
        - 2 consecutive correct answers: difficulty + 1 (capped at 3/Hard)
        - 2 consecutive incorrect answers: difficulty - 1 (floored at 1/Easy)
        - Never jumps directly Easy <-> Hard.
        Returns: (new_difficulty, new_correct_streak, new_incorrect_streak)
        """
        new_diff = current_diff

        if is_correct:
            c_streak = correct_streak + 1
            i_streak = 0
            if c_streak >= 2:
                if new_diff < 3:
                    new_diff = new_diff + 1
                c_streak = 0  # Reset streak after promotion
        else:
            i_streak = incorrect_streak + 1
            c_streak = 0
            if i_streak >= 2:
                if new_diff > 1:
                    new_diff = new_diff - 1
                i_streak = 0  # Reset streak after demotion

        # Bounds safety
        new_diff = max(1, min(3, new_diff))
        return new_diff, c_streak, i_streak

    @classmethod
    def select_adaptive_question(
        cls, 
        db: Session, 
        user_id: int, 
        competency_id: int, 
        topic_id: Optional[int], 
        difficulty: int, 
        excluded_ids: List[int]
    ) -> Tuple[Optional[Question], bool]:
        """
        Finds a validated question matching competency, topic, and difficulty while avoiding seen questions.
        Returns: (Question | None, question_generation_required: bool)
        """
        # Fetch user's persistent seen questions history
        hist = db.query(UserQuestionHistory.question_id).filter(UserQuestionHistory.user_id == user_id).all()
        user_seen = {h[0] for h in hist}
        all_excluded = set(excluded_ids).union(user_seen)

        diff_aliases = cls.difficulty_str_list(difficulty)

        # 1. Exact Topic + Difficulty Match
        if topic_id:
            query = db.query(Question).filter(
                Question.competency_id == competency_id,
                Question.topic_id == topic_id,
                Question.difficulty.in_(diff_aliases),
                Question.status == "approved"
            )
            if all_excluded:
                query = query.filter(Question.id.not_in(all_excluded))
            candidate = query.first()
            if candidate:
                return candidate, False

        # 2. Competency + Difficulty Match (across other subtopics in same competency)
        query = db.query(Question).filter(
            Question.competency_id == competency_id,
            Question.difficulty.in_(diff_aliases),
            Question.status == "approved"
        )
        if all_excluded:
            query = query.filter(Question.id.not_in(all_excluded))
        candidate = query.first()
        if candidate:
            return candidate, False

        # 3. Adjacent Difficulty Match (Tolerance fallback)
        adjacent_diffs = [difficulty - 1, difficulty + 1]
        for adj_d in adjacent_diffs:
            if 1 <= adj_d <= 3:
                adj_aliases = cls.difficulty_str_list(adj_d)
                query = db.query(Question).filter(
                    Question.competency_id == competency_id,
                    Question.difficulty.in_(adj_aliases),
                    Question.status == "approved"
                )
                if all_excluded:
                    query = query.filter(Question.id.not_in(all_excluded))
                candidate = query.first()
                if candidate:
                    return candidate, False

        # 4. Fallback: Any unseen approved question in competency
        query = db.query(Question).filter(
            Question.competency_id == competency_id,
            Question.status == "approved"
        )
        if all_excluded:
            query = query.filter(Question.id.not_in(all_excluded))
        candidate = query.first()
        if candidate:
            return candidate, False

        # 5. On-the-fly Source-Grounded Question Generation via AIService
        try:
            from ai.service import AIService
            comp_obj = db.query(Competency).filter(Competency.id == competency_id).first()
            if comp_obj:
                top_obj = db.query(CompetencyTopic).filter(CompetencyTopic.id == topic_id).first() if topic_id else None
                c_name = comp_obj.name
                t_name = top_obj.name if top_obj else "Statistical Analysis"
                
                generated_data = AIService().generate_question(
                    competency_name=c_name,
                    topic_name=t_name,
                    difficulty=str(difficulty)
                )
                
                if generated_data:
                    new_q = AIService.validate_and_store_question(
                        db=db,
                        q_data=generated_data,
                        competency_id=competency_id,
                        topic_id=topic_id,
                        created_by_user_id=user_id
                    )
                    if new_q:
                        return new_q, False
        except Exception:
            pass

        # 6. Fallback if generation is unavailable
        return None, True

    @classmethod
    def choose_next_target(
        cls, 
        db: Session, 
        state: Dict[str, Any]
    ) -> Tuple[int, Optional[int], int]:
        """
        Determines next competency and subtopic to evaluate.
        Prioritizes weak subtopics (accuracy < 60%) or cycles evenly across role competencies.
        Returns: (next_competency_id, next_topic_id, next_difficulty)
        """
        comp_ids = state["competency_ids"]
        perf_topics = state.get("performance_by_topic", {})

        # 1. Check if any tested subtopic has low performance (< 60%) and needs further probing
        weak_topics = []
        for tid_str, p in perf_topics.items():
            tot = p.get("total", 0)
            corr = p.get("correct", 0)
            if tot > 0:
                acc = (corr / tot) * 100.0
                if acc < 60.0:
                    weak_topics.append((int(tid_str), p.get("competency_id"), acc))

        # Sort weak topics by lowest accuracy first
        if weak_topics:
            weak_topics.sort(key=lambda x: x[2])
            target_tid, target_cid, _ = weak_topics[0]
            target_diff = state["per_topic_difficulty"].get(str(target_tid), state["per_competency_difficulty"].get(str(target_cid), 2))
            return target_cid, target_tid, target_diff

        # 2. Cycle to next competency
        answered = state.get("answered_count", 0)
        next_cid = comp_ids[answered % len(comp_ids)]
        
        # Pick an unprobed topic in this competency if available
        topics = db.query(CompetencyTopic).filter(CompetencyTopic.competency_id == next_cid).all()
        tested_tids = {int(k) for k in perf_topics.keys()}
        untested = [t.id for t in topics if t.id not in tested_tids]

        next_tid = untested[0] if untested else (topics[0].id if topics else None)
        next_diff = state["per_competency_difficulty"].get(str(next_cid), 2)

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

        state = assessment.adaptive_state or cls.initialize_adaptive_state(db, assessment.user)

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

        # 3. Update Adaptive State Streaks & Per-Topic Performance
        cid_str = str(question.competency_id)
        tid_str = str(question.topic_id) if question.topic_id else None
        q_diff_int = cls.normalize_difficulty_int(question.difficulty)

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

        # Update progress counters
        state["answered_count"] += 1
        if question_id not in state["seen_question_ids"]:
            state["seen_question_ids"].append(question_id)

        # 4. Check Completion Condition
        target_count = state.get("target_question_count", 10)
        if state["answered_count"] >= target_count:
            assessment.adaptive_state = state
            db.commit()
            final_result = cls.finalize_adaptive_assessment(db, assessment_id, user_id)
            return {
                "is_completed": True,
                "assessment_id": assessment_id,
                "result": final_result
            }

        # 5. Determine Next Question Target
        next_cid, next_tid, next_diff = cls.choose_next_target(db, state)
        next_q, gen_required = cls.select_adaptive_question(
            db, user_id, next_cid, next_tid, next_diff, state["seen_question_ids"]
        )

        state["current_competency_id"] = next_cid
        state["current_topic_id"] = next_tid
        state["current_difficulty"] = next_diff
        assessment.adaptive_state = state
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

        comp_breakdown = []
        for cid, g in comp_groups.items():
            acc = round((g["correct"] / g["total"]) * 100.0, 1) if g["total"] > 0 else 0.0
            target = role_targets.get(cid, 70.0)
            gap = max(0.0, target - acc)

            if acc >= target:
                status = "strong"
            elif acc >= target - 10:
                status = "on_track"
            elif gap > 20:
                status = "critical_gap"
            else:
                status = "needs_attention"

            # Update UserCompetency live state
            uc = db.query(UserCompetency).filter(
                UserCompetency.user_id == user_id,
                UserCompetency.competency_id == cid
            ).first()
            if uc:
                uc.current_score = acc
                uc.target_score = target
                uc.status = status
                uc.last_assessed = datetime.utcnow()
            else:
                uc = UserCompetency(
                    user_id=user_id,
                    competency_id=cid,
                    current_score=acc,
                    target_score=target,
                    confidence=85.0,
                    status=status,
                    last_assessed=datetime.utcnow()
                )
                db.add(uc)

            # Record immutable CompetencyScore history
            cs = CompetencyScore(
                user_id=user_id,
                competency_id=cid,
                score=acc,
                assessment_id=assessment_id,
                source=assessment.assessment_type or "adaptive",
                assessed_at=datetime.utcnow()
            )
            db.add(cs)

            comp_breakdown.append({
                "competency_id": cid,
                "competency_name": g["competency_name"],
                "domain": g["domain"],
                "current_score": acc,
                "target_score": target,
                "gap": gap,
                "status": status,
                "questions_total": g["total"],
                "questions_correct": g["correct"],
                "accuracy_percent": acc
            })

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
        db.commit()

        return {
            "assessment_id": assessment_id,
            "overall_readiness": overall,
            "overall_score": overall,
            "total_questions": total_questions,
            "total_correct": total_correct,
            "competency_breakdown": comp_breakdown,
            "topic_scores": topic_scores,
            "difficulty_performance": diff_summary,
            "strongest_topic": strongest_topic,
            "weakest_topic": weakest_topic,
            "message": "Adaptive assessment completed successfully."
        }
