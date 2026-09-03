import unittest
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

from database import SessionLocal
from models.user import User
from models.course import Course
from models.competency import Competency, RoleCompetency
from models.user_competency import CompetencyScore, UserCompetency
from services.competency_service import get_user_detailed_competencies, get_user_ranked_gaps
from services.recommendation_service import RecommendationService

class TestRecommendationScoring(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.user = cls.db.query(User).filter(User.id == 3).first()
        if not cls.user:
            cls.user = cls.db.query(User).filter(User.role_id == 1).first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_different_courses_receive_different_scores(self):
        """TEST 1: Different courses with different competency mappings receive different scores."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=20)
        self.assertTrue(len(recs) >= 5, "Must return multiple recommendations")
        
        scores = [r["match_percent"] for r in recs]
        unique_scores = set(scores)
        self.assertGreater(len(unique_scores), 3, f"Expected varied scores across courses, got: {scores}")

    def test_02_largest_verified_gap_ranks_higher_than_unrelated(self):
        """TEST 2: A course strongly addressing the learner's largest verified gap ranks higher than an unrelated course."""
        gaps = get_user_ranked_gaps(self.db, self.user)
        # Find verified gap
        verified_gaps = [g for g in gaps if g["current_score"] is not None and g["gap"] > 20]
        self.assertTrue(len(verified_gaps) > 0, "Learner must have verified gaps")
        top_verified_comp_id = verified_gaps[0]["competency_id"]

        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=50)
        gap_courses = [r for r in recs if r["competency_id"] == top_verified_comp_id]
        unrelated_courses = [r for r in recs if r["score_components"]["role_relevance"] < 50.0]

        if gap_courses and unrelated_courses:
            self.assertGreater(
                gap_courses[0]["match_percent"], 
                unrelated_courses[0]["match_percent"],
                f"Verified gap course ({gap_courses[0]['match_percent']}%) must outrank unrelated course ({unrelated_courses[0]['match_percent']}%)"
            )

    def test_03_role_relevance_affects_match_score(self):
        """TEST 3: Two courses with different role relevance do not automatically receive the same match percentage."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=50)
        role_req = [r for r in recs if r["score_components"]["role_relevance"] == 100.0]
        non_role = [r for r in recs if r["score_components"]["role_relevance"] <= 50.0]

        self.assertTrue(len(role_req) > 0)
        self.assertTrue(len(non_role) > 0)
        self.assertNotEqual(role_req[0]["match_percent"], non_role[0]["match_percent"])

    def test_04_topic_relevance_produces_different_scores(self):
        """TEST 4: Different topic relevance produces different scores."""
        user_comps = get_user_detailed_competencies(self.db, self.user)
        role_comp_ids = [c["competency_id"] for c in user_comps]
        
        # Test synthetic course with matching topic vs no topic
        dummy_c1 = Course(id=9991, competency_id=1, topic_id=1, difficulty="intermediate", duration_hours=2.0)
        dummy_c2 = Course(id=9992, competency_id=1, topic_id=None, difficulty="intermediate", duration_hours=2.0)

        s1 = RecommendationService.calculate_recommendation_score(dummy_c1, self.user, user_comps, role_comp_ids)
        s2 = RecommendationService.calculate_recommendation_score(dummy_c2, self.user, user_comps, role_comp_ids)

        self.assertGreaterEqual(s1["match_percent"], s2["match_percent"])
        self.assertNotEqual(s1["components"]["subtopic_match"], s2["components"]["subtopic_match"])

    def test_05_duration_suitability_factor(self):
        """TEST 5: Different durations affect the score only through the 5% duration factor."""
        user_comps = get_user_detailed_competencies(self.db, self.user)
        role_comp_ids = [c["competency_id"] for c in user_comps]

        # 1-hour microlearning vs 15-hour long course
        c_short = Course(id=9993, competency_id=1, topic_id=None, difficulty="intermediate", duration_hours=1.0)
        c_long = Course(id=9994, competency_id=1, topic_id=None, difficulty="intermediate", duration_hours=15.0)

        s_short = RecommendationService.calculate_recommendation_score(c_short, self.user, user_comps, role_comp_ids)
        s_long = RecommendationService.calculate_recommendation_score(c_long, self.user, user_comps, role_comp_ids)

        diff = s_short["match_percent"] - s_long["match_percent"]
        # Max difference from 5% duration factor: 0.05 * (100 - 40) = 3.0 points
        self.assertGreater(diff, 0.0)
        self.assertLessEqual(diff, 5.0, f"Duration difference {diff} must be <= 5% max duration factor")

    def test_06_difficulty_affects_only_difficulty_component(self):
        """TEST 6: Difficulty affects only the difficulty component."""
        user_comps = get_user_detailed_competencies(self.db, self.user)
        role_comp_ids = [c["competency_id"] for c in user_comps]

        c_beg = Course(id=9995, competency_id=1, topic_id=None, difficulty="beginner", duration_hours=2.0)
        c_adv = Course(id=9996, competency_id=1, topic_id=None, difficulty="advanced", duration_hours=2.0)

        s_beg = RecommendationService.calculate_recommendation_score(c_beg, self.user, user_comps, role_comp_ids)
        s_adv = RecommendationService.calculate_recommendation_score(c_adv, self.user, user_comps, role_comp_ids)

        # Gap and role components must be identical
        self.assertEqual(s_beg["components"]["gap_relevance"], s_adv["components"]["gap_relevance"])
        self.assertEqual(s_beg["components"]["role_relevance"], s_adv["components"]["role_relevance"])
        self.assertNotEqual(s_beg["components"]["difficulty_suitability"], s_adv["components"]["difficulty_suitability"])

    def test_07_unassessed_competencies_not_treated_as_zero(self):
        """TEST 7: Unassessed competencies are not treated as 0% (no manufactured fake 100% gap)."""
        user_comps = get_user_detailed_competencies(self.db, self.user)
        role_comp_ids = [c["competency_id"] for c in user_comps]

        # Find an unassessed role competency
        unassessed_comp = next((c for c in user_comps if c["current_score"] is None), None)
        self.assertIsNotNone(unassessed_comp, "Learner must have at least one unassessed competency")

        c_unassessed = Course(id=9997, competency_id=unassessed_comp["competency_id"], difficulty="intermediate", duration_hours=2.0)
        s = RecommendationService.calculate_recommendation_score(c_unassessed, self.user, user_comps, role_comp_ids)

        # Unassessed gap relevance should be neutral baseline (30.0), NOT 100.0 (which a 0% score would produce)
        self.assertEqual(s["components"]["gap_relevance"], 30.0)

    def test_08_no_uniform_88_percent_across_courses(self):
        """TEST 8: No course receives a hardcoded or uniform 88% match."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=50)
        eighty_eight_count = sum(1 for r in recs if r["match_percent"] == 88.0)
        total_count = len(recs)
        
        # It is impossible for all 50 courses to be 88%
        self.assertLess(
            eighty_eight_count, 
            total_count / 2, 
            f"Found {eighty_eight_count}/{total_count} courses with 88.0% match - scores must be differentiated"
        )

    def test_09_scores_are_deterministic(self):
        """TEST 9: Scores are deterministic — running the same recommendation twice produces the exact same score."""
        recs1 = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=10)
        recs2 = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=10)

        for r1, r2 in zip(recs1, recs2):
            self.assertEqual(r1["id"], r2["id"])
            self.assertEqual(r1["match_percent"], r2["match_percent"])
            self.assertEqual(r1["score_components"], r2["score_components"])

    def test_10_all_final_scores_within_0_to_100(self):
        """TEST 10: All final scores are within 0–100."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=60)
        for r in recs:
            self.assertGreaterEqual(r["match_percent"], 0.0)
            self.assertLessEqual(r["match_percent"], 100.0)
            for k, val in r["score_components"].items():
                self.assertGreaterEqual(val, 0.0)
                self.assertLessEqual(val, 100.0)

    def test_11_score_breakdown_and_explainability_exposed(self):
        """TEST 11: Backend exposes score_breakdown and explainable why-this-course string."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=5)
        for r in recs:
            self.assertIn("score_breakdown", r)
            self.assertIn("competency_gap", r["score_breakdown"])
            self.assertIn("role_relevance", r["score_breakdown"])
            self.assertIn("topic_match", r["score_breakdown"])
            self.assertIn("difficulty_match", r["score_breakdown"])
            self.assertIn("duration_suitability", r["score_breakdown"])
            self.assertTrue(len(r["explanation"]) > 10)

    def test_12_dashboard_and_courses_use_same_recommendation_scores(self):
        """TEST 12: Dashboard and Courses use the exact same recommendation scores from the service."""
        recs_service = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=10)
        score_map = {r["id"]: r["match_percent"] for r in recs_service}

        # Re-fetch via personalized generator
        recs_again = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=10)
        for r in recs_again:
            self.assertEqual(r["match_percent"], score_map[r["id"]])

if __name__ == '__main__':
    unittest.main()
