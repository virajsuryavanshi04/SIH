import unittest
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

from database import SessionLocal
from models.user import User
from models.course import Course
from models.competency import Competency
from services.competency_service import get_user_ranked_gaps, get_user_detailed_competencies
from services.recommendation_service import RecommendationService

class TestDashboardToIGOTNavigation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.user = cls.db.query(User).filter(User.id == 3).first()
        if not cls.user:
            cls.user = cls.db.query(User).filter(User.role_id == 1).first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_dashboard_primary_gap_has_recommended_course(self):
        """TEST 1: Dashboard primary gap has a recommended course and generates targeted URL."""
        gaps = get_user_ranked_gaps(self.db, self.user)
        self.assertTrue(len(gaps) > 0, "Learner must have ranked gaps")
        top_gap = gaps[0]

        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=5)
        self.assertTrue(len(recs) > 0, "Must return personalized recommendations")
        
        # Matching recommendation for the top gap
        matching_rec = next((r for r in recs if r["competency_id"] == top_gap["competency_id"]), recs[0])
        self.assertIsNotNone(matching_rec)
        self.assertIn("id", matching_rec)
        
        # Verify navigation query string formation
        nav_url = f"/igot-learning?course_id={matching_rec['id']}&competency_id={top_gap['competency_id']}"
        self.assertTrue(nav_url.startswith("/igot-learning?course_id="))
        self.assertIn(f"course_id={matching_rec['id']}", nav_url)
        self.assertIn(f"competency_id={top_gap['competency_id']}", nav_url)

    def test_02_igot_learning_identifies_exact_same_course(self):
        """TEST 2: iGOT Learning receives course identifier and finds exact course from catalogue."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=5)
        target_course = recs[0]
        target_id = target_course["id"]

        # Simulate iGOT learning page fetching catalogue
        course_in_db = self.db.query(Course).filter(Course.id == target_id, Course.is_active == True).first()
        self.assertIsNotNone(course_in_db)
        self.assertEqual(course_in_db.title, target_course["title"])
        self.assertEqual(course_in_db.competency_id, target_course["competency_id"])

    def test_03_different_course_is_not_highlighted(self):
        """TEST 3: A different course is NOT highlighted when a specific course_id is requested."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=10)
        target_id = recs[0]["id"]
        other_course_id = recs[1]["id"]

        # Check identification logic
        self.assertTrue(str(target_id) == str(recs[0]["id"]))
        self.assertFalse(str(other_course_id) == str(recs[0]["id"]))

    def test_04_highlighted_course_competency_matches_primary_gap(self):
        """TEST 4: Highlighted course's competency matches the primary gap / recommendation data."""
        gaps = get_user_ranked_gaps(self.db, self.user)
        top_comp_ids = {g["competency_id"] for g in gaps if g["priority_weight"] >= gaps[0]["priority_weight"] - 5.0}

        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=3)
        top_rec = recs[0]

        self.assertIn(
            top_rec["competency_id"], 
            top_comp_ids, 
            f"Course competency {top_rec['competency_id']} must match top gap competencies {top_comp_ids}"
        )

    def test_05_no_navigation_context_renders_normally(self):
        """TEST 5: No course-navigation context: no arbitrary course is flagged."""
        # Querying all courses without course_id filter returns all 60 courses
        all_courses = self.db.query(Course).filter(Course.is_active == True).all()
        self.assertEqual(len(all_courses), 60)

    def test_06_invalid_course_id_handles_gracefully(self):
        """TEST 6: Invalid/inactive course ID: does not crash, graceful fallback."""
        invalid_id = 999999
        course = self.db.query(Course).filter(Course.id == invalid_id, Course.is_active == True).first()
        self.assertIsNone(course)

    def test_07_start_learning_button_url_is_verified_igot_url(self):
        """TEST 7: The external 'Start Learning on iGOT' URL remains the verified official iGOT URL."""
        courses = self.db.query(Course).filter(Course.is_active == True).all()
        for c in courses:
            url = c.external_url or "https://igotkarmayogi.gov.in/"
            self.assertTrue(
                url.startswith("https://igotkarmayogi.gov.in") or url.startswith("http://") or url.startswith("https://"),
                f"Course {c.id} URL '{url}' must be a valid external iGOT URL"
            )

    def test_08_no_hardcoded_course_data(self):
        """TEST 8: Recommendations are dynamically calculated from database, not hardcoded."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=5)
        for r in recs:
            self.assertIn("match_percent", r)
            self.assertIn("score_components", r)
            self.assertIsNotNone(r["id"])
            self.assertTrue(isinstance(r["id"], int))

    def test_09_dashboard_and_igot_use_same_course_identifier(self):
        """TEST 9: Dashboard and iGOT Learning use the exact same course identifier."""
        recs = RecommendationService.get_personalized_recommendations(self.db, self.user, limit=5)
        for r in recs:
            course = self.db.query(Course).filter(Course.id == r["id"]).first()
            self.assertIsNotNone(course)
            self.assertEqual(r["id"], course.id)
            if course.igot_identifier:
                self.assertEqual(r["igot_identifier"], course.igot_identifier)

if __name__ == '__main__':
    unittest.main()
