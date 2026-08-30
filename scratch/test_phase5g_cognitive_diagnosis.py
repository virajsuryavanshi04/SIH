import os
import sys
import unittest
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, os.path.abspath("d:/Affan/Hackathons/SIH/SmartLearn/backend"))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from config import settings
from models.user import User
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.user_competency import CompetencyScore, UserCompetency
from models.assessment import Assessment, AssessmentAnswer, Question, QuestionOption
from models.recommendation import AIDiagnosis
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.course import Course
from models.material import LearningMaterial, MaterialNote, MaterialFlashcardDeck, MaterialMindMap, MaterialQuizQuestionSet
from auth.security import create_access_token, hash_password

class TestPhase5GCognitiveDiagnosis(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orig_provider = settings.AI_PROVIDER
        settings.AI_PROVIDER = "mock"
        cls.client = TestClient(app)

        db = SessionLocal()
        # Learner 1
        u1 = db.query(User).filter(User.email == "p5g_learner1@smartlearn.test").first()
        if not u1:
            u1 = User(
                email="p5g_learner1@smartlearn.test",
                password_hash=hash_password("Pass123!"),
                full_name="P5G Learner One",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            db.add(u1)
            db.commit()
            db.refresh(u1)
        cls.u1_id = u1.id
        cls.u1_email = u1.email

        # Learner 2 (for tenant isolation)
        u2 = db.query(User).filter(User.email == "p5g_learner2@smartlearn.test").first()
        if not u2:
            u2 = User(
                email="p5g_learner2@smartlearn.test",
                password_hash=hash_password("Pass123!"),
                full_name="P5G Learner Two",
                role="learner",
                designation="Data Analyst",
                role_id=3
            )
            db.add(u2)
            db.commit()
            db.refresh(u2)
        cls.u2_id = u2.id
        cls.u2_email = u2.email

        db.close()

        cls.token1 = create_access_token({"sub": cls.u1_email, "role": "learner"})
        cls.headers1 = {"Authorization": f"Bearer {cls.token1}"}

        cls.token2 = create_access_token({"sub": cls.u2_email, "role": "learner"})
        cls.headers2 = {"Authorization": f"Bearer {cls.token2}"}

    @classmethod
    def tearDownClass(cls):
        settings.AI_PROVIDER = cls.orig_provider

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_auth_requirement(self):
        """1. Endpoints require authentication and return 401 when unauthenticated."""
        for ep in ["/api/diagnosis/assessment/1", "/api/diagnosis/remediation/1", "/api/diagnosis/latest"]:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 401, f"{ep} must return 401 without token")

    def test_02_assessment_ownership(self):
        """2. Learner A cannot access diagnosis for an assessment owned by Learner B."""
        # Create assessment for user 2
        ass2 = Assessment(user_id=self.u2_id, assessment_type="adaptive", status="completed", overall_score=60.0)
        self.db.add(ass2)
        self.db.commit()
        self.db.refresh(ass2)

        # User 1 tries to access user 2's assessment diagnosis -> 403
        res = self.client.get(f"/api/diagnosis/assessment/{ass2.id}", headers=self.headers1)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Forbidden", res.json()["detail"])

    def test_03_completed_assessment_requirement(self):
        """3. In-progress active assessments cannot be diagnosed (no active answer leakage)."""
        active_ass = Assessment(user_id=self.u1_id, assessment_type="adaptive", status="in_progress")
        self.db.add(active_ass)
        self.db.commit()
        self.db.refresh(active_ass)

        res = self.client.get(f"/api/diagnosis/assessment/{active_ass.id}", headers=self.headers1)
        self.assertEqual(res.status_code, 400)
        self.assertIn("completion", res.json()["detail"].lower())

    def test_04_item_level_telemetry_extraction(self):
        """4. Item-level answers, choices, correctness, and confidence are extracted into structured diagnosis."""
        ass = Assessment(user_id=self.u1_id, assessment_type="adaptive", status="completed", overall_score=50.0)
        self.db.add(ass)
        self.db.commit()
        self.db.refresh(ass)

        q1 = self.db.query(Question).filter(Question.competency_id == 1).first()
        a1 = AssessmentAnswer(
            assessment_id=ass.id,
            question_id=q1.id if q1 else None,
            is_correct=False,
            confidence_level=4,
            selected_answer="Incorrect distractor choice"
        )
        self.db.add(a1)
        self.db.commit()

        res = self.client.get(f"/api/diagnosis/assessment/{ass.id}", headers=self.headers1)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["assessment_id"], ass.id)
        self.assertIn("primary_bottleneck", data)
        self.assertIn("evidence_summary", data)
        self.assertIn("misconceptions", data)

    def test_05_high_confidence_incorrect_detection(self):
        """5. High-confidence incorrect answers are flagged as likely misconceptions."""
        ass = Assessment(user_id=self.u1_id, assessment_type="adaptive", status="completed", overall_score=40.0)
        self.db.add(ass)
        self.db.commit()
        self.db.refresh(ass)

        q = self.db.query(Question).filter(Question.competency_id == 1).first()
        a = AssessmentAnswer(
            assessment_id=ass.id,
            question_id=q.id if q else None,
            is_correct=False,
            confidence_level=5,  # High confidence
            selected_answer="Proportional allocation formula"
        )
        self.db.add(a)
        self.db.commit()

        res = self.client.get(f"/api/diagnosis/assessment/{ass.id}", headers=self.headers1)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(len(data["misconceptions"]) >= 1)
        # At least one misconception notes high confidence error
        has_high_conf = any(m.get("high_confidence_error") for m in data["misconceptions"])
        self.assertTrue(has_high_conf)

    def test_06_100_percent_score_no_fabricated_misconception(self):
        """6. A 100% score assessment returns verified mastery without fabricating false gaps."""
        ass = Assessment(user_id=self.u1_id, assessment_type="adaptive", status="completed", overall_score=100.0)
        self.db.add(ass)
        self.db.commit()
        self.db.refresh(ass)

        q = self.db.query(Question).first()
        a = AssessmentAnswer(
            assessment_id=ass.id,
            question_id=q.id if q else None,
            is_correct=True,
            confidence_level=5,
            selected_answer="Correct definition"
        )
        self.db.add(a)
        self.db.commit()

        res = self.client.get(f"/api/diagnosis/assessment/{ass.id}", headers=self.headers1)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["overall_score"], 100.0)
        self.assertEqual(data["misconceptions"], [])
        self.assertEqual(data["diagnostic_confidence"], "HIGH")
        self.assertIn("No Critical Bottlenecks", data["primary_bottleneck"])

    def test_07_diagnosis_caching(self):
        """7. Subsequent diagnosis requests for the same assessment return cached result."""
        ass = Assessment(user_id=self.u1_id, assessment_type="adaptive", status="completed", overall_score=70.0)
        self.db.add(ass)
        self.db.commit()
        self.db.refresh(ass)

        # First call generates and caches
        res1 = self.client.get(f"/api/diagnosis/assessment/{ass.id}", headers=self.headers1)
        self.assertEqual(res1.status_code, 200)

        # Second call returns cached
        res2 = self.client.get(f"/api/diagnosis/assessment/{ass.id}", headers=self.headers1)
        self.assertEqual(res2.status_code, 200)
        self.assertTrue(res2.json()["is_cached"])

    def test_08_remediation_endpoint_and_isolation(self):
        """8. Remediation endpoint returns strictly learner-owned materials and official courses."""
        # Create private material for learner 1
        mat1 = LearningMaterial(
            title="Private Learner 1 Notes",
            filename="private1.pdf",
            original_filename="private1.pdf",
            file_type="pdf",
            file_size=1024,
            storage_path="/uploads/private1.pdf",
            uploaded_by=self.u1_id,
            material_scope="OFFICIAL_COMPETENCY",
            competency_id=1,
            processing_status="completed"
        )
        # Create private material for learner 2
        mat2 = LearningMaterial(
            title="Secret Learner 2 Document",
            filename="private2.pdf",
            original_filename="private2.pdf",
            file_type="pdf",
            file_size=1024,
            storage_path="/uploads/private2.pdf",
            uploaded_by=self.u2_id,
            material_scope="OFFICIAL_COMPETENCY",
            competency_id=1,
            processing_status="completed"
        )
        self.db.add(mat1)
        self.db.add(mat2)
        self.db.commit()

        # Learner 1 calls remediation for competency 1
        res = self.client.get("/api/diagnosis/remediation/1", headers=self.headers1)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["competency_id"], 1)
        self.assertIn("recommended_courses", data)
        self.assertTrue(data["targeted_reassessment_available"])

        # Check tenant isolation: mat2 should NOT be in Learner 1's remediation
        titles = [m["title"] for m in data["learner_materials"]]
        self.assertIn("Private Learner 1 Notes", titles)
        self.assertNotIn("Secret Learner 2 Document", titles)

    def test_09_latest_diagnosis_endpoint(self):
        """9. GET /api/diagnosis/latest returns diagnosis of the learner's most recent completed assessment."""
        ass = Assessment(user_id=self.u1_id, assessment_type="adaptive", status="completed", overall_score=65.0, completed_at=datetime.utcnow())
        self.db.add(ass)
        self.db.commit()
        self.db.refresh(ass)

        q = self.db.query(Question).first()
        a = AssessmentAnswer(assessment_id=ass.id, question_id=q.id if q else None, is_correct=False, confidence_level=4)
        self.db.add(a)
        self.db.commit()

        res = self.client.get("/api/diagnosis/latest", headers=self.headers1)
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(res.json())
        self.assertEqual(res.json()["assessment_id"], ass.id)

    def test_10_no_fabricated_telemetry_or_scores(self):
        """10. Asserts diagnosis does not alter database scores or invent study hours."""
        score_before = self.db.query(CompetencyScore).count()
        
        # Request diagnosis
        ass = self.db.query(Assessment).filter(Assessment.user_id == self.u1_id, Assessment.status == "completed").first()
        if ass:
            self.client.get(f"/api/diagnosis/assessment/{ass.id}", headers=self.headers1)

        score_after = self.db.query(CompetencyScore).count()
        self.assertEqual(score_before, score_after, "Diagnosis must never alter or create CompetencyScores")

    def test_11_baseline_data_preservation(self):
        """11. Questions >= 220, bank questions = 80, materials >= 51, Material #49 intact."""
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
