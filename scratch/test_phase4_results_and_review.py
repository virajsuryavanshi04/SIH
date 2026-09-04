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
from models.competency import Competency
from auth.security import create_access_token

client = TestClient(app)

class TestPhase4ResultsAndReview(unittest.TestCase):
    comp_ids = [1, 2, 3, 4, 5]

    @classmethod
    def setUpClass(cls):
        cls.db: Session = next(get_db())

        # Ensure Learner A exists
        cls.learner_a = cls.db.query(User).filter(User.email == "learner_a_p4@smartlearn.gov.in").first()
        if not cls.learner_a:
            cls.learner_a = User(
                email="learner_a_p4@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Learner A Officer",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            cls.db.add(cls.learner_a)
            cls.db.commit()
            cls.db.refresh(cls.learner_a)

        # Ensure Learner B exists
        cls.learner_b = cls.db.query(User).filter(User.email == "learner_b_p4@smartlearn.gov.in").first()
        if not cls.learner_b:
            cls.learner_b = User(
                email="learner_b_p4@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Learner B Officer",
                role="learner",
                designation="Survey Officer",
                role_id=2
            )
            cls.db.add(cls.learner_b)
            cls.db.commit()
            cls.db.refresh(cls.learner_b)

        cls.token_a = create_access_token({"sub": cls.learner_a.email, "role": "learner"})
        cls.headers_a = {"Authorization": f"Bearer {cls.token_a}"}

        cls.token_b = create_access_token({"sub": cls.learner_b.email, "role": "learner"})
        cls.headers_b = {"Authorization": f"Bearer {cls.token_b}"}

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_active_quiz_does_not_expose_correct_answers(self):
        """Active assessment endpoints must NOT expose correct answers or option is_correct flags."""
        start_res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "adaptive",
            "question_type": "SHORT_MCQ",
            "question_count": 10,
            "competency_ids": self.comp_ids
        })
        self.assertEqual(start_res.status_code, 200)
        start_data = start_res.json()
        q1 = start_data["questions"][0]

        # Verify options do not expose is_correct
        for opt in q1["options"]:
            self.assertNotIn("is_correct", opt, "Option in active quiz start must not leak is_correct")

        # Verify next question in active adaptive step also does not expose is_correct
        opt_id = q1["options"][0]["id"]
        step_res = client.post(f"/api/assessments/{start_data['assessment_id']}/adaptive-next", headers=self.headers_a, json={
            "question_id": q1["id"],
            "selected_option_id": opt_id,
            "confidence_level": 2,
            "time_taken_seconds": 10
        })
        self.assertEqual(step_res.status_code, 200)
        step_data = step_res.json()
        if step_data.get("next_question"):
            for opt in step_data["next_question"]["options"]:
                self.assertNotIn("is_correct", opt, "Option in adaptive-next must not leak is_correct")

    def test_02_assessment_result_summary_and_score_consistency(self):
        """
        Verify that 10, 15, and 20 question assessments calculate exact scores,
        correct + incorrect == total_questions, and match authoritative backend data.
        """
        for target_count in [10, 15, 20]:
            start_res = client.post("/api/assessments/start", headers=self.headers_a, json={
                "assessment_type": "adaptive",
                "question_type": "SHORT_MCQ",
                "question_count": target_count,
                "competency_ids": self.comp_ids
            })
            self.assertEqual(start_res.status_code, 200)
            ass_id = start_res.json()["assessment_id"]
            current_q = start_res.json()["questions"][0]

            # Complete step by step with alternating known answers
            for step in range(target_count):
                # Pick option 0 for even steps, option 1 (if available) for odd steps
                opts = current_q["options"]
                selected_opt_id = opts[0]["id"] if (step % 2 == 0 or len(opts) < 2) else opts[1]["id"]

                step_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
                    "question_id": current_q["id"],
                    "selected_option_id": selected_opt_id,
                    "confidence_level": 3 if step % 2 == 0 else 1,
                    "time_taken_seconds": 12 + step
                })
                self.assertEqual(step_res.status_code, 200)
                step_data = step_res.json()

                if step_data.get("is_completed"):
                    break
                current_q = step_data.get("next_question")

            # Fetch authoritative result via GET /api/assessments/{id}/result
            res = client.get(f"/api/assessments/{ass_id}/result", headers=self.headers_a)
            self.assertEqual(res.status_code, 200)
            result = res.json()

            # Assert Total, Correct, Incorrect counts
            self.assertEqual(result["total_questions"], target_count, f"Total questions must be {target_count}")
            self.assertEqual(result["total_correct"] + result["total_incorrect"], target_count)
            expected_score = round((result["total_correct"] / target_count) * 100.0, 1)
            self.assertEqual(result["overall_score"], expected_score)

            # Assert Configuration summary
            self.assertIsNotNone(result.get("configuration"))
            self.assertEqual(result["configuration"]["question_count"], target_count)
            self.assertIn("Short MCQ", result["configuration"]["question_type"])

    def test_03_question_response_review_details(self):
        """
        Verify every completed question contains question text, all options,
        learner selected answer, correct answer, correctness status, confidence,
        response time, and official explanation.
        """
        start_res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "adaptive",
            "question_type": "SHORT_MCQ",
            "question_count": 10,
            "competency_ids": self.comp_ids
        })
        ass_id = start_res.json()["assessment_id"]
        current_q = start_res.json()["questions"][0]

        for step in range(10):
            opt_id = current_q["options"][0]["id"]
            step_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
                "question_id": current_q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 3,
                "time_taken_seconds": 14
            })
            if step_res.json().get("is_completed"):
                break
            current_q = step_res.json().get("next_question")

        res = client.get(f"/api/assessments/{ass_id}/result", headers=self.headers_a)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        responses = data.get("responses", [])
        self.assertEqual(len(responses), 10, "Response review must contain exactly 10 questions")

        for idx, item in enumerate(responses, 1):
            self.assertEqual(item["question_number"], idx)
            self.assertIsNotNone(item["question_id"])
            self.assertIsNotNone(item["question_text"])
            self.assertGreaterEqual(len(item["options"]), 2)
            self.assertIsNotNone(item["learner_selected_option_id"])
            self.assertIsNotNone(item["learner_selected_text"])
            self.assertIsNotNone(item["correct_option_id"])
            self.assertIsNotNone(item["correct_option_text"])
            self.assertIsInstance(item["is_correct"], bool)
            self.assertEqual(item["confidence_level"], 3)
            self.assertIsNotNone(item["time_taken_seconds"])
            self.assertIsNotNone(item["explanation"])

            # Verify explanation matches Question record in DB
            db_q = self.db.query(Question).filter(Question.id == item["question_id"]).first()
            if db_q.explanation:
                self.assertEqual(item["explanation"], db_q.explanation)

    def test_04_dimension_performance_aggregations(self):
        """Verify performance by competency, question type, difficulty, and confidence."""
        start_res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "adaptive",
            "question_type": "SHORT_MCQ",
            "question_count": 10,
            "competency_ids": self.comp_ids
        })
        ass_id = start_res.json()["assessment_id"]
        current_q = start_res.json()["questions"][0]

        for step in range(10):
            opt_id = current_q["options"][0]["id"]
            step_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
                "question_id": current_q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 2,
                "time_taken_seconds": 11
            })
            if step_res.json().get("is_completed"):
                break
            current_q = step_res.json().get("next_question")

        res = client.get(f"/api/assessments/{ass_id}/result", headers=self.headers_a)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Check Question Type performance
        q_type_perf = data.get("question_type_performance", [])
        self.assertGreaterEqual(len(q_type_perf), 1)
        self.assertEqual(q_type_perf[0]["name"], "Short MCQ")
        self.assertEqual(q_type_perf[0]["total"], 10)

        # Check Difficulty performance
        diff_perf = data.get("difficulty_performance", [])
        self.assertGreaterEqual(len(diff_perf), 1)
        total_diff_questions = sum(d["total"] for d in diff_perf)
        self.assertEqual(total_diff_questions, 10)

        # Check Confidence performance
        conf_perf = data.get("confidence_performance")
        self.assertIsNotNone(conf_perf)
        self.assertEqual(conf_perf["medium_count"], 10)

    def test_05_result_ownership_security(self):
        """
        Learner A viewing own result -> 200.
        Learner B viewing Learner A's result -> 403 Forbidden.
        Non-existent result -> 404 Not Found.
        """
        # Create completed assessment for Learner A
        start_res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "adaptive",
            "question_type": "SHORT_MCQ",
            "question_count": 10,
            "competency_ids": self.comp_ids
        })
        ass_id = start_res.json()["assessment_id"]
        current_q = start_res.json()["questions"][0]

        for step in range(10):
            opt_id = current_q["options"][0]["id"]
            step_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
                "question_id": current_q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            if step_res.json().get("is_completed"):
                break
            current_q = step_res.json().get("next_question")

        # Learner A accesses own result
        res_a = client.get(f"/api/assessments/{ass_id}/result", headers=self.headers_a)
        self.assertEqual(res_a.status_code, 200)

        # Learner B attempts to access Learner A's result
        res_b = client.get(f"/api/assessments/{ass_id}/result", headers=self.headers_b)
        self.assertEqual(res_b.status_code, 403)
        self.assertIn("Access denied", res_b.json()["detail"])

        # Non-existent assessment
        res_none = client.get("/api/assessments/999999/result", headers=self.headers_a)
        self.assertEqual(res_none.status_code, 404)

    def test_06_database_data_preservation(self):
        """Verify 220 questions, 80 bank questions, and existing records remain intact."""
        total_questions = self.db.query(Question).count()
        self.assertGreaterEqual(total_questions, 220)

        bank_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        self.assertEqual(bank_count, 80)

if __name__ == "__main__":
    unittest.main()
