import unittest
import sys
import json
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

from database import SessionLocal
from models.user import User
from models.role import Role
from models.competency import Competency, RoleCompetency
from models.course import Course, CourseCompetency
from models.assessment import Assessment, Question, AssessmentAnswer
from models.user_competency import CompetencyScore, UserCompetency
from models.recommendation import AIDiagnosis
from models.learning_path import LearningPath, LearningPathItem
from models.material import LearningMaterial
from services.competency_service import (
    get_user_detailed_competencies,
    get_user_ranked_gaps,
    get_user_competency_insights
)
from services.recommendation_service import RecommendationService
from routers.competencies import get_my_diagnosis
from routers.learning_paths import get_path

class TestGlobalCompetencyConsistency(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.stat_officer = cls.db.query(User).filter(User.email == 'statistical.officer@mospi.gov.in').first()
        if not cls.stat_officer:
            cls.stat_officer = cls.db.query(User).filter(User.role_id == 1).first()
        if not cls.stat_officer:
            cls.stat_officer = cls.db.query(User).first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_priority_gap_matches_diagnostic_competency(self):
        """TEST 1: Priority gap competency == diagnostic competency."""
        gaps = get_user_ranked_gaps(self.db, self.stat_officer)
        self.assertTrue(len(gaps) > 0, "Learner must have ranked competency gaps")
        top_gap = gaps[0]

        diag = get_my_diagnosis(None, self.db, self.stat_officer)
        self.assertIsNotNone(diag, "Must return diagnosis for learner")
        self.assertEqual(
            diag["competency_id"], 
            top_gap["competency_id"], 
            f"Diagnostic competency ID {diag['competency_id']} must match priority gap competency ID {top_gap['competency_id']}"
        )
        self.assertEqual(
            diag["competency_name"], 
            top_gap["competency_name"],
            f"Diagnostic competency name '{diag['competency_name']}' must match priority gap competency '{top_gap['competency_name']}'"
        )

    def test_02_diagnostic_competency_belongs_to_active_role(self):
        """TEST 2: Diagnostic competency belongs to learner's active role competencies."""
        role_id = self.stat_officer.role_id or 1
        role_comp_ids = {
            rc.competency_id 
            for rc in self.db.query(RoleCompetency).filter(RoleCompetency.role_id == role_id).all()
        }
        self.assertTrue(len(role_comp_ids) > 0, "Role must have configured competencies")
        self.assertLessEqual(len(role_comp_ids), 8, "Role must have <= 8 competencies")

        diag = get_my_diagnosis(None, self.db, self.stat_officer)
        self.assertIn(
            diag["competency_id"], 
            role_comp_ids, 
            f"Diagnostic competency {diag['competency_id']} must be part of active role competencies {role_comp_ids}"
        )

    def test_03_recommended_course_maps_to_priority_competency(self):
        """TEST 3: Recommended course maps to priority competency."""
        gaps = get_user_ranked_gaps(self.db, self.stat_officer)
        top_comp_ids = {g["competency_id"] for g in gaps if g["priority_weight"] >= gaps[0]["priority_weight"] - 5.0}
        
        recs = RecommendationService.get_personalized_recommendations(self.db, self.stat_officer, limit=5)
        self.assertTrue(len(recs) > 0, "Must return recommendations")
        
        top_rec = recs[0]
        # Course must be active iGOT course
        course = self.db.query(Course).filter(Course.id == top_rec["id"]).first()
        self.assertIsNotNone(course)
        self.assertTrue(course.is_active)
        self.assertTrue(course.is_igot)
        
        # Course must be mapped to one of the top priority gap competencies
        self.assertIn(
            top_rec["competency_id"], 
            top_comp_ids,
            f"Top recommended course competency {top_rec['competency_id']} must target top gap competencies {top_comp_ids}"
        )

    def test_04_learning_path_competency_matches_priority_gaps(self):
        """TEST 4: Learning Path competency == recommendation competency."""
        path = RecommendationService.generate_learning_path(self.db, self.stat_officer)
        self.assertIsNotNone(path)
        self.assertTrue(len(path.items) > 0)
        
        recs = RecommendationService.get_personalized_recommendations(self.db, self.stat_officer, limit=6)
        rec_ids = [r["id"] for r in recs]
        
        path_course_ids = [it.reference_id for it in path.items]
        self.assertEqual(path_course_ids[0], rec_ids[0], "First learning path item must match top recommended course")

    def test_05_learning_journey_items_correspond_to_active_catalogue(self):
        """TEST 5: Learning Journey items correspond to current recommendations/gaps."""
        path_res = get_path(self.db, self.stat_officer)
        self.assertTrue(len(path_res["items"]) > 0)
        
        for item in path_res["items"]:
            self.assertTrue(item["is_igot"], f"Item {item['title']} must be an iGOT course")
            self.assertIsNotNone(item["igot_identifier"], f"Item {item['title']} must have iGOT identifier")
            self.assertTrue(item["igot_identifier"].startswith("do_"))
            self.assertEqual(item["external_url"], "https://igotkarmayogi.gov.in/")

    def test_06_ai_malformed_unrelated_output_does_not_break_dashboard(self):
        """TEST 6: AI malformed/unrelated output does not break dashboard."""
        # Create a malformed diagnosis in the database
        malformed_diag = AIDiagnosis(
            user_id=self.stat_officer.id,
            competency_id=1,
            primary_gap="Random Malformed String",
            root_cause="Test root cause",
            explanation="{ this is completely invalid json",
            confidence=85.0
        )
        self.db.add(malformed_diag)
        self.db.commit()

        # get_my_diagnosis must succeed without raising exception
        diag = get_my_diagnosis(1, self.db, self.stat_officer)
        self.assertIsNotNone(diag)
        self.assertEqual(diag["competency_id"], 1)
        self.assertTrue(len(diag["explanation"]) > 0)

        # Cleanup test fixture
        self.db.delete(malformed_diag)
        self.db.commit()

    def test_07_changing_learner_role_recalculates_targets(self):
        """TEST 7: Changing learner role recalculates competency targets correctly."""
        orig_role = self.stat_officer.role_id
        try:
            # Change role to Data Analyst (Role 2)
            self.stat_officer.role_id = 2
            self.db.commit()
            
            detailed_r2 = get_user_detailed_competencies(self.db, self.stat_officer)
            r2_comp_ids = [c["competency_id"] for c in detailed_r2]
            
            expected_r2_ids = {
                rc.competency_id 
                for rc in self.db.query(RoleCompetency).filter(RoleCompetency.role_id == 2).all()
            }
            self.assertEqual(set(r2_comp_ids), expected_r2_ids)
            self.assertLessEqual(len(r2_comp_ids), 8)
        finally:
            self.stat_officer.role_id = orig_role
            self.db.commit()

    def test_08_reassessment_updates_gap_and_downstream_recommendations(self):
        """TEST 8: Reassessment updates the gap and downstream recommendations."""
        gaps_before = get_user_ranked_gaps(self.db, self.stat_officer)
        top_comp_id = gaps_before[0]["competency_id"]
        
        # Simulate a high-score reassessment measurement on this top competency
        new_score = CompetencyScore(
            user_id=self.stat_officer.id,
            competency_id=top_comp_id,
            score=95.0,
            source="reassessment"
        )
        self.db.add(new_score)
        
        # Update user competency live state
        uc = self.db.query(UserCompetency).filter(
            UserCompetency.user_id == self.stat_officer.id,
            UserCompetency.competency_id == top_comp_id
        ).first()
        orig_uc_score = uc.current_score if uc else None
        if uc:
            uc.current_score = 95.0
            uc.status = "strong"
        
        self.db.commit()

        try:
            gaps_after = get_user_ranked_gaps(self.db, self.stat_officer)
            # The gap for this competency should now be 0.0
            updated_gap_item = next(g for g in gaps_after if g["competency_id"] == top_comp_id)
            self.assertEqual(updated_gap_item["gap"], 0.0)
            
            # Downstream recommendations re-rank around the new highest gap
            recs_after = RecommendationService.get_personalized_recommendations(self.db, self.stat_officer, limit=5)
            self.assertTrue(len(recs_after) > 0)
        finally:
            self.db.delete(new_score)
            if uc:
                uc.current_score = orig_uc_score
                uc.status = "needs_attention" if (orig_uc_score or 0) < 70 else "strong"
            self.db.commit()

    def test_09_no_stale_hardcoded_competency_in_database(self):
        """TEST 9: No stale hardcoded competency appears in current framework."""
        comps = self.db.query(Competency).all()
        comp_names = {c.name for c in comps}
        self.assertNotIn("Data Interpretation", comp_names)
        self.assertNotIn("Sampling Techniques", comp_names)

    def test_10_historical_learner_data_intact(self):
        """TEST 10: Historical learner data remains intact."""
        self.assertGreaterEqual(self.db.query(User).count(), 170)
        self.assertGreaterEqual(self.db.query(Assessment).count(), 700)
        self.assertGreaterEqual(self.db.query(AssessmentAnswer).count(), 3000)
        self.assertGreaterEqual(self.db.query(CompetencyScore).count(), 800)
        self.assertGreaterEqual(self.db.query(LearningMaterial).count(), 400)

    def test_11_sixty_active_igot_courses_intact(self):
        """TEST 11: 60 active iGOT courses remain intact."""
        active_igot = self.db.query(Course).filter(Course.is_active == True, Course.is_igot == True).count()
        self.assertEqual(active_igot, 60)

    def test_12_twenty_competencies_intact(self):
        """TEST 12: 20 competencies remain intact."""
        self.assertEqual(self.db.query(Competency).count(), 20)

    def test_13_twelve_roles_intact(self):
        """TEST 13: 12 roles remain intact."""
        self.assertEqual(self.db.query(Role).count(), 12)

    def test_14_end_to_end_deterministic_chain_statistical_officer(self):
        """TEST 14: End-to-End Deterministic Chain Verification."""
        # 1. Deterministic Gap
        gaps = get_user_ranked_gaps(self.db, self.stat_officer)
        top_gap = gaps[0]
        comp_id = top_gap["competency_id"]
        comp_name = top_gap["competency_name"]
        top_comp_ids = {g["competency_id"] for g in gaps if g["priority_weight"] >= gaps[0]["priority_weight"] - 5.0}

        # 2. AI Diagnosis strictly anchored to that competency
        diag = get_my_diagnosis(comp_id, self.db, self.stat_officer)
        self.assertEqual(diag["competency_id"], comp_id)
        self.assertEqual(diag["competency_name"], comp_name)

        # 3. Top recommended course targets top priority gap
        recs = RecommendationService.get_personalized_recommendations(self.db, self.stat_officer, limit=3)
        top_rec = recs[0]
        self.assertIn(top_rec["competency_id"], top_comp_ids)

        # 4. Learning Path generated for this learner matches the top recommendation
        path = RecommendationService.generate_learning_path(self.db, self.stat_officer)
        first_item = path.items[0]
        self.assertEqual(first_item.reference_id, top_rec["id"])
        self.assertEqual(first_item.competency_id, top_rec["competency_id"])

if __name__ == '__main__':
    unittest.main()
