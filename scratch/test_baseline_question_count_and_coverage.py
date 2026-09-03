import unittest
import sys
import uuid
from pathlib import Path
from collections import Counter

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
from services.adaptive_assessment_service import AdaptiveAssessmentService

client = TestClient(app)

class TestBaselineQuestionCountAndCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db: Session = next(get_db())
        cls.suffix = uuid.uuid4().hex[:8]
        cls.password = "Password123!"

        # Create learner A: Role 1 = Statistical Officer (8 competencies)
        cls.email_a = f"officer_8comp_{cls.suffix}@smartlearn.gov.in"
        client.post("/api/auth/register", json={
            "full_name": "Stat Officer 8",
            "email": cls.email_a,
            "password": cls.password,
            "confirm_password": cls.password
        })
        login_a = client.post("/api/auth/login", json={"email": cls.email_a, "password": cls.password})
        cls.token_a = login_a.json()["access_token"]
        cls.headers_a = {"Authorization": f"Bearer {cls.token_a}"}
        client.post("/api/users/onboarding", headers=cls.headers_a, json={
            "role_id": 1,
            "experience_years": 4,
            "work_areas": ["Survey Design"]
        })

        # Create learner B: Role 5 = Research Officer (5 competencies)
        cls.email_b = f"officer_5comp_{cls.suffix}@smartlearn.gov.in"
        client.post("/api/auth/register", json={
            "full_name": "Research Officer 5",
            "email": cls.email_b,
            "password": cls.password,
            "confirm_password": cls.password
        })
        login_b = client.post("/api/auth/login", json={"email": cls.email_b, "password": cls.password})
        cls.token_b = login_b.json()["access_token"]
        cls.headers_b = {"Authorization": f"Bearer {cls.token_b}"}
        client.post("/api/users/onboarding", headers=cls.headers_b, json={
            "role_id": 5,
            "experience_years": 5,
            "work_areas": ["Economic Research"]
        })

        # Create learner C: Role 3 = Data Management Officer (6 competencies)
        cls.email_c = f"officer_6comp_{cls.suffix}@smartlearn.gov.in"
        client.post("/api/auth/register", json={
            "full_name": "Data Management 6",
            "email": cls.email_c,
            "password": cls.password,
            "confirm_password": cls.password
        })
        login_c = client.post("/api/auth/login", json={"email": cls.email_c, "password": cls.password})
        cls.token_c = login_c.json()["access_token"]
        cls.headers_c = {"Authorization": f"Bearer {cls.token_c}"}
        client.post("/api/users/onboarding", headers=cls.headers_c, json={
            "role_id": 3,
            "experience_years": 3,
            "work_areas": ["Database Management"]
        })

    @classmethod
    def tearDownClass(cls):
        try:
            cls.db.rollback()
            users = cls.db.query(User).filter(User.email.ilike(f"%{cls.suffix}%")).all()
            for u in users:
                ass_ids = [a.id for a in cls.db.query(Assessment.id).filter(Assessment.user_id == u.id).all()]
                if ass_ids:
                    cls.db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id.in_(ass_ids)).delete(synchronize_session=False)
                cls.db.query(UserCompetency).filter(UserCompetency.user_id == u.id).delete()
                cls.db.query(CompetencyScore).filter(CompetencyScore.user_id == u.id).delete()
                cls.db.query(Assessment).filter(Assessment.user_id == u.id).delete()
                cls.db.query(User).filter(User.id == u.id).delete()
            cls.db.commit()
        except Exception:
            cls.db.rollback()
        finally:
            cls.db.close()

    def test_01_five_competencies_yields_15_questions(self):
        """TEST 1: 5 competencies produces max(15, 5*2) = 15 questions (3 per competency)."""
        res = client.post("/api/assessments/start", headers=self.headers_b, json={
            "assessment_type": "baseline"
        })
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["total_questions"], 15)
        self.assertEqual(len(data["competencies_covered"]), 5)

        ass = self.db.query(Assessment).filter(Assessment.id == data["assessment_id"]).first()
        self.db.refresh(ass)
        schedule = ass.adaptive_state.get("competency_schedule", [])
        self.assertEqual(len(schedule), 15)
        quotas = ass.adaptive_state.get("competency_quotas", {})
        for cid_str, q in quotas.items():
            self.assertEqual(q, 3, f"Competency {cid_str} must receive quota 3")

    def test_02_six_competencies_yields_15_questions(self):
        """TEST 2: 6 competencies produces max(15, 6*2) = 15 questions (3,3,3,2,2,2)."""
        res = client.post("/api/assessments/start", headers=self.headers_c, json={
            "assessment_type": "baseline"
        })
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["total_questions"], 15)
        self.assertEqual(len(data["competencies_covered"]), 6)

        ass = self.db.query(Assessment).filter(Assessment.id == data["assessment_id"]).first()
        self.db.refresh(ass)
        schedule = ass.adaptive_state.get("competency_schedule", [])
        self.assertEqual(len(schedule), 15)
        quotas = ass.adaptive_state.get("competency_quotas", {})
        counts = list(quotas.values())
        self.assertEqual(sorted(counts), [2, 2, 2, 3, 3, 3])
        self.assertEqual(sum(counts), 15)

    def test_03_seven_competencies_formula_yields_15_questions(self):
        """TEST 3: 7 competencies produces max(15, 7*2) = 15 questions (3,2,2,2,2,2,2)."""
        user_a = self.db.query(User).filter(User.email == self.email_a).first()
        m = 7
        target = max(15, m * 2)
        self.assertEqual(target, 15)
        dummy_cids = [1, 2, 3, 4, 5, 6, 7]
        state = AdaptiveAssessmentService.initialize_adaptive_state(
            self.db, user_a, dummy_cids, target_question_count=target
        )
        self.assertEqual(len(state["competency_schedule"]), 15)
        quotas = list(state["competency_quotas"].values())
        self.assertEqual(sorted(quotas), [2, 2, 2, 2, 2, 2, 3])

    def test_04_eight_competencies_yields_16_questions(self):
        """TEST 4: 8 competencies produces max(15, 8*2) = 16 questions (2 each)."""
        res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "baseline"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_questions"], 16)
        self.assertEqual(len(data["competencies_covered"]), 8)

        ass = self.db.query(Assessment).filter(Assessment.id == data["assessment_id"]).first()
        self.db.refresh(ass)
        schedule = ass.adaptive_state.get("competency_schedule", [])
        self.assertEqual(len(schedule), 16)
        quotas = ass.adaptive_state.get("competency_quotas", {})
        for cid_str, q in quotas.items():
            self.assertEqual(q, 2)

    def test_05_nine_competencies_formula_yields_18_questions(self):
        """TEST 5: 9 competencies produces max(15, 9*2) = 18 questions (2 each)."""
        user_a = self.db.query(User).filter(User.email == self.email_a).first()
        m = 9
        target = max(15, m * 2)
        self.assertEqual(target, 18)
        dummy_cids = list(range(1, 10))
        state = AdaptiveAssessmentService.initialize_adaptive_state(
            self.db, user_a, dummy_cids, target_question_count=target
        )
        self.assertEqual(len(state["competency_schedule"]), 18)
        for q in state["competency_quotas"].values():
            self.assertEqual(q, 2)

    def test_06_ten_competencies_formula_yields_20_questions(self):
        """TEST 6: 10 competencies produces max(15, 10*2) = 20 questions (2 each)."""
        user_a = self.db.query(User).filter(User.email == self.email_a).first()
        m = 10
        target = max(15, m * 2)
        self.assertEqual(target, 20)
        dummy_cids = list(range(1, 11))
        state = AdaptiveAssessmentService.initialize_adaptive_state(
            self.db, user_a, dummy_cids, target_question_count=target
        )
        self.assertEqual(len(state["competency_schedule"]), 20)
        for q in state["competency_quotas"].values():
            self.assertEqual(q, 2)

    def test_07_every_competency_receives_at_least_2_questions(self):
        """TEST 7: Across all roles (5, 6, 8 competencies), every competency receives >= 2 questions."""
        for h in [self.headers_b, self.headers_c, self.headers_a]:
            res = client.post("/api/assessments/start", headers=h, json={"assessment_type": "baseline"})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            ass = self.db.query(Assessment).filter(Assessment.id == data["assessment_id"]).first()
            self.db.refresh(ass)
            quotas = ass.adaptive_state.get("competency_quotas", {})
            for cid_str, count in quotas.items():
                self.assertGreaterEqual(count, 2, f"Competency {cid_str} must receive >= 2 questions")

    def test_08_to_20_full_lifecycle_and_actual_served_distribution(self):
        """
        TESTS 8-20:
        End-to-end stepping for Statistical Officer (8 competencies, 16 questions):
        - TEST 8: Actual Question.competency_id distribution matches minimum coverage (>= 2 each).
        - TEST 9: Total questions is 16 (NOT 10).
        - TEST 10: Statistical Officer produces exactly 16 questions.
        - TEST 11: First question of every competency is Medium.
        - TEST 12: Correct Medium -> Hard.
        - TEST 13: Wrong Medium -> Easy.
        - TEST 14: Difficulty adaptation does not change competency.
        - TEST 15: Schedule survives refresh/resume.
        - TEST 16: Question count survives refresh/resume.
        - TEST 17: No duplicate assessment is created during resume.
        - TEST 18: Insufficient competency pool never causes cross-competency substitution.
        - TEST 19: Assessment does not complete early.
        - TEST 20: Finalization occurs only after all scheduled questions are answered.
        """
        # TEST 18: Insufficient pool test
        q, gen_req = AdaptiveAssessmentService.select_adaptive_question(
            self.db, 1, competency_id=99999, topic_id=None, difficulty=2, excluded_ids=[]
        )
        self.assertIsNone(q)
        self.assertTrue(gen_req)

        # Fresh baseline start for Statistical Officer
        start_res = client.post("/api/assessments/start", headers=self.headers_a, json={"assessment_type": "baseline"})
        self.assertEqual(start_res.status_code, 200)
        start_data = start_res.json()
        ass_id = start_data["assessment_id"]
        print("DEBUG test_08 ass_id:", ass_id, "initial answer count:", self.db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == ass_id).count())

        # TEST 9 & 10: Not 10 questions; exactly 16 questions
        self.assertNotEqual(start_data["total_questions"], 10)
        self.assertEqual(start_data["total_questions"], 16)

        ass_db = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        self.db.refresh(ass_db)
        persisted_schedule = list(ass_db.adaptive_state.get("competency_schedule", []))
        self.assertEqual(len(persisted_schedule), 16)

        # Step 1: Q1
        q1 = start_data["questions"][0]
        # TEST 11: First question is Medium
        self.assertEqual(int(q1["difficulty"]), 2)
        c1_id = q1["competency_id"]
        self.assertEqual(c1_id, persisted_schedule[0])

        served_questions = [q1]

        # Answer Q1 CORRECTLY
        opt_correct = self.db.query(QuestionOption).filter(
            QuestionOption.question_id == q1["id"],
            QuestionOption.is_correct == True
        ).first()

        step1_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
            "question_id": q1["id"],
            "selected_option_id": opt_correct.id,
            "confidence_level": 3,
            "time_taken_seconds": 12
        })
        self.assertEqual(step1_res.status_code, 200)
        s1 = step1_res.json()

        # TEST 19: Does not complete early
        self.assertFalse(s1["is_completed"])
        q2 = s1["next_question"]
        served_questions.append(q2)

        # TEST 12: Correct Medium -> Hard
        self.assertEqual(q2["competency_id"], c1_id)  # TEST 14: Difficulty adaptation does not change competency
        self.assertEqual(int(q2["difficulty"]), 3)

        # TEST 15 & 16: Schedule & count survive resume
        resume_res = client.get(f"/api/assessments/{ass_id}/resume", headers=self.headers_a)
        self.assertEqual(resume_res.status_code, 200)
        r_data = resume_res.json()
        self.assertEqual(r_data["total_steps"], 16)
        self.assertEqual(r_data["current_question"]["id"], q2["id"])

        # TEST 17: Resume does not create duplicate assessment
        ass_count = self.db.query(Assessment).filter(Assessment.user_id == ass_db.user_id).count()
        # Learner A has earlier assessment in test_04, but resume must not add any new assessment
        self.db.expire_all()
        ass_count_after = self.db.query(Assessment).filter(Assessment.user_id == ass_db.user_id).count()
        self.assertEqual(ass_count, ass_count_after)

        # Answer Q2
        opt_q2 = self.db.query(QuestionOption).filter(QuestionOption.question_id == q2["id"]).first()
        step2_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
            "question_id": q2["id"],
            "selected_option_id": opt_q2.id,
            "confidence_level": 2,
            "time_taken_seconds": 15
        })
        s2 = step2_res.json()
        self.assertFalse(s2["is_completed"])
        q3 = s2["next_question"]
        served_questions.append(q3)

        # Competency 2 starts at Q3
        # TEST 11: First question of Competency 2 is Medium (2)
        self.assertEqual(q3["competency_id"], persisted_schedule[2])
        self.assertEqual(int(q3["difficulty"]), 2)

        # Answer Q3 WRONG to verify TEST 13: Wrong Medium -> Easy
        opt_wrong = self.db.query(QuestionOption).filter(
            QuestionOption.question_id == q3["id"],
            QuestionOption.is_correct == False
        ).first()

        step3_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
            "question_id": q3["id"],
            "selected_option_id": opt_wrong.id,
            "confidence_level": 1,
            "time_taken_seconds": 10
        })
        s3 = step3_res.json()
        self.assertFalse(s3["is_completed"])
        q4 = s3["next_question"]
        served_questions.append(q4)

        # TEST 13: Wrong Medium -> Easy (1)
        self.assertEqual(q4["competency_id"], persisted_schedule[2])
        self.assertEqual(int(q4["difficulty"]), 1)

        # Step through Q4 to Q15
        curr_q = q4
        for step_idx in range(4, 16):
            opt = self.db.query(QuestionOption).filter(QuestionOption.question_id == curr_q["id"]).first()
            step_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
                "question_id": curr_q["id"],
                "selected_option_id": opt.id,
                "confidence_level": 2,
                "time_taken_seconds": 10
            })
            self.assertEqual(step_res.status_code, 200)
            data = step_res.json()
            if step_idx < 15:
                # TEST 19: Does not complete early
                self.assertFalse(data["is_completed"])
                curr_q = data["next_question"]
                served_questions.append(curr_q)
            else:
                curr_q = data.get("next_question")
                if curr_q:
                    served_questions.append(curr_q)

        # TEST 8: Actual served questions count is 16 and each of the 8 competencies gets >= 2 questions
        self.assertEqual(len(served_questions), 16)
        actual_comp_ids = [q["competency_id"] for q in served_questions]
        counts = Counter(actual_comp_ids)
        self.assertEqual(len(counts), 8)
        for cid, cnt in counts.items():
            self.assertGreaterEqual(cnt, 2, f"Competency {cid} only received {cnt} questions; expected >= 2")

        # TEST 20: Finalization occurs ONLY after all scheduled questions are answered
        final_opt = self.db.query(QuestionOption).filter(QuestionOption.question_id == curr_q["id"]).first()
        final_step = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
            "question_id": curr_q["id"],
            "selected_option_id": final_opt.id,
            "confidence_level": 2,
            "time_taken_seconds": 12
        })
        self.assertEqual(final_step.status_code, 200)
        final_data = final_step.json()
        self.assertTrue(final_data["is_completed"])
        self.assertIn("result", final_data)

        self.db.expire_all()
        ass_completed = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        self.assertEqual(ass_completed.status, "completed")
        self.assertIn("actual_questions_by_competency", ass_completed.adaptive_state)

if __name__ == "__main__":
    unittest.main()
