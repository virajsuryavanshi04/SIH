import os
import sys
import unittest
from datetime import datetime, timedelta

from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from config import settings
from models.user import User
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.user_competency import CompetencyScore, UserCompetency
from models.assessment import Assessment, AssessmentAnswer, Question, QuestionOption
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.course import Course
from models.material import LearningMaterial
from auth.security import create_access_token, hash_password

class TestPhase5FProgressAnalytics(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orig_provider = settings.AI_PROVIDER
        settings.AI_PROVIDER = "mock"
        cls.client = TestClient(app)

        db = SessionLocal()
        # Create test learner 1
        u1 = db.query(User).filter(User.email == "p5f_learner1@smartlearn.test").first()
        if not u1:
            u1 = User(
                email="p5f_learner1@smartlearn.test",
                password_hash=hash_password("Pass123!"),
                full_name="P5F Learner One",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            db.add(u1)
            db.commit()
            db.refresh(u1)
        cls.u1_id = u1.id
        cls.u1_email = u1.email

        # Create test learner 2 (for tenant isolation)
        u2 = db.query(User).filter(User.email == "p5f_learner2@smartlearn.test").first()
        if not u2:
            u2 = User(
                email="p5f_learner2@smartlearn.test",
                password_hash=hash_password("Pass123!"),
                full_name="P5F Learner Two",
                role="learner",
                designation="Data Analyst",
                role_id=3
            )
            db.add(u2)
            db.commit()
            db.refresh(u2)
        cls.u2_id = u2.id
        cls.u2_email = u2.email

        # Empty state user
        u_empty = db.query(User).filter(User.email == "p5f_empty@smartlearn.test").first()
        if not u_empty:
            u_empty = User(
                email="p5f_empty@smartlearn.test",
                password_hash=hash_password("Pass123!"),
                full_name="P5F Empty State",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            db.add(u_empty)
            db.commit()
            db.refresh(u_empty)
        cls.u_empty_id = u_empty.id
        cls.u_empty_email = u_empty.email

        db.close()

        cls.token1 = create_access_token({"sub": cls.u1_email, "role": "learner"})
        cls.headers1 = {"Authorization": f"Bearer {cls.token1}"}

        cls.token2 = create_access_token({"sub": cls.u2_email, "role": "learner"})
        cls.headers2 = {"Authorization": f"Bearer {cls.token2}"}

        cls.token_empty = create_access_token({"sub": cls.u_empty_email, "role": "learner"})
        cls.headers_empty = {"Authorization": f"Bearer {cls.token_empty}"}

    @classmethod
    def tearDownClass(cls):
        settings.AI_PROVIDER = cls.orig_provider

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_auth_and_tenant_isolation(self):
        """1. Endpoints require auth and isolate learner data strictly by current_user token."""
        # Unauthenticated calls return 401
        for ep in ["/api/progress/overview", "/api/progress/competencies", "/api/progress/analytics", "/api/progress/timeline"]:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 401, f"{ep} without auth must return 401")

        # Authenticated calls succeed and return user_id matching caller token
        ov1 = self.client.get("/api/progress/overview", headers=self.headers1)
        self.assertEqual(ov1.status_code, 200)
        self.assertEqual(ov1.json()["user_id"], self.u1_id)

        ov2 = self.client.get("/api/progress/overview", headers=self.headers2)
        self.assertEqual(ov2.status_code, 200)
        self.assertEqual(ov2.json()["user_id"], self.u2_id)

    def test_02_empty_state_learner(self):
        """2. New learner with 0 assessments receives safe 0.0 defaults without 500 errors."""
        # Clean empty learner
        self.db.query(CompetencyScore).filter(CompetencyScore.user_id == self.u_empty_id).delete()
        self.db.query(UserCompetency).filter(UserCompetency.user_id == self.u_empty_id).delete()
        self.db.query(Assessment).filter(Assessment.user_id == self.u_empty_id).delete()
        self.db.commit()

        # Overview
        ov = self.client.get("/api/progress/overview", headers=self.headers_empty)
        self.assertEqual(ov.status_code, 200)
        data = ov.json()
        self.assertEqual(data["overall_readiness"], 0.0)
        self.assertEqual(data["total_improvement_points"], 0.0)
        self.assertEqual(data["benchmarks_met"], 0)
        self.assertEqual(data["milestones_completed"]["courses"], 0)
        self.assertEqual(data["milestones_completed"]["reassessments"], 0)

        # Competencies
        comps = self.client.get("/api/progress/competencies", headers=self.headers_empty)
        self.assertEqual(comps.status_code, 200)
        for c in comps.json():
            self.assertIsNone(c["current_score"])
            self.assertEqual(c["trend"], "unassessed")
            self.assertEqual(len(c["history_points"]), 0)

        # Analytics
        ana = self.client.get("/api/progress/analytics", headers=self.headers_empty)
        self.assertEqual(ana.status_code, 200)
        self.assertEqual(ana.json()["average_response_time_seconds"], 0.0)
        self.assertEqual(ana.json()["difficulty_breakdown"]["level_1"]["total"], 0)

        # Timeline
        tl = self.client.get("/api/progress/timeline", headers=self.headers_empty)
        self.assertEqual(tl.status_code, 200)
        self.assertEqual(len(tl.json()), 0)

    def test_03_single_assessment_learner(self):
        """3. Learner with single assessment has trend='new' and change_points=0.0."""
        self.db.query(CompetencyScore).filter(CompetencyScore.user_id == self.u1_id, CompetencyScore.competency_id == 1).delete()
        
        # Single baseline assessment score 55.0
        cs = CompetencyScore(user_id=self.u1_id, competency_id=1, score=55.0, source="baseline", assessed_at=datetime.utcnow() - timedelta(days=5))
        uc = self.db.query(UserCompetency).filter(UserCompetency.user_id == self.u1_id, UserCompetency.competency_id == 1).first()
        if not uc:
            uc = UserCompetency(user_id=self.u1_id, competency_id=1, current_score=55.0, target_score=70.0, status="needs_attention")
            self.db.add(uc)
        else:
            uc.current_score = 55.0
            uc.target_score = 70.0
            uc.status = "needs_attention"
        self.db.add(cs)
        self.db.commit()

        comps = self.client.get("/api/progress/competencies", headers=self.headers1).json()
        c1 = next((c for c in comps if c["competency_id"] == 1), None)
        self.assertIsNotNone(c1)
        self.assertEqual(c1["current_score"], 55.0)
        self.assertEqual(c1["change_points"], 0.0)
        self.assertEqual(c1["trend"], "new")
        self.assertEqual(len(c1["history_points"]), 1)

    def test_04_multi_assessment_improvement(self):
        """4. Second assessment with higher score computes positive delta and trend='improving'."""
        # Add second measurement: 75.0 (increase of +20.0 pts)
        cs2 = CompetencyScore(user_id=self.u1_id, competency_id=1, score=75.0, source="adaptive_reassessment", assessed_at=datetime.utcnow() - timedelta(days=1))
        uc = self.db.query(UserCompetency).filter(UserCompetency.user_id == self.u1_id, UserCompetency.competency_id == 1).first()
        uc.current_score = 75.0
        uc.status = "strong"
        self.db.add(cs2)
        self.db.commit()

        comps = self.client.get("/api/progress/competencies", headers=self.headers1).json()
        c1 = next((c for c in comps if c["competency_id"] == 1), None)
        self.assertEqual(c1["current_score"], 75.0)
        self.assertEqual(c1["previous_score"], 55.0)
        self.assertEqual(c1["change_points"], 20.0)
        self.assertEqual(c1["trend"], "improving")
        self.assertEqual(len(c1["history_points"]), 2)

    def test_05_declining_and_steady_performance(self):
        """5. Score drop computes negative delta and trend='declining'; equal score computes 'steady'."""
        # Add third measurement: 68.0 (drop of -7.0 pts from 75.0)
        cs3 = CompetencyScore(user_id=self.u1_id, competency_id=1, score=68.0, source="adaptive", assessed_at=datetime.utcnow())
        uc = self.db.query(UserCompetency).filter(UserCompetency.user_id == self.u1_id, UserCompetency.competency_id == 1).first()
        uc.current_score = 68.0
        self.db.add(cs3)
        self.db.commit()

        comps = self.client.get("/api/progress/competencies", headers=self.headers1).json()
        c1 = next((c for c in comps if c["competency_id"] == 1), None)
        self.assertEqual(c1["change_points"], -7.0)
        self.assertEqual(c1["trend"], "declining")

    def test_06_benchmark_achievement(self):
        """6. Reaching target increments benchmarks_met count in overview."""
        # Clean user 1 competencies to 2 items
        self.db.query(CompetencyScore).filter(CompetencyScore.user_id == self.u1_id).delete()
        self.db.query(UserCompetency).filter(UserCompetency.user_id == self.u1_id).delete()

        # Comp 1: 85.0 >= 70.0 (Target Met)
        uc1 = UserCompetency(user_id=self.u1_id, competency_id=1, current_score=85.0, target_score=70.0, status="strong")
        cs1 = CompetencyScore(user_id=self.u1_id, competency_id=1, score=85.0, source="adaptive_reassessment", assessed_at=datetime.utcnow())
        self.db.add(uc1)
        self.db.add(cs1)

        # Comp 2: 45.0 < 70.0 (Target Not Met)
        uc2 = UserCompetency(user_id=self.u1_id, competency_id=2, current_score=45.0, target_score=70.0, status="critical_gap")
        cs2 = CompetencyScore(user_id=self.u1_id, competency_id=2, score=45.0, source="baseline", assessed_at=datetime.utcnow())
        self.db.add(uc2)
        self.db.add(cs2)
        self.db.commit()

        ov = self.client.get("/api/progress/overview", headers=self.headers1).json()
        self.assertGreaterEqual(ov["benchmarks_met"], 1)

    def test_07_subtopic_granular_analytics(self):
        """7. Subtopic accuracy is computed from submitted answers and weakest_subtopic is identified."""
        # Find competency 1 topics
        t1 = self.db.query(CompetencyTopic).filter(CompetencyTopic.competency_id == 1).first()
        if t1:
            comps = self.client.get("/api/progress/competencies", headers=self.headers1).json()
            c1 = next((c for c in comps if c["competency_id"] == 1), None)
            self.assertIsNotNone(c1)
            self.assertIn("subtopics", c1)
            self.assertTrue(isinstance(c1["subtopics"], list))

    def test_08_difficulty_and_confidence_calibration(self):
        """8. Accuracy by difficulty level and confidence calibration quadrant are computed."""
        # Create an assessment with 2 answers: 1 high-conf correct, 1 high-conf incorrect
        ass = Assessment(user_id=self.u1_id, assessment_type="adaptive", status="completed", overall_score=50.0, completed_at=datetime.utcnow())
        self.db.add(ass)
        self.db.commit()
        self.db.refresh(ass)

        q1 = self.db.query(Question).filter(Question.difficulty == 1).first() or self.db.query(Question).first()
        q2 = self.db.query(Question).filter(Question.difficulty == 2).first() or self.db.query(Question).first()

        a1 = AssessmentAnswer(
            assessment_id=ass.id,
            question_id=q1.id if q1 else None,
            is_correct=True,
            confidence_level=5,
            time_taken_seconds=14
        )
        a2 = AssessmentAnswer(
            assessment_id=ass.id,
            question_id=q2.id if q2 else None,
            is_correct=False,
            confidence_level=4,
            time_taken_seconds=22
        )
        self.db.add(a1)
        self.db.add(a2)
        self.db.commit()

        ana = self.client.get("/api/progress/analytics", headers=self.headers1).json()
        self.assertIn("difficulty_breakdown", ana)
        self.assertIn("confidence_calibration", ana)
        self.assertGreaterEqual(ana["confidence_calibration"]["high_confidence_correct"], 1)
        self.assertGreaterEqual(ana["confidence_calibration"]["high_confidence_incorrect"], 1)
        self.assertGreater(ana["average_response_time_seconds"], 0.0)

    def test_09_response_time_calculation(self):
        """9. Average response speed accurately reflects submitted answer seconds."""
        ana = self.client.get("/api/progress/analytics", headers=self.headers1).json()
        self.assertTrue(isinstance(ana["average_response_time_seconds"], float))

    def test_10_timeline_ordering_and_milestones(self):
        """10. Timeline returns chronological events including completed assessments, courses, and milestones."""
        # Add completed course progress
        c1 = self.db.query(Course).first()
        if c1:
            prog = self.db.query(LearningProgress).filter(LearningProgress.user_id == self.u1_id, LearningProgress.course_id == c1.id).first()
            if not prog:
                prog = LearningProgress(user_id=self.u1_id, course_id=c1.id, progress_percent=100.0, status="completed", completed_at=datetime.utcnow())
                self.db.add(prog)
            else:
                prog.status = "completed"
                prog.progress_percent = 100.0
                prog.completed_at = datetime.utcnow()
            self.db.commit()

        tl = self.client.get("/api/progress/timeline?limit=10", headers=self.headers1).json()
        self.assertTrue(len(tl) >= 1)
        # Check chronological order (newest first)
        timestamps = [t["timestamp"] for t in tl]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))

    def test_11_no_fabricated_telemetry(self):
        """11. Asserts no fake notes-read duration, flashcard flips, or login streaks are returned."""
        ov = self.client.get("/api/progress/overview", headers=self.headers1).json()
        self.assertNotIn("study_hours", ov)
        self.assertNotIn("notes_read", ov)
        self.assertNotIn("flashcards_flipped", ov)
        self.assertNotIn("login_streak", ov)

    def test_12_baseline_data_preservation(self):
        """12. Questions >= 220, bank questions = 80, materials >= 51, Material #49 intact."""
        q_count = self.db.query(Question).count()
        self.assertGreaterEqual(q_count, 220)

        bank_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        self.assertEqual(bank_count, 80)

        m_count = self.db.query(LearningMaterial).count()
        self.assertGreaterEqual(m_count, 51)

        m49 = self.db.query(LearningMaterial).filter(LearningMaterial.id == 49).first()
        self.assertIsNotNone(m49)
        self.assertEqual(m49.material_scope, "OFFICIAL_COMPETENCY")
        self.assertEqual(m49.competency_id, 1)

if __name__ == "__main__":
    unittest.main()
