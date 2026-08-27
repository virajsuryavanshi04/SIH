from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from models.course import Course, CourseCompetency
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.user import User
from models.user_competency import UserCompetency
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
    ) -> Tuple_Result:
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

# Type alias helper
Tuple_Result = Dict[str, Any]

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
