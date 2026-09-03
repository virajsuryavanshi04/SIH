import os
import sys
import unittest
from pathlib import Path
from collections import Counter

# Add backend to path
backend_dir = Path(r"d:\Affan\Hackathons\SIH\SmartLearn\backend")
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

class TestAssessmentPersistenceAndDistribution(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db: Session = next(get_db())

        # Ensure learner user exists
        cls.learner = cls.db.query(User).filter(User.email == "persist_learner@smartlearn.gov.in").first()
        if not cls.learner:
            cls.learner = User(
                email="persist_learner@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Persist Learner Officer",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            cls.db.add(cls.learner)
            cls.db.commit()
            cls.db.refresh(cls.learner)

        cls.token = create_access_token({"sub": cls.learner.email, "role": "learner"})
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

        # Select competencies that have approved question pools
        cls.comp_ids = [1, 2, 3, 4, 5]

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_assessment_creation_persists_schedule_and_pending_question(self):
        """Starting an assessment stores an immutable competency_schedule and pending_question_id."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        assessment_id = data["assessment_id"]
        q1 = data["questions"][0]

        # Inspect database record
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        self.assertIsNotNone(assessment)
        self.assertEqual(assessment.status, "in_progress")
        self.assertIn("competency_schedule", assessment.adaptive_state)
        schedule = assessment.adaptive_state["competency_schedule"]
        self.assertEqual(len(schedule), 10)
        self.assertEqual(assessment.adaptive_state.get("pending_question_id"), q1["id"])

    def test_02_resume_endpoint_reconstructs_exact_session_without_creating_new_assessment(self):
        """GET /api/assessments/{id}/resume reconstructs session state without creating duplicate records."""
        pre_count = self.db.query(Assessment).count()

        # Start an assessment
        start_res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = start_res.json()["assessment_id"]
        q1_id = start_res.json()["questions"][0]["id"]

        # Call resume endpoint
        resume_res = client.get(f"/api/assessments/{assessment_id}/resume", headers=self.headers)
        self.assertEqual(resume_res.status_code, 200)
        res_data = resume_res.json()

        self.assertEqual(res_data["assessment_id"], assessment_id)
        self.assertEqual(res_data["status"], "in_progress")
        self.assertFalse(res_data["is_completed"])
        self.assertEqual(res_data["step"], 1)
        self.assertEqual(res_data["total_steps"], 10)
        # Verify EXACT same pending question ID is returned
        self.assertEqual(res_data["current_question"]["id"], q1_id)

        # Assert no extra Assessment row was created
        post_count = self.db.query(Assessment).count()
        self.assertEqual(post_count, pre_count + 1)

    def test_03_actual_served_questions_have_exact_competency_distribution_10q_5c(self):
        """
        10 questions across 5 competencies must serve EXACTLY 2 questions per competency.
        Inspects actual Question.competency_id for each served question.
        """
        start_res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        self.assertEqual(start_res.status_code, 200)
        start_data = start_res.json()
        assessment_id = start_data["assessment_id"]

        served_comp_ids = []
        current_q = start_data["questions"][0]

        # Step 1 question
        q_db = self.db.query(Question).filter(Question.id == current_q["id"]).first()
        served_comp_ids.append(q_db.competency_id)

        # Walk through all 10 questions
        for step in range(1, 11):
            opt_id = current_q["options"][0]["id"]
            step_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
                "question_id": current_q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            self.assertEqual(step_res.status_code, 200)
            step_data = step_res.json()

            if step < 10:
                self.assertFalse(step_data["is_completed"])
                next_q = step_data["next_question"]
                self.assertIsNotNone(next_q)
                q_db_next = self.db.query(Question).filter(Question.id == next_q["id"]).first()
                served_comp_ids.append(q_db_next.competency_id)
                current_q = next_q
            else:
                # Step 10 completes
                self.assertTrue(step_data["is_completed"])

        # Inspect served competency counts
        comp_counts = Counter(served_comp_ids)
        self.assertEqual(len(served_comp_ids), 10, "Should have served exactly 10 questions")
        for cid in self.comp_ids:
            self.assertEqual(
                comp_counts[cid], 2,
                f"Competency {cid} was served {comp_counts[cid]} times; expected exactly 2."
            )

    def test_04_error_on_step1_adapts_to_easy_within_same_comp_then_progresses(self):
        """Answering Question 1 incorrectly demotes Q2 to Easy in Comp 1, then progresses to Comp 2 for Q3."""
        start_res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = start_res.json()["assessment_id"]
        q1 = start_res.json()["questions"][0]

        # Find an INCORRECT option for Q1
        q1_obj = self.db.query(Question).filter(Question.id == q1["id"]).first()
        incorrect_opt = next(o for o in q1_obj.options if not o.is_correct)

        # Submit incorrect answer on Q1
        step1_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": q1["id"],
            "selected_option_id": incorrect_opt.id,
            "confidence_level": 1,
            "time_taken_seconds": 12
        })
        self.assertEqual(step1_res.status_code, 200)
        q2 = step1_res.json()["next_question"]
        q2_obj = self.db.query(Question).filter(Question.id == q2["id"]).first()

        # Q2 must be in SAME Competency 1, with difficulty Easy (1)
        self.assertEqual(q2_obj.competency_id, self.comp_ids[0])
        self.assertEqual(int(q2_obj.difficulty), 1)

        # Submit Q2 answer
        step2_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": q2["id"],
            "selected_option_id": q2_obj.options[0].id,
            "confidence_level": 2,
            "time_taken_seconds": 10
        })
        self.assertEqual(step2_res.status_code, 200)
        q3 = step2_res.json()["next_question"]
        q3_obj = self.db.query(Question).filter(Question.id == q3["id"]).first()

        # Q3 must move to Competency 2, with starting difficulty Medium (2)
        self.assertEqual(q3_obj.competency_id, self.comp_ids[1])
        self.assertEqual(int(q3_obj.difficulty), 2)

    def test_05_completed_assessment_is_immutable(self):
        """Once status is completed, further answer submissions return completed state without modifying data."""
        # Start and fast-complete a 10-question assessment
        start_res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = start_res.json()["assessment_id"]
        current_q = start_res.json()["questions"][0]

        last_q = current_q
        for step in range(1, 11):
            opt_id = current_q["options"][0]["id"]
            res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
                "question_id": current_q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            if not res.json()["is_completed"]:
                current_q = res.json()["next_question"]
                last_q = current_q

        # Verify status in database
        self.db.expire_all()
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        self.assertEqual(assessment.status, "completed")
        answers_count = self.db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).count()
        self.assertEqual(answers_count, 10)

        # Attempt another submission on completed assessment
        late_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": last_q["id"],
            "selected_option_id": last_q["options"][0]["id"],
            "confidence_level": 3,
            "time_taken_seconds": 5
        })
        self.assertEqual(late_res.status_code, 200)
        self.assertTrue(late_res.json()["is_completed"])

        # Verify answers count was not modified
        post_answers_count = self.db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).count()
        self.assertEqual(post_answers_count, 10)

    def test_06_resume_on_completed_assessment_returns_is_completed(self):
        """Calling resume on a completed assessment returns is_completed=True and result object."""
        self.db.expire_all()
        completed_assess = self.db.query(Assessment).filter(
            Assessment.user_id == self.learner.id,
            Assessment.status == "completed"
        ).order_by(Assessment.id.desc()).first()
        self.assertIsNotNone(completed_assess)

        res = client.get(f"/api/assessments/{completed_assess.id}/resume", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["is_completed"])
        self.assertEqual(data["status"], "completed")
        self.assertIn("result", data)

    def test_07_insufficient_competency_pool_does_not_cross_substitute(self):
        """
        If a competency has no approved questions available, select_adaptive_question
        must return None rather than crossing into other competencies.
        """
        from services.adaptive_assessment_service import AdaptiveAssessmentService
        # Test with an unpopulated competency ID (e.g. 16 or 99999)
        q, gen_req = AdaptiveAssessmentService.select_adaptive_question(
            db=self.db,
            user_id=self.learner.id,
            competency_id=16,
            topic_id=None,
            difficulty=2,
            excluded_ids=[]
        )
        self.assertIsNone(q, "Should not return a question from another competency")
        self.assertTrue(gen_req, "Should signal question generation required / insufficient pool")

if __name__ == "__main__":
    unittest.main()
