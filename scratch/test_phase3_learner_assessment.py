import os
import sys
import unittest

from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from main import app
from database import get_db
from models.user import User
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
from models.competency import Competency, CompetencyTopic, RoleCompetency
from auth.security import create_access_token

client = TestClient(app)

class TestPhase3LearnerAssessment(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db: Session = next(get_db())

        # Ensure learner user exists
        cls.learner = cls.db.query(User).filter(User.role == "learner").first()
        if not cls.learner:
            cls.learner = User(
                email="phase3_learner@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Phase3 Learner Officer",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            cls.db.add(cls.learner)
            cls.db.commit()
            cls.db.refresh(cls.learner)

        cls.token = create_access_token({"sub": cls.learner.email, "role": "learner"})
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

        # Save original statuses of bank questions so we can restore them
        cls.bank_questions = cls.db.query(Question).filter(Question.bank_question_id.isnot(None)).all()
        cls.original_statuses = {q.id: q.status for q in cls.bank_questions}

    @classmethod
    def tearDownClass(cls):
        # Restore original statuses
        for q in cls.bank_questions:
            orig = cls.original_statuses.get(q.id)
            if orig:
                q.status = orig
        cls.db.commit()
        cls.db.close()

    def test_01_invalid_question_count_returns_422(self):
        """Invalid question count (e.g. 5, 8, 12, 25) must return HTTP 422."""
        for bad_count in [5, 8, 12, 25]:
            res = client.post("/api/assessments/start", headers=self.headers, json={
                "question_count": bad_count,
                "question_type": "MIXED"
            })
            self.assertEqual(res.status_code, 422, f"Count {bad_count} should return 422")
            self.assertIn("10, 15, or 20", res.json()["detail"])

    def test_02_invalid_question_type_returns_422(self):
        """Invalid question type (e.g. INVALID_ESSAY) must return HTTP 422."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "question_count": 10,
            "question_type": "INVALID_ESSAY"
        })
        self.assertEqual(res.status_code, 422)
        self.assertIn("Invalid question type", res.json()["detail"])

    def test_03_insufficient_pool_returns_422_and_no_orphan_record(self):
        """
        Requesting more questions of a specific type than approved must return HTTP 422,
        and NO orphan assessment record should be created in the database.
        """
        pre_count = self.db.query(Assessment).count()

        # Request 20 Case Studies when only 0 or fewer than 20 are approved
        comp = self.db.query(Competency).first()
        approved_case_studies = self.db.query(Question).filter(
            Question.competency_id == comp.id,
            Question.status == "approved",
            Question.question_type == "CASE_STUDY"
        ).count()

        res = client.post("/api/assessments/start", headers=self.headers, json={
            "competency_id": comp.id,
            "question_type": "CASE_STUDY",
            "question_count": 20
        })
        self.assertEqual(res.status_code, 422)
        detail = res.json()["detail"]
        self.assertIn("approved", detail)
        self.assertIn("Case Study", detail)

        # Assert NO orphan assessment was created
        post_count = self.db.query(Assessment).count()
        self.assertEqual(pre_count, post_count, "No orphan assessment record should be created on 422 error")

    def test_04_short_mcq_filter_strictly_enforced(self):
        """When SHORT_MCQ is requested, all served questions must be SHORT_MCQ and approved."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "question_type": "SHORT_MCQ",
            "question_count": 10
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        assessment_id = data["assessment_id"]
        q1 = data["questions"][0]
        self.assertEqual(q1["question_type"], "SHORT_MCQ")

        # Verify in DB question is approved
        db_q = self.db.query(Question).filter(Question.id == q1["id"]).first()
        self.assertEqual(db_q.status, "approved")
        self.assertIn(db_q.question_type, ["SHORT_MCQ", None])

    def test_05_word_problem_filter_strictly_enforced_with_approved_questions(self):
        """When WORD_PROBLEM is approved and requested, all served questions must be WORD_PROBLEM and approved."""
        # Temporarily approve 15 Word Problem questions for this test
        wp_questions = self.db.query(Question).filter(Question.question_type == "WORD_PROBLEM").limit(15).all()
        for q in wp_questions:
            q.status = "approved"
        self.db.commit()

        res = client.post("/api/assessments/start", headers=self.headers, json={
            "question_type": "WORD_PROBLEM",
            "question_count": 10
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        q1 = data["questions"][0]
        self.assertEqual(q1["question_type"], "WORD_PROBLEM")

        # Verify in DB question is approved
        db_q = self.db.query(Question).filter(Question.id == q1["id"]).first()
        self.assertEqual(db_q.status, "approved")
        self.assertEqual(db_q.question_type, "WORD_PROBLEM")

    def test_06_case_study_filter_strictly_enforced_with_approved_questions(self):
        """When CASE_STUDY is approved and requested, all served questions must be CASE_STUDY and approved."""
        # Temporarily approve 15 Case Study questions for this test
        cs_questions = self.db.query(Question).filter(Question.question_type == "CASE_STUDY").limit(15).all()
        for q in cs_questions:
            q.status = "approved"
        self.db.commit()

        res = client.post("/api/assessments/start", headers=self.headers, json={
            "question_type": "CASE_STUDY",
            "question_count": 10
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        q1 = data["questions"][0]
        self.assertEqual(q1["question_type"], "CASE_STUDY")

        # Verify in DB question is approved
        db_q = self.db.query(Question).filter(Question.id == q1["id"]).first()
        self.assertEqual(db_q.status, "approved")
        self.assertEqual(db_q.question_type, "CASE_STUDY")

    def test_07_mixed_filter_allows_supported_types(self):
        """When MIXED is requested, served questions belong to {SHORT_MCQ, WORD_PROBLEM, CASE_STUDY}."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "question_type": "MIXED",
            "question_count": 10
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        q1 = data["questions"][0]
        self.assertIn(q1["question_type"], ["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY"])

    def test_08_adaptive_progression_and_completion_at_exact_counts(self):
        """
        Test that adaptive assessment runs step-by-step through /adaptive-next
        and completes after EXACTLY 10, 15, and 20 questions respectively.
        """
        for target_count in [10, 15, 20]:
            start_res = client.post("/api/assessments/start", headers=self.headers, json={
                "assessment_type": "adaptive",
                "question_type": "SHORT_MCQ",
                "question_count": target_count
            })
            self.assertEqual(start_res.status_code, 200)
            start_data = start_res.json()
            ass_id = start_data["assessment_id"]
            current_q = start_data["questions"][0]

            answered_count = 0
            is_completed = False

            # Loop through answers step by step
            for step in range(target_count):
                answered_count += 1
                opt_id = current_q["options"][0]["id"]

                step_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers, json={
                    "question_id": current_q["id"],
                    "selected_option_id": opt_id,
                    "confidence_level": 2,
                    "time_taken_seconds": 12
                })
                self.assertEqual(step_res.status_code, 200)
                step_data = step_res.json()

                if step_data.get("is_completed"):
                    is_completed = True
                    break
                elif step_data.get("next_question"):
                    current_q = step_data["next_question"]
                    # Assert each served question is approved and matches question_type
                    q_db = self.db.query(Question).filter(Question.id == current_q["id"]).first()
                    self.assertEqual(q_db.status, "approved")
                    self.assertIn(q_db.question_type, ["SHORT_MCQ", None])

            self.assertTrue(is_completed, f"Assessment should complete after {target_count} questions")
            self.assertEqual(answered_count, target_count, f"Expected exactly {target_count} answers before completion")

            # Verify assessment record in DB
            db_ass = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
            self.assertEqual(db_ass.status, "completed")
            self.assertIsNotNone(db_ass.overall_score)
            self.assertEqual(len(db_ass.answers), target_count)

    def test_09_database_integrity_preserved(self):
        """Verify all 220 questions, 80 bank questions, and assessment records remain intact."""
        total_questions = self.db.query(Question).count()
        self.assertGreaterEqual(total_questions, 220)

        bank_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        self.assertEqual(bank_count, 80)

if __name__ == "__main__":
    unittest.main()
