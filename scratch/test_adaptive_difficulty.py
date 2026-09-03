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
from models.competency import Competency, RoleCompetency
from auth.security import create_access_token
from services.adaptive_assessment_service import AdaptiveAssessmentService

client = TestClient(app)

class TestAdaptiveDifficulty(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db: Session = next(get_db())

        # Ensure learner user exists
        cls.learner = cls.db.query(User).filter(User.email == "diff_learner@smartlearn.gov.in").first()
        if not cls.learner:
            cls.learner = User(
                email="diff_learner@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Difficulty Learner Officer",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            cls.db.add(cls.learner)
            cls.db.commit()
            cls.db.refresh(cls.learner)

        cls.token = create_access_token({"sub": cls.learner.email, "role": "learner"})
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

        # Select competencies with rich approved question pools across difficulty tiers
        cls.comp_ids = [1, 2, 3, 4, 5]

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_first_question_is_always_medium(self):
        """TEST 1: The first question of an assessment is ALWAYS Medium (difficulty 2)."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        self.assertEqual(res.status_code, 200)
        q1 = res.json()["questions"][0]
        self.assertEqual(AdaptiveAssessmentService.normalize_difficulty_int(q1["difficulty"]), 2)

    def test_02_correct_medium_promotes_to_hard(self):
        """TEST 2: Answering Q1 (Medium) correctly promotes Q2 of the SAME competency to Hard (difficulty 3)."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = res.json()["assessment_id"]
        q1 = res.json()["questions"][0]
        q1_obj = self.db.query(Question).filter(Question.id == q1["id"]).first()
        correct_opt = next(o for o in q1_obj.options if o.is_correct)

        step_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": q1["id"],
            "selected_option_id": correct_opt.id,
            "confidence_level": 3,
            "time_taken_seconds": 15
        })
        self.assertEqual(step_res.status_code, 200)
        q2 = step_res.json()["next_question"]
        self.assertEqual(q2["competency_id"], q1["competency_id"], "Q2 must belong to SAME competency")
        self.assertEqual(AdaptiveAssessmentService.normalize_difficulty_int(q2["difficulty"]), 3, "Q2 must be Hard")

    def test_03_incorrect_medium_demotes_to_easy(self):
        """TEST 3: Answering Q1 (Medium) incorrectly demotes Q2 of the SAME competency to Easy (difficulty 1)."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = res.json()["assessment_id"]
        q1 = res.json()["questions"][0]
        q1_obj = self.db.query(Question).filter(Question.id == q1["id"]).first()
        incorrect_opt = next(o for o in q1_obj.options if not o.is_correct)

        step_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": q1["id"],
            "selected_option_id": incorrect_opt.id,
            "confidence_level": 1,
            "time_taken_seconds": 10
        })
        self.assertEqual(step_res.status_code, 200)
        q2 = step_res.json()["next_question"]
        self.assertEqual(q2["competency_id"], q1["competency_id"], "Q2 must belong to SAME competency")
        self.assertEqual(AdaptiveAssessmentService.normalize_difficulty_int(q2["difficulty"]), 1, "Q2 must be Easy")

    def test_04_difficulty_adaptation_cannot_change_competency(self):
        """TEST 4: Difficulty changes do NOT alter competency coverage."""
        for is_correct_path in [True, False]:
            res = client.post("/api/assessments/start", headers=self.headers, json={
                "assessment_type": "adaptive",
                "competency_ids": self.comp_ids,
                "question_count": 10,
                "question_type": "MIXED"
            })
            assessment_id = res.json()["assessment_id"]
            q1 = res.json()["questions"][0]
            q1_obj = self.db.query(Question).filter(Question.id == q1["id"]).first()
            opt = next(o for o in q1_obj.options if (o.is_correct if is_correct_path else not o.is_correct))

            step_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
                "question_id": q1["id"],
                "selected_option_id": opt.id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            q2 = step_res.json()["next_question"]
            self.assertEqual(q2["competency_id"], q1["competency_id"])

    def test_05_new_competency_resets_to_medium(self):
        """
        TEST 5: Moving to a new competency always resets to Medium (2),
        regardless of whether previous competency was answered correctly (Hard) or incorrectly (Easy).
        """
        # Test Case A: Comp A answered correctly (Q1 Medium -> Q2 Hard). Then Comp B Q1 MUST be Medium.
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = res.json()["assessment_id"]
        q1 = res.json()["questions"][0]
        q1_obj = self.db.query(Question).filter(Question.id == q1["id"]).first()
        c_opt1 = next(o for o in q1_obj.options if o.is_correct)

        # Submit Q1 (Correct)
        step1 = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": q1["id"],
            "selected_option_id": c_opt1.id,
            "confidence_level": 3,
            "time_taken_seconds": 10
        })
        q2 = step1.json()["next_question"]
        self.assertEqual(AdaptiveAssessmentService.normalize_difficulty_int(q2["difficulty"]), 3)

        # Submit Q2 (Correct)
        q2_obj = self.db.query(Question).filter(Question.id == q2["id"]).first()
        c_opt2 = next(o for o in q2_obj.options if o.is_correct)
        step2 = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": q2["id"],
            "selected_option_id": c_opt2.id,
            "confidence_level": 3,
            "time_taken_seconds": 10
        })
        q3 = step2.json()["next_question"]
        # Q3 is the FIRST question of Competency B -> MUST be Medium!
        self.assertNotEqual(q3["competency_id"], q1["competency_id"])
        self.assertEqual(
            AdaptiveAssessmentService.normalize_difficulty_int(q3["difficulty"]), 2,
            "First question of new competency MUST be Medium"
        )

    def test_06_actual_10_question_distribution_remains_2_per_competency(self):
        """TEST 6: 10 questions across 5 competencies serves exactly 2 questions per competency."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = res.json()["assessment_id"]
        current_q = res.json()["questions"][0]
        served_comp_ids = [current_q["competency_id"]]

        for step in range(1, 11):
            opt_id = current_q["options"][0]["id"]
            step_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
                "question_id": current_q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            if step < 10:
                current_q = step_res.json()["next_question"]
                served_comp_ids.append(current_q["competency_id"])

        counts = Counter(served_comp_ids)
        for cid in self.comp_ids:
            self.assertEqual(counts[cid], 2, f"Competency {cid} served {counts[cid]} times; expected 2")

    def test_07_actual_difficulty_sequence_correct_and_incorrect_paths(self):
        """
        TEST 7:
        All-Correct Path produces: [Med, Hard, Med, Hard, Med, Hard, Med, Hard, Med, Hard]
        All-Incorrect Path produces: [Med, Easy, Med, Easy, Med, Easy, Med, Easy, Med, Easy]
        """
        # All-Correct Path
        res_c = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        ass_id_c = res_c.json()["assessment_id"]
        curr_c = res_c.json()["questions"][0]
        diffs_c = [AdaptiveAssessmentService.normalize_difficulty_int(curr_c["difficulty"])]

        for step in range(1, 11):
            q_obj = self.db.query(Question).filter(Question.id == curr_c["id"]).first()
            c_opt = next(o for o in q_obj.options if o.is_correct)
            step_res = client.post(f"/api/assessments/{ass_id_c}/adaptive-next", headers=self.headers, json={
                "question_id": curr_c["id"],
                "selected_option_id": c_opt.id,
                "confidence_level": 3,
                "time_taken_seconds": 10
            })
            if step < 10:
                curr_c = step_res.json()["next_question"]
                diffs_c.append(AdaptiveAssessmentService.normalize_difficulty_int(curr_c["difficulty"]))

        expected_c = [2, 3, 2, 3, 2, 3, 2, 3, 2, 3]
        self.assertEqual(diffs_c, expected_c, f"Correct path expected {expected_c}, got {diffs_c}")

        # All-Incorrect Path
        res_i = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        ass_id_i = res_i.json()["assessment_id"]
        curr_i = res_i.json()["questions"][0]
        diffs_i = [AdaptiveAssessmentService.normalize_difficulty_int(curr_i["difficulty"])]

        for step in range(1, 11):
            q_obj = self.db.query(Question).filter(Question.id == curr_i["id"]).first()
            i_opt = next(o for o in q_obj.options if not o.is_correct)
            step_res = client.post(f"/api/assessments/{ass_id_i}/adaptive-next", headers=self.headers, json={
                "question_id": curr_i["id"],
                "selected_option_id": i_opt.id,
                "confidence_level": 1,
                "time_taken_seconds": 10
            })
            if step < 10:
                curr_i = step_res.json()["next_question"]
                diffs_i.append(AdaptiveAssessmentService.normalize_difficulty_int(curr_i["difficulty"]))

        expected_i = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
        self.assertEqual(diffs_i, expected_i, f"Incorrect path expected {expected_i}, got {diffs_i}")

    def test_08_resume_preserves_adapted_difficulty(self):
        """TEST 8: Resume after Q1 (Correct) returns the exact pending Hard question."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = res.json()["assessment_id"]
        q1 = res.json()["questions"][0]
        q1_obj = self.db.query(Question).filter(Question.id == q1["id"]).first()
        c_opt = next(o for o in q1_obj.options if o.is_correct)

        # Submit Q1 Correct
        step_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": q1["id"],
            "selected_option_id": c_opt.id,
            "confidence_level": 3,
            "time_taken_seconds": 10
        })
        q2 = step_res.json()["next_question"]

        # Call Resume endpoint
        resume_res = client.get(f"/api/assessments/{assessment_id}/resume", headers=self.headers)
        self.assertEqual(resume_res.status_code, 200)
        resumed_q = resume_res.json()["current_question"]

        self.assertEqual(resumed_q["id"], q2["id"], "Resume must return exact same pending question")
        self.assertEqual(AdaptiveAssessmentService.normalize_difficulty_int(resumed_q["difficulty"]), 3, "Resumed Q2 must be Hard")

    def test_09_refresh_cannot_reset_difficulty(self):
        """TEST 9: Multiple resume calls do not reset or alter the difficulty decision."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = res.json()["assessment_id"]
        q1 = res.json()["questions"][0]
        q1_obj = self.db.query(Question).filter(Question.id == q1["id"]).first()
        i_opt = next(o for o in q1_obj.options if not o.is_correct)

        # Submit Q1 Incorrect -> Q2 is Easy
        client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
            "question_id": q1["id"],
            "selected_option_id": i_opt.id,
            "confidence_level": 1,
            "time_taken_seconds": 10
        })

        for _ in range(3):
            resume_res = client.get(f"/api/assessments/{assessment_id}/resume", headers=self.headers)
            resumed_q = resume_res.json()["current_question"]
            self.assertEqual(AdaptiveAssessmentService.normalize_difficulty_int(resumed_q["difficulty"]), 1)

    def test_10_no_cross_competency_fallback(self):
        """TEST 10: Empty pools in other difficulties relax within competency and never cross competency boundary."""
        # Query a non-existent competency
        q, gen_req = AdaptiveAssessmentService.select_adaptive_question(
            db=self.db,
            user_id=self.learner.id,
            competency_id=99999,
            topic_id=None,
            difficulty=3,
            excluded_ids=[]
        )
        self.assertIsNone(q)
        self.assertTrue(gen_req)

    def test_11_no_repeated_question_ids(self):
        """TEST 11: No question ID is served more than once in the same assessment."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = res.json()["assessment_id"]
        current_q = res.json()["questions"][0]
        seen_ids = [current_q["id"]]

        for step in range(1, 11):
            opt_id = current_q["options"][0]["id"]
            step_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
                "question_id": current_q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            if step < 10:
                current_q = step_res.json()["next_question"]
                seen_ids.append(current_q["id"])

        self.assertEqual(len(seen_ids), len(set(seen_ids)), "All 10 served question IDs must be unique")

    def test_12_completed_assessment_immutability(self):
        """TEST 12: Completed assessments remain immutable and retain their final scores."""
        res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "adaptive",
            "competency_ids": self.comp_ids,
            "question_count": 10,
            "question_type": "MIXED"
        })
        assessment_id = res.json()["assessment_id"]
        current_q = res.json()["questions"][0]

        for step in range(1, 11):
            opt_id = current_q["options"][0]["id"]
            step_res = client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=self.headers, json={
                "question_id": current_q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            if not step_res.json()["is_completed"]:
                current_q = step_res.json()["next_question"]

        self.db.expire_all()
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        self.assertEqual(assessment.status, "completed")
        self.assertIsNotNone(assessment.overall_score)

if __name__ == "__main__":
    unittest.main()
