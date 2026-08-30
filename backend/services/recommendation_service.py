from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

Tuple_Result = Dict[str, Any]

from models.course import Course, CourseCompetency
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.material import LearningMaterial, MaterialNote, MaterialFlashcardDeck, MaterialMindMap, MaterialQuizQuestionSet
from models.recommendation import AIDiagnosis, AIRecommendation
from models.assessment import Assessment
from models.user import User
from models.user_competency import UserCompetency, CompetencyScore
from services.competency_service import get_user_detailed_competencies, get_user_ranked_gaps
from services.igot_service import get_learning_resource_provider

class RecommendationService:
    """
    Explainable Weighted Recommendation Engine.
    Ranks learning resources based on:
    - 40% Competency Gap Relevance
    - 25% Role Relevance
    - 20% Subtopic Direct Match
    - 10% Difficulty Suitability
    - 5% Duration Suitability
    """

    # Configurable Scoring Weights
    GAP_WEIGHT = 0.40
    ROLE_WEIGHT = 0.25
    TOPIC_MATCH_WEIGHT = 0.20
    DIFFICULTY_WEIGHT = 0.10
    DURATION_WEIGHT = 0.05

    @classmethod
    def calculate_recommendation_score(
        cls, 
        course: Course, 
        user: User, 
        user_competencies: List[Dict[str, Any]],
        role_comp_ids: List[int]
    ) -> Dict[str, Any]:
        """
        Calculates a deterministic 0-100 match score and generates a transparent explanation.
        """
        # Find user competency state matching the course's primary competency
        comp_state = next((c for c in user_competencies if c["competency_id"] == course.competency_id), None)
        
        # 1. Competency Gap Relevance (Max 40 points)
        gap_score = 0.0
        gap_val = 0.0
        comp_name = comp_state["competency_name"] if comp_state else "Official Competency"
        weakest_topic_name = comp_state.get("weakest_subtopic") if comp_state else None
        
        if comp_state:
            curr_score = comp_state.get("current_score")
            target_score = comp_state.get("target_score", 70.0)
            if curr_score is not None:
                gap_val = max(0.0, target_score - curr_score)
            else:
                gap_val = target_score  # Unassessed has high priority gap
            
            # Scaled to 40 points (gap of 40+ points gets max 40)
            gap_score = min(40.0, (gap_val / 40.0) * 40.0)
        else:
            gap_score = 5.0  # General elective

        # 2. Role Relevance (Max 25 points)
        role_score = 0.0
        is_role_required = course.competency_id in role_comp_ids
        if is_role_required:
            role_score = 25.0
        elif comp_state:
            role_score = 15.0
        else:
            role_score = 5.0

        # 3. Subtopic Direct Match (Max 20 points)
        topic_score = 0.0
        is_weak_topic_match = False
        
        if comp_state and course.topic_id:
            # Check if course topic matches the user's weakest subtopic
            course_topic = comp_state.get("subtopics", [])
            matching_subtopic = next((st for st in course_topic if st["topic_id"] == course.topic_id), None)
            
            if matching_subtopic and matching_subtopic.get("status") == "weak":
                topic_score = 20.0
                is_weak_topic_match = True
            elif matching_subtopic:
                topic_score = 14.0
            else:
                topic_score = 10.0
        elif comp_state:
            topic_score = 12.0
        else:
            topic_score = 4.0

        # 4. Difficulty Suitability (Max 10 points)
        diff_score = 0.0
        user_curr = comp_state.get("current_score") if comp_state else None
        c_diff = (course.difficulty or "intermediate").lower()
        
        if user_curr is None or user_curr < 50.0:
            # Beginner / foundational is best match
            diff_score = 10.0 if c_diff in ("beginner", "1", "easy", "foundational") else (6.0 if c_diff in ("intermediate", "2") else 2.0)
        elif user_curr <= 75.0:
            # Intermediate is best match
            diff_score = 10.0 if c_diff in ("intermediate", "2", "applied") else (7.0 if c_diff in ("beginner", "1") else 6.0)
        else:
            # Advanced is best match
            diff_score = 10.0 if c_diff in ("advanced", "3", "policy") else (7.0 if c_diff in ("intermediate", "2") else 4.0)

        # 5. Duration Suitability (Max 5 points)
        dur_score = 0.0
        hours = course.duration_hours or 2.0
        if hours <= 3.0:
            dur_score = 5.0  # Modular / microlearning preferred
        elif hours <= 8.0:
            dur_score = 4.0
        else:
            dur_score = 3.0

        total_match_percent = round(gap_score + role_score + topic_score + diff_score + dur_score, 1)
        total_match_percent = min(99.0, max(15.0, total_match_percent))

        # Generate Transparent Explanation
        explanation_parts = []
        if is_role_required and gap_val > 0:
            explanation_parts.append(f"Recommended because {comp_name} is a required role competency with an active gap (-{round(gap_val, 1)}%)")
        elif is_role_required:
            explanation_parts.append(f"Recommended for continuous reinforcement of official {comp_name} benchmarks")
        else:
            explanation_parts.append(f"Recommended for broadening statistical capability in {comp_name}")

        if is_weak_topic_match and weakest_topic_name:
            explanation_parts.append(f"and this module directly addresses your identified weak subtopic ({weakest_topic_name})")
        elif course.topic:
            explanation_parts.append(f"covering {course.topic.name}")

        explanation = " ".join(explanation_parts) + "."

        return {
            "match_percent": total_match_percent,
            "explanation": explanation,
            "components": {
                "gap_relevance": round(gap_score, 1),
                "role_relevance": round(role_score, 1),
                "subtopic_match": round(topic_score, 1),
                "difficulty_suitability": round(diff_score, 1),
                "duration_suitability": round(dur_score, 1)
            }
        }

    @classmethod
    def get_personalized_recommendations(cls, db: Session, user: User, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieves all candidate courses from the LearningResourceProvider,
        evaluates explainable recommendation scoring, and returns ranked recommendations.
        """
        provider = get_learning_resource_provider()
        candidate_courses = provider.get_courses(db, limit=100)

        user_competencies = get_user_detailed_competencies(db, user)
        role_comp_ids = [c["competency_id"] for c in user_competencies]

        # Fetch user's enrolled progress
        user_progress = db.query(LearningProgress).filter(LearningProgress.user_id == user.id).all()
        progress_map = {p.course_id: p for p in user_progress if p.course_id}

        recommendations = []
        for course in candidate_courses:
            score_data = cls.calculate_recommendation_score(course, user, user_competencies, role_comp_ids)
            
            prog = progress_map.get(course.id)
            status = prog.status if prog else "not_started"
            progress_pct = prog.progress_percent if prog else 0.0

            # Attach competency details
            c_comp_name = course.topic.competency.name if (course.topic and course.topic.competency) else (
                next((c["competency_name"] for c in user_competencies if c["competency_id"] == course.competency_id), "Official Statistical Standard")
            )

            recommendations.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "provider": course.provider or "iGOT Karmayogi",
                "resource_type": course.resource_type or "igot_course",
                "difficulty": course.difficulty,
                "duration_hours": course.duration_hours,
                "language": course.language or "English",
                "thumbnail_url": course.thumbnail_url,
                "content_url": course.content_url or course.url,
                "competency_id": course.competency_id,
                "competency_name": c_comp_name,
                "topic_id": course.topic_id,
                "topic_name": course.topic.name if course.topic else None,
                "match_percent": score_data["match_percent"],
                "match_score": score_data["match_percent"],
                "explanation": score_data["explanation"],
                "recommendation_reasons": [score_data["explanation"]],
                "score_components": score_data["components"],
                "progress_status": status,
                "progress_percent": progress_pct,
                "is_enrolled": prog is not None
            })

        # Rank by match_percent descending (putting in_progress on high visibility)
        return sorted(recommendations, key=lambda x: (x["progress_status"] == "in_progress", x["match_percent"]), reverse=True)[:limit]


    @classmethod
    def get_next_learning_action(cls, db: Session, user: User) -> Dict[str, Any]:
        """
        Calculates the single most useful personalized next learning action based on:
        1. Active in-progress learning path milestones (CONTINUE_LEARNING)
        2. Real competency performance & deficit gap analysis (70% standard benchmark)
        3. Available learner-owned completed learning materials & study content (Notes, Flashcards, Mind Map, Quiz)
        4. Official / iGOT course recommendations matching the gap
        5. Assessment recency / baseline diagnostic needs
        """
        detailed = get_user_detailed_competencies(db, user)
        gaps = get_user_ranked_gaps(db, user)

        # -------------------------------------------------------------
        # 1. ACTIVE IN-PROGRESS LEARNING PATH MILESTONE (CONTINUE_LEARNING)
        # -------------------------------------------------------------
        active_path = db.query(LearningPath).filter(
            LearningPath.user_id == user.id,
            LearningPath.is_active == True
        ).first()

        if active_path:
            active_item = db.query(LearningPathItem).filter(
                LearningPathItem.learning_path_id == active_path.id,
                LearningPathItem.status.in_(["current", "in_progress"])
            ).order_by(LearningPathItem.order.asc()).first()

            if active_item:
                comp = db.query(Competency).filter(Competency.id == active_item.competency_id).first() if active_item.competency_id else None
                comp_name = comp.name if comp else "Official Curriculum"
                comp_detail = next((c for c in detailed if c["competency_id"] == active_item.competency_id), None)

                return {
                    "action_type": "CONTINUE_LEARNING",
                    "priority": "HIGH",
                    "title": f"Continue: {active_item.title}",
                    "reason": f"You have an active in-progress milestone in your {comp_name} learning path.",
                    "competency_id": active_item.competency_id,
                    "competency_name": comp_name,
                    "topic_id": None,
                    "topic_name": None,
                    "current_score": comp_detail["current_score"] if comp_detail else None,
                    "target_score": comp_detail["target_score"] if comp_detail else 70.0,
                    "gap": comp_detail["gap"] if comp_detail else None,
                    "resource": {
                        "type": "learning_path_item",
                        "id": active_item.id,
                        "title": active_item.title,
                        "metadata": {
                            "learning_path_id": active_path.id,
                            "item_order": active_item.order,
                            "item_type": active_item.item_type,
                            "reference_id": active_item.reference_id
                        }
                    },
                    "next_step": {
                        "type": "PATH",
                        "label": "Continue Learning Milestone",
                        "route": "/learning-path",
                        "metadata": {"path_id": active_path.id, "item_id": active_item.id}
                    }
                }

        # Count completed assessments
        completed_assessments_count = db.query(Assessment).filter(
            Assessment.user_id == user.id,
            Assessment.completed_at.isnot(None)
        ).count()

        # -------------------------------------------------------------
        # 2. EMPTY STATE / UNASSESSED LEARNER
        # -------------------------------------------------------------
        if completed_assessments_count == 0 or not detailed or all(c.get("current_score") is None for c in detailed):
            return {
                "action_type": "ASSESSMENT",
                "priority": "HIGH",
                "title": "Take Baseline Assessment",
                "reason": "Complete your initial diagnostic assessment to establish verified competency benchmarks for your role.",
                "competency_id": None,
                "competency_name": None,
                "topic_id": None,
                "topic_name": None,
                "current_score": None,
                "target_score": 70.0,
                "gap": None,
                "resource": {
                    "type": "assessment",
                    "id": None,
                    "title": "Role Benchmark Diagnostic Assessment",
                    "metadata": {"type": "baseline"}
                },
                "next_step": {
                    "type": "ASSESSMENT",
                    "label": "Take Baseline Assessment",
                    "route": "/assessment",
                    "metadata": {}
                }
            }

        # -------------------------------------------------------------
        # 3. CRITICAL COMPETENCY DEFICIT GAP
        # -------------------------------------------------------------
        deficit_gaps = [g for g in gaps if (g.get("gap") or 0.0) > 0]
        top_gap = deficit_gaps[0] if deficit_gaps else None

        if top_gap:
            target_comp_id = top_gap["competency_id"]
            target_comp_name = top_gap["competency_name"]
            curr_score = top_gap["current_score"]
            target_score = top_gap["target_score"]
            gap_val = top_gap["gap"]
            weak_topic_name = top_gap.get("weakest_subtopic")

            # Check recent AIDiagnosis
            diag = db.query(AIDiagnosis).filter(
                AIDiagnosis.user_id == user.id,
                AIDiagnosis.competency_id == target_comp_id
            ).order_by(AIDiagnosis.created_at.desc()).first()

            if diag and not weak_topic_name:
                weak_topic_name = diag.primary_gap

            # Check if learner has completed a measurable learning action (e.g. material quiz) since the last official score for this competency
            latest_comp_score_rec = db.query(CompetencyScore).filter(
                CompetencyScore.user_id == user.id,
                CompetencyScore.competency_id == target_comp_id
            ).order_by(CompetencyScore.assessed_at.desc()).first()

            recent_completed_quiz = None
            if latest_comp_score_rec:
                recent_completed_quiz = db.query(Assessment).join(
                    LearningMaterial, Assessment.source_material_id == LearningMaterial.id
                ).filter(
                    Assessment.user_id == user.id,
                    Assessment.assessment_type == "material_quiz",
                    Assessment.status == "completed",
                    Assessment.completed_at > latest_comp_score_rec.assessed_at,
                    LearningMaterial.competency_id == target_comp_id
                ).first()

            if recent_completed_quiz:
                return {
                    "action_type": "REASSESSMENT",
                    "priority": "HIGH",
                    "title": f"Reassess {target_comp_name}",
                    "reason": f"You completed practical study for {target_comp_name}. Take a targeted 10-question reassessment to measure your competency score improvement against your {target_score}% target.",
                    "competency_id": target_comp_id,
                    "competency_name": target_comp_name,
                    "topic_id": None,
                    "topic_name": None,
                    "current_score": curr_score,
                    "target_score": target_score,
                    "gap": gap_val,
                    "resource": {
                        "type": "assessment",
                        "id": None,
                        "title": f"Targeted Reassessment: {target_comp_name}",
                        "metadata": {"assessment_type": "adaptive_reassessment", "competency_id": target_comp_id}
                    },
                    "next_step": {
                        "type": "REASSESSMENT",
                        "label": "Launch Targeted Reassessment",
                        "route": f"/assessment?reassess=true&competencyId={target_comp_id}",
                        "metadata": {"competency_id": target_comp_id}
                    }
                }

            # Query learner-owned completed materials
            user_materials = db.query(LearningMaterial).filter(
                LearningMaterial.uploaded_by == user.id,
                LearningMaterial.processing_status == "completed"
            ).all()

            # Match material
            matching_mat = None
            for mat in user_materials:
                if mat.material_scope == "OFFICIAL_COMPETENCY" and mat.competency_id == target_comp_id:
                    matching_mat = mat
                    # Perfect topic match
                    if weak_topic_name and mat.topic and mat.topic.name.lower() in weak_topic_name.lower():
                        break
                elif mat.material_scope == "OTHER_LEARNING":
                    # Only match if extracted_text has strong verified semantic evidence
                    text_lower = (mat.extracted_text or "").lower()
                    if target_comp_name.lower() in text_lower or (weak_topic_name and weak_topic_name.lower() in text_lower):
                        if not matching_mat:
                            matching_mat = mat

            # If matching material exists, inspect available Phase 5B / 5C study content
            if matching_mat:
                notes = db.query(MaterialNote).filter(MaterialNote.material_id == matching_mat.id).first()
                deck = db.query(MaterialFlashcardDeck).filter(
                    MaterialFlashcardDeck.material_id == matching_mat.id,
                    MaterialFlashcardDeck.status == "ready"
                ).first()
                mind_map = db.query(MaterialMindMap).filter(MaterialMindMap.material_id == matching_mat.id).first()
                quiz_set = db.query(MaterialQuizQuestionSet).filter(
                    MaterialQuizQuestionSet.material_id == matching_mat.id,
                    MaterialQuizQuestionSet.status == "ready"
                ).first()

                # Determine best action from available evidence
                if quiz_set:
                    action_type = "MATERIAL_QUIZ"
                    step_type = "QUIZ"
                    step_label = "Take Material Quiz"
                    route = f"/materials?materialId={matching_mat.id}&action=quiz"
                    reason = f"Your {target_comp_name} score is {curr_score}%, below your {target_score}% target. Practice with an adaptive quiz generated from '{matching_mat.title}' to test your recall."
                elif deck:
                    action_type = "FLASHCARDS"
                    step_type = "FLASHCARDS"
                    step_label = "Practice Flashcards"
                    route = f"/materials?materialId={matching_mat.id}&tab=flashcards"
                    reason = f"Your {target_comp_name} score is {curr_score}%, below your {target_score}% target. Practice active recall with flashcards from '{matching_mat.title}'."
                elif notes:
                    action_type = "STUDY_MATERIAL"
                    step_type = "NOTES"
                    step_label = "Study Short Notes"
                    route = f"/materials?materialId={matching_mat.id}&tab=notes"
                    reason = f"Your {target_comp_name} score is {curr_score}%, below your {target_score}% target. Reviewing your uploaded material notes for '{matching_mat.title}' will reinforce core concepts."
                elif mind_map:
                    action_type = "MIND_MAP"
                    step_type = "MIND_MAP"
                    step_label = "Review Mind Map"
                    route = f"/materials?materialId={matching_mat.id}&tab=mindmap"
                    reason = f"Your {target_comp_name} score is {curr_score}%, below your {target_score}% target. Inspect the concept hierarchy in '{matching_mat.title}' to clarify relationships."
                else:
                    action_type = "STUDY_MATERIAL"
                    step_type = "NOTES"
                    step_label = "Study Material"
                    route = f"/materials?materialId={matching_mat.id}"
                    reason = f"Your {target_comp_name} score is {curr_score}%, below your {target_score}% target. Study your uploaded resource '{matching_mat.title}'."

                # For OTHER_LEARNING materials, do NOT fabricate competency associations
                mat_comp_id = matching_mat.competency_id if matching_mat.material_scope == "OFFICIAL_COMPETENCY" else None
                mat_comp_name = target_comp_name if matching_mat.material_scope == "OFFICIAL_COMPETENCY" else None
                mat_topic_id = matching_mat.topic_id if matching_mat.material_scope == "OFFICIAL_COMPETENCY" else None
                mat_topic_name = matching_mat.topic.name if (matching_mat.material_scope == "OFFICIAL_COMPETENCY" and matching_mat.topic) else None

                return {
                    "action_type": action_type,
                    "priority": "HIGH" if gap_val > 15.0 else "MEDIUM",
                    "title": f"Review {weak_topic_name or target_comp_name}",
                    "reason": reason,
                    "competency_id": mat_comp_id,
                    "competency_name": mat_comp_name,
                    "topic_id": mat_topic_id,
                    "topic_name": mat_topic_name,
                    "current_score": curr_score,
                    "target_score": target_score,
                    "gap": gap_val,
                    "resource": {
                        "type": "material",
                        "id": matching_mat.id,
                        "title": matching_mat.title,
                        "metadata": {
                            "material_scope": matching_mat.material_scope,
                            "file_type": matching_mat.file_type,
                            "has_notes": notes is not None,
                            "has_flashcards": deck is not None,
                            "has_mind_map": mind_map is not None,
                            "has_quiz": quiz_set is not None
                        }
                    },
                    "next_step": {
                        "type": step_type,
                        "label": step_label,
                        "route": route,
                        "metadata": {"material_id": matching_mat.id}
                    }
                }

            # If no matching material, check official / iGOT course recommendations
            recs = cls.get_personalized_recommendations(db, user, limit=6)
            matching_course = next((r for r in recs if r["competency_id"] == target_comp_id), None)
            if not matching_course and recs:
                matching_course = recs[0]

            if matching_course:
                return {
                    "action_type": "COURSE",
                    "priority": "HIGH" if gap_val > 15.0 else "MEDIUM",
                    "title": f"Study: {matching_course['title']}",
                    "reason": f"Your {target_comp_name} score is {curr_score}%, below your {target_score}% target. {matching_course['explanation']}",
                    "competency_id": matching_course["competency_id"],
                    "competency_name": target_comp_name,
                    "topic_id": matching_course.get("topic_id"),
                    "topic_name": matching_course.get("topic_name"),
                    "current_score": curr_score,
                    "target_score": target_score,
                    "gap": gap_val,
                    "resource": {
                        "type": "course",
                        "id": matching_course["id"],
                        "title": matching_course["title"],
                        "metadata": {
                            "provider": matching_course.get("provider", "iGOT Karmayogi"),
                            "duration_hours": matching_course.get("duration_hours", 2.0),
                            "difficulty": matching_course.get("difficulty", "intermediate"),
                            "match_percent": matching_course.get("match_percent", 85.0)
                        }
                    },
                    "next_step": {
                        "type": "COURSE",
                        "label": "Launch Recommended Course",
                        "route": "/courses",
                        "metadata": {"course_id": matching_course["id"]}
                    }
                }

        # -------------------------------------------------------------
        # 4. ALL COMPETENCIES PROFICIENT (>= 70%)
        # -------------------------------------------------------------
        # Check if user has uploaded materials for reinforcement
        user_mats = db.query(LearningMaterial).filter(
            LearningMaterial.uploaded_by == user.id,
            LearningMaterial.processing_status == "completed"
        ).all()

        if user_mats:
            mat = user_mats[0]
            return {
                "action_type": "MATERIAL_QUIZ",
                "priority": "LOW",
                "title": f"Practice {mat.title}",
                "reason": "All official competency benchmarks are met. Reinforce your practical mastery with an adaptive material quiz.",
                "competency_id": mat.competency_id,
                "competency_name": mat.competency.name if mat.competency else None,
                "topic_id": mat.topic_id,
                "topic_name": mat.topic.name if mat.topic else None,
                "current_score": 100.0,
                "target_score": 70.0,
                "gap": 0.0,
                "resource": {
                    "type": "material",
                    "id": mat.id,
                    "title": mat.title,
                    "metadata": {"material_scope": mat.material_scope}
                },
                "next_step": {
                    "type": "QUIZ",
                    "label": "Take Material Quiz",
                    "route": f"/materials?materialId={mat.id}&action=quiz",
                    "metadata": {"material_id": mat.id}
                }
            }

        return {
            "action_type": "ASSESSMENT",
            "priority": "LOW",
            "title": "Maintain Proficiency Pulse Check",
            "reason": "All official competency benchmarks are met. Take a periodic pulse check assessment to maintain your verified readiness score.",
            "competency_id": None,
            "competency_name": None,
            "topic_id": None,
            "topic_name": None,
            "current_score": None,
            "target_score": 70.0,
            "gap": 0.0,
            "resource": {
                "type": "assessment",
                "id": None,
                "title": "Role Benchmark Pulse Check Assessment",
                "metadata": {"type": "pulse_check"}
            },
            "next_step": {
                "type": "ASSESSMENT",
                "label": "Take Pulse Check Assessment",
                "route": "/assessment",
                "metadata": {}
            }
        }

    @classmethod
    def generate_learning_path(cls, db: Session, user: User) -> LearningPath:
        """
        Generates an ordered sequential learning path designed to close active competency gaps.
        """
        # Archive any previous path
        db.query(LearningPath).filter(LearningPath.user_id == user.id, LearningPath.is_active == True).update({"is_active": False})
        db.commit()

        recs = cls.get_personalized_recommendations(db, user, limit=6)
        
        path = LearningPath(
            user_id=user.id,
            is_active=True,
            ai_reasoning="Personalized iGOT curriculum sequenced to systematically close your highest priority competency gaps."
        )
        db.add(path)
        db.flush()

        for idx, rec in enumerate(recs):
            item = LearningPathItem(
                learning_path_id=path.id,
                title=rec["title"],
                description=rec["explanation"],
                item_type=rec["resource_type"],
                reference_id=rec["id"],
                competency_id=rec["competency_id"],
                order=idx + 1,
                status="current" if idx == 0 else "recommended",
                estimated_duration=f"{rec['duration_hours']}h",
                difficulty=rec["difficulty"]
            )
            db.add(item)

        db.commit()
        db.refresh(path)
        return path

# Legacy helper
def recommend_courses(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    return RecommendationService.get_personalized_recommendations(db, user)

def generate_learning_path(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    return RecommendationService.generate_learning_path(db, user)
