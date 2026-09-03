import unittest
import sys
import uuid
from pathlib import Path

backend_dir = Path(r"d:\Affan\Hackathons\SIH\SmartLearn\backend")
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from main import app
from database import get_db
from models.user import User
from models.role import Role
from models.competency import RoleCompetency, Competency
from models.assessment import Assessment, AssessmentAnswer, Question, QuestionOption
from models.user_competency import UserCompetency, CompetencyScore
from services.competency_service import check_user_baseline_completed

client = TestClient(app)

class TestBaselineRegressionSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db: Session = next(get_db())
        cls.suffix = uuid.uuid4().hex[:8]
        cls.password = "Password123!"

        # Role 1: Statistical Officer (8 competencies)
        cls.stat_reqs = cls.db.query(RoleCompetency).filter(RoleCompetency.role_id == 1).all()
        cls.stat_comp_ids = [r.competency_id for r in cls.stat_reqs]
        cls.stat_comp_names = [cls.db.query(Competency).filter(Competency.id == cid).first().name for cid in cls.stat_comp_ids]
        assert len(cls.stat_comp_ids) == 8

        # Create fresh Statistical Officer learner
        cls.learner_email = f"stat_officer_full_{cls.suffix}@smartlearn.gov.in"
        res = client.post("/api/auth/register", json={
            "full_name": "Full Test Officer",
            "email": cls.learner_email,
            "password": cls.password,
            "confirm_password": cls.password
        })
        assert res.status_code == 200, res.text
        
        login_res = client.post("/api/auth/login", json={"email": cls.learner_email, "password": cls.password})
        cls.token = login_res.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

        # Onboard to Statistical Officer (role 1)
        onboard_res = client.post("/api/users/onboarding", headers=cls.headers, json={
            "role_id": 1,
            "experience_years": 5,
            "work_areas": ["Survey Design", "National Accounts"]
        })
        assert onboard_res.status_code == 200

    @classmethod
    def tearDownClass(cls):
        try:
            cls.db.rollback()
            users = cls.db.query(User).filter(User.email.ilike(f"%{cls.suffix}%")).all()
            for u in users:
                cls.db.query(UserCompetency).filter(UserCompetency.user_id == u.id).delete()
                cls.db.query(CompetencyScore).filter(CompetencyScore.user_id == u.id).delete()
                cls.db.query(Assessment).filter(Assessment.user_id == u.id).delete()
                cls.db.query(User).filter(User.id == u.id).delete()
            cls.db.commit()
        except Exception:
            cls.db.rollback()
        finally:
            cls.db.close()

    def test_01_to_20_complete_baseline_lifecycle(self):
        # TEST 1: New Statistical Officer baseline identifies all 8 required competencies
        start_res = client.post("/api/assessments/start", headers=self.headers, json={
            "assessment_type": "baseline"
        })
        self.assertEqual(start_res.status_code, 200, start_res.text)
        start_data = start_res.json()
        self.assertEqual(len(start_data["competencies_covered"]), 8)
        self.assertEqual(set(start_data["competencies_covered"]), set(self.stat_comp_names))

        # TEST 2: 8 competencies generate 16 baseline question slots
        self.assertEqual(start_data["total_questions"], 16)
        ass_id = start_data["assessment_id"]
        
        ass_db = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        schedule = ass_db.adaptive_state.get("competency_schedule", [])
        self.assertEqual(len(schedule), 16)
        self.assertEqual(ass_db.adaptive_state.get("target_question_count"), 16)

        # TEST 5: First question of each competency is Medium (starts at Q1)
        q1 = start_data["questions"][0]
        self.assertEqual(int(q1["difficulty"]), 2)
        curr_cid = q1["competency_id"]
        self.assertEqual(curr_cid, schedule[0])

        served_questions = [q1]
        served_ids = [q1["id"]]
        served_comp_ids = [q1["competency_id"]]

        # TEST 18: Incomplete baseline keeps learner locked
        me_res = client.get("/api/users/me", headers=self.headers)
        self.assertFalse(me_res.json().get("baseline_completed", False))

        # TEST 20: No competency score is created as a fake value before completion
        scores_before = self.db.query(CompetencyScore).filter(CompetencyScore.user_id == ass_db.user_id).count()
        self.assertEqual(scores_before, 0)

        # TEST 6 & 7: Difficulty Adaptation Test
        # Answer Q1 CORRECTLY -> Expect Q2 in SAME competency to be HARD (3)
        correct_opt = self.db.query(QuestionOption).filter(
            QuestionOption.question_id == q1["id"],
            QuestionOption.is_correct == True
        ).first()
        self.assertIsNotNone(correct_opt)

        q1_step = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers, json={
            "question_id": q1["id"],
            "selected_option_id": correct_opt.id,
            "confidence_level": 3,
            "time_taken_seconds": 12
        })
        self.assertEqual(q1_step.status_code, 200)
        q1_step_data = q1_step.json()

        # TEST 8: After Question 1, assessment remains in_progress
        self.assertFalse(q1_step_data["is_completed"])
        ass_db = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        self.assertEqual(ass_db.status, "in_progress")

        # TEST 9: After Question 1, Question 2 is returned
        q2 = q1_step_data.get("next_question")
        self.assertIsNotNone(q2)
        self.assertEqual(q1_step_data["step"], 2)
        self.assertEqual(q1_step_data["total_steps"], 16)
        served_questions.append(q2)
        served_ids.append(q2["id"])
        served_comp_ids.append(q2["competency_id"])

        # TEST 6: Correct Medium -> Hard (3) for second question
        self.assertEqual(q2["competency_id"], curr_cid)
        self.assertEqual(int(q2["difficulty"]), 3)

        # TEST 15: Refresh/resume returns the exact pending question
        resume_res = client.get(f"/api/assessments/{ass_id}/resume", headers=self.headers)
        self.assertEqual(resume_res.status_code, 200)
        resume_data = resume_res.json()
        self.assertEqual(resume_data["current_question"]["id"], q2["id"])
        self.assertEqual(resume_data["step"], 2)
        self.assertEqual(resume_data["total_steps"], 16)

        # TEST 16: Resume does not create a new Assessment
        count_ass = self.db.query(Assessment).filter(Assessment.user_id == ass_db.user_id).count()
        self.assertEqual(count_ass, 1)

        # Answer Q2 INCORRECTLY
        wrong_opt_q2 = self.db.query(QuestionOption).filter(
            QuestionOption.question_id == q2["id"],
            QuestionOption.is_correct == False
        ).first()

        q2_step = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers, json={
            "question_id": q2["id"],
            "selected_option_id": wrong_opt_q2.id,
            "confidence_level": 2,
            "time_taken_seconds": 15
        })
        self.assertEqual(q2_step.status_code, 200)
        q2_step_data = q2_step.json()

        # TEST 10: After Question 2, assessment does NOT finalize (since total is 16)
        self.assertFalse(q2_step_data["is_completed"])
        q3 = q2_step_data["next_question"]
        self.assertIsNotNone(q3)
        self.assertEqual(q2_step_data["step"], 3)
        served_questions.append(q3)
        served_ids.append(q3["id"])
        served_comp_ids.append(q3["competency_id"])

        # TEST 12: First question of every new competency is Medium (2)
        # Q3 moves to competency 2 in schedule
        self.assertEqual(q3["competency_id"], schedule[2])
        self.assertEqual(int(q3["difficulty"]), 2)

        # Answer Q3 WRONGLY -> verify TEST 7: Wrong Medium -> Easy for second question
        wrong_opt_q3 = self.db.query(QuestionOption).filter(
            QuestionOption.question_id == q3["id"],
            QuestionOption.is_correct == False
        ).first()
        q3_step = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers, json={
            "question_id": q3["id"],
            "selected_option_id": wrong_opt_q3.id,
            "confidence_level": 1,
            "time_taken_seconds": 10
        })
        self.assertEqual(q3_step.status_code, 200)
        q4 = q3_step.json()["next_question"]
        self.assertEqual(q4["competency_id"], schedule[2])
        # TEST 7: Wrong Medium -> Easy (1)
        self.assertEqual(int(q4["difficulty"]), 1)
        served_questions.append(q4)
        served_ids.append(q4["id"])
        served_comp_ids.append(q4["competency_id"])

        # Continue stepping through Q4..Q15
        current_q = q4
        for step_idx in range(4, 16):
            opt = self.db.query(QuestionOption).filter(
                QuestionOption.question_id == current_q["id"]
            ).first()
            step_resp = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers, json={
                "question_id": current_q["id"],
                "selected_option_id": opt.id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            self.assertEqual(step_resp.status_code, 200)
            data = step_resp.json()
            if step_idx < 15:
                self.assertFalse(data["is_completed"])
                current_q = data["next_question"]
                served_questions.append(current_q)
                served_ids.append(current_q["id"])
                served_comp_ids.append(current_q["competency_id"])
            else:
                current_q = data.get("next_question")
                if current_q:
                    served_questions.append(current_q)
                    served_ids.append(current_q["id"])
                    served_comp_ids.append(current_q["competency_id"])

        # Now we are on Question 16 (the final question)
        self.assertEqual(len(served_questions), 16)

        # TEST 14: No repeated Question IDs within the baseline session
        self.assertEqual(len(served_ids), len(set(served_ids)))

        # TEST 3: Actual served questions contain all 8 competency IDs
        self.assertEqual(set(served_comp_ids), set(self.stat_comp_ids))

        # TEST 4: Actual distribution is exactly 2 questions per competency
        from collections import Counter
        comp_counts = Counter(served_comp_ids)
        for cid in self.stat_comp_ids:
            self.assertEqual(comp_counts[cid], 2, f"Competency {cid} did not receive exactly 2 questions")

        # TEST 13: No cross-competency fallback (every question belongs to its scheduled competency)
        for i, q in enumerate(served_questions):
            self.assertEqual(q["competency_id"], schedule[i], f"Step {i+1} competency {q['competency_id']} does not match schedule {schedule[i]}")

        # Now answer Question 16 (Finalize!)
        final_opt = self.db.query(QuestionOption).filter(
            QuestionOption.question_id == current_q["id"]
        ).first()

        final_step = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers, json={
            "question_id": current_q["id"],
            "selected_option_id": final_opt.id,
            "confidence_level": 2,
            "time_taken_seconds": 14
        })
        self.assertEqual(final_step.status_code, 200)
        final_data = final_step.json()

        # TEST 11: Finalization occurs ONLY after all scheduled baseline questions are answered
        self.assertTrue(final_data["is_completed"])
        self.assertIn("result", final_data)

        ass_final = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        self.db.refresh(ass_final)
        self.assertEqual(ass_final.status, "completed")

        # TEST 17: Completed baseline is immutable
        attempt_step = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers, json={
            "question_id": current_q["id"],
            "selected_option_id": final_opt.id,
            "confidence_level": 2,
            "time_taken_seconds": 10
        })
        self.assertEqual(attempt_step.status_code, 200)
        self.assertTrue(attempt_step.json()["is_completed"])

        # TEST 19: Completed baseline unlocks learner
        me_after = client.get("/api/users/me", headers=self.headers)
        self.assertTrue(me_after.json().get("baseline_completed"))

if __name__ == "__main__":
    unittest.main()
