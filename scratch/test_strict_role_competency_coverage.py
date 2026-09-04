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
from models.assessment import Assessment, AssessmentAnswer, Question
from models.user_competency import UserCompetency, CompetencyScore
from services.competency_service import check_user_baseline_completed

client = TestClient(app)

class TestStrictRoleCompetencyCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db: Session = next(get_db())
        cls.suffix = uuid.uuid4().hex[:8]
        
        # 1. Role 1: Statistical Officer (8 competencies)
        cls.stat_role = cls.db.query(Role).filter(Role.id == 1).first()
        stat_reqs = cls.db.query(RoleCompetency).filter(RoleCompetency.role_id == 1).all()
        cls.stat_comp_ids = [r.competency_id for r in stat_reqs]
        cls.stat_comp_names = [cls.db.query(Competency).filter(Competency.id == cid).first().name for cid in cls.stat_comp_ids]
        assert len(cls.stat_comp_ids) == 8, f"Statistical Officer must have 8 competencies, found {len(cls.stat_comp_ids)}"

        # 2. Role 5: Research Officer (5 competencies)
        cls.research_role = cls.db.query(Role).filter(Role.id == 5).first()
        res_reqs = cls.db.query(RoleCompetency).filter(RoleCompetency.role_id == 5).all()
        cls.research_comp_ids = [r.competency_id for r in res_reqs]
        cls.research_comp_names = [cls.db.query(Competency).filter(Competency.id == cid).first().name for cid in cls.research_comp_ids]
        assert len(cls.research_comp_ids) == 5, f"Research Officer must have 5 competencies, found {len(cls.research_comp_ids)}"

        # 3. Create User A (Statistical Officer)
        cls.user_a_email = f"stat_officer_{cls.suffix}@smartlearn.gov.in"
        cls.password = "Password123!"
        res_a = client.post("/api/auth/register", json={
            "full_name": "Stat Officer A",
            "email": cls.user_a_email,
            "password": cls.password,
            "confirm_password": cls.password
        })
        assert res_a.status_code == 200, res_a.text
        login_a = client.post("/api/auth/login", json={"email": cls.user_a_email, "password": cls.password})
        cls.token_a = login_a.json()["access_token"]
        cls.headers_a = {"Authorization": f"Bearer {cls.token_a}"}

        # Onboard User A to Statistical Officer
        onboard_a = client.post("/api/users/onboarding", headers=cls.headers_a, json={
            "role_id": 1,
            "experience_years": 4,
            "work_areas": ["Survey Design"]
        })
        assert onboard_a.status_code == 200

        # 4. Create User B (Research Officer)
        cls.user_b_email = f"research_officer_{cls.suffix}@smartlearn.gov.in"
        res_b = client.post("/api/auth/register", json={
            "full_name": "Research Officer B",
            "email": cls.user_b_email,
            "password": cls.password,
            "confirm_password": cls.password
        })
        assert res_b.status_code == 200, res_b.text
        login_b = client.post("/api/auth/login", json={"email": cls.user_b_email, "password": cls.password})
        cls.token_b = login_b.json()["access_token"]
        cls.headers_b = {"Authorization": f"Bearer {cls.token_b}"}

        # Onboard User B to Research Officer
        onboard_b = client.post("/api/users/onboarding", headers=cls.headers_b, json={
            "role_id": 5,
            "experience_years": 6,
            "work_areas": ["Policy Research"]
        })
        assert onboard_b.status_code == 200

    @classmethod
    def tearDownClass(cls):
        try:
            cls.db.rollback()
            users = cls.db.query(User).filter(User.email.ilike(f"%{cls.suffix}%")).all()
            for u in users:
                cls.db.query(UserCompetency).filter(UserCompetency.user_id == u.id).delete()
                cls.db.query(CompetencyScore).filter(CompetencyScore.user_id == u.id).delete()
                ass_ids = [a.id for a in cls.db.query(Assessment.id).filter(Assessment.user_id == u.id).all()]
                if ass_ids:
                    cls.db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id.in_(ass_ids)).delete(synchronize_session=False)
                cls.db.query(Assessment).filter(Assessment.user_id == u.id).delete()
                cls.db.query(User).filter(User.id == u.id).delete()
            temp_roles = cls.db.query(Role).filter(Role.name.ilike(f"%{cls.suffix}%")).all()
            for r in temp_roles:
                cls.db.query(RoleCompetency).filter(RoleCompetency.role_id == r.id).delete()
                cls.db.query(Role).filter(Role.id == r.id).delete()
            temp_comps = cls.db.query(Competency).filter(Competency.name.ilike(f"%{cls.suffix}%")).all()
            for c in temp_comps:
                cls.db.query(RoleCompetency).filter(RoleCompetency.competency_id == c.id).delete()
                cls.db.query(Competency).filter(Competency.id == c.id).delete()
            cls.db.commit()
        except Exception:
            cls.db.rollback()
        finally:
            cls.db.close()

    def test_01_statistical_officer_baseline_covers_all_8_competencies(self):
        """TEST 1: Statistical Officer with 8 competencies receives all 8 in baseline."""
        res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "baseline",
            "question_count": 16
        })
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        covered_comps = data.get("competencies_covered", [])
        self.assertEqual(len(covered_comps), 8)
        self.assertEqual(set(covered_comps), set(self.stat_comp_names))

    def test_02_actual_served_questions_contain_every_required_competency_id(self):
        """TEST 2: Actual served questions in baseline contain every required competency ID."""
        user = self.db.query(User).filter(User.email == self.user_a_email).first()
        ass = self.db.query(Assessment).filter(
            Assessment.user_id == user.id,
            Assessment.status == "in_progress"
        ).order_by(Assessment.id.desc()).first()
        self.assertIsNotNone(ass)
        
        schedule = ass.adaptive_state.get("competency_schedule", [])
        self.assertEqual(len(schedule), 16)
        self.assertEqual(set(schedule), set(self.stat_comp_ids))

    def test_03_no_learner_selectable_competency_subset_can_alter_baseline(self):
        """TEST 3: Frontend-supplied competency_id / competency_ids cannot alter baseline coverage."""
        res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "baseline",
            "competency_id": 1,
            "competency_ids": [1],
            "question_count": 16
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        covered = data.get("competencies_covered", [])
        # Strict Invariant: Frontend override is ignored; all 8 role competencies are scheduled
        self.assertEqual(len(covered), 8)
        self.assertEqual(set(covered), set(self.stat_comp_names))

    def test_04_every_competency_receives_at_least_one_question(self):
        """TEST 4: Every required competency receives at least one question (no 0-question competencies)."""
        res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "baseline",
            "question_count": 10
        })
        self.assertEqual(res.status_code, 200)
        ass_id = res.json()["assessment_id"]
        ass = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        schedule = ass.adaptive_state.get("competency_schedule", [])
        self.assertEqual(len(schedule), 16)
        for cid in self.stat_comp_ids:
            self.assertIn(cid, schedule)
            self.assertEqual(schedule.count(cid), 2)

    def test_05_eight_competencies_and_16_questions_yields_2_questions_per_competency(self):
        """TEST 5: With 8 competencies and 16 questions, distribution is exactly 2 questions per competency."""
        res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "baseline",
            "question_count": 16
        })
        self.assertEqual(res.status_code, 200)
        ass_id = res.json()["assessment_id"]
        ass = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        schedule = ass.adaptive_state.get("competency_schedule", [])
        self.assertEqual(len(schedule), 16)
        for cid in self.stat_comp_ids:
            self.assertEqual(schedule.count(cid), 2, f"Competency {cid} must receive exactly 2 questions")

    def test_06_first_question_of_every_competency_is_medium(self):
        """TEST 6: First question of every competency starts at Medium (difficulty 2)."""
        res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "baseline",
            "question_count": 16
        })
        ass_id = res.json()["assessment_id"]
        ass = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        self.assertEqual(ass.adaptive_state["current_difficulty"], 2)

    def test_07_and_08_and_09_adaptive_difficulty_progression_within_competency(self):
        """TEST 7, 8, 9: Medium+Correct->Hard, Medium+Wrong->Easy, and difficulty adaptation never changes competency."""
        res = client.post("/api/assessments/start", headers=self.headers_a, json={
            "assessment_type": "baseline",
            "question_count": 16
        })
        ass_id = res.json()["assessment_id"]
        ass = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        schedule = ass.adaptive_state["competency_schedule"]
        first_comp = schedule[0]
        second_comp = schedule[2]

        # Step 1: Answer Question 1 (Medium) Correctly
        resume = client.get(f"/api/assessments/{ass_id}/resume", headers=self.headers_a).json()
        q1 = resume["current_question"]
        self.assertEqual(q1["competency_id"], first_comp)
        
        q_obj = self.db.query(Question).filter(Question.id == q1["id"]).first()
        corr_opt = next(o for o in q_obj.options if o.is_correct)
        step1 = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
            "question_id": q1["id"],
            "selected_option_id": corr_opt.id,
            "confidence_level": 3,
            "time_taken_seconds": 15
        }).json()
        
        # TEST 7: Correct Medium -> Hard (3)
        self.assertEqual(int(step1["next_question"]["difficulty"]), 3)
        # TEST 9: Competency must remain the same
        self.assertEqual(step1["next_question"]["competency_id"], first_comp)

        # Step 2: Answer Question 2 (Hard) Incorrectly
        q2 = step1["next_question"]
        q2_obj = self.db.query(Question).filter(Question.id == q2["id"]).first()
        inc_opt = next(o for o in q2_obj.options if not o.is_correct)
        step2 = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
            "question_id": q2["id"],
            "selected_option_id": inc_opt.id,
            "confidence_level": 2,
            "time_taken_seconds": 15
        }).json()

        # Moves to second competency in schedule, which resets to Medium (2)
        self.assertEqual(step2["next_question"]["competency_id"], second_comp)
        self.assertEqual(int(step2["next_question"]["difficulty"]), 2)

        # Step 3: Answer Question 3 (Medium) Incorrectly -> TEST 8: Medium+Wrong -> Easy (1)
        q3 = step2["next_question"]
        q3_obj = self.db.query(Question).filter(Question.id == q3["id"]).first()
        inc_opt3 = next(o for o in q3_obj.options if not o.is_correct)
        step3 = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers_a, json={
            "question_id": q3["id"],
            "selected_option_id": inc_opt3.id,
            "confidence_level": 1,
            "time_taken_seconds": 15
        }).json()

        self.assertEqual(int(step3["next_question"]["difficulty"]), 1)
        self.assertEqual(step3["next_question"]["competency_id"], second_comp)

    def test_10_and_12_missing_competency_prevents_baseline_completion(self):
        """TEST 10 & 12: Missing required competency prevents valid baseline completion and does not unlock account."""
        user = self.db.query(User).filter(User.email == self.user_a_email).first()
        
        # Artificially construct an assessment that only tested 5 of the 8 competencies
        incomplete_ass = Assessment(
            user_id=user.id,
            assessment_type="baseline",
            status="completed",
            overall_score=75.0
        )
        self.db.add(incomplete_ass)
        self.db.flush()

        # Add answers only for competencies 1, 2, 3, 6, 16 (missing 13, 18, 19)
        tested = [1, 2, 3, 6, 16]
        for cid in tested:
            q = self.db.query(Question).filter(Question.competency_id == cid).first()
            if q:
                ans = AssessmentAnswer(
                    assessment_id=incomplete_ass.id,
                    question_id=q.id,
                    is_correct=True,
                    confidence_level=3
                )
                self.db.add(ans)
        self.db.commit()

        # Verify check_user_baseline_completed is False
        self.assertFalse(check_user_baseline_completed(self.db, user))

        # Verify /api/users/me reports baseline_completed=False
        res = client.get("/api/users/me", headers=self.headers_a)
        self.assertFalse(res.json()["baseline_completed"])

    def test_11_insufficient_question_pool_does_not_substitute_another_competency(self):
        """TEST 11: Insufficient question pool for one competency raises controlled error and never substitutes another competency."""
        self.db.rollback()
        temp_comp = None
        temp_role = None
        temp_email = f"temp_{self.suffix}@gov.in"
        try:
            temp_comp = Competency(name=f"Zero Question Comp {self.suffix}", domain="Test", level="Level 1", is_official=False)
            self.db.add(temp_comp)
            self.db.flush()

            temp_role = Role(name=f"Temp Role {self.suffix}", description="Test", is_official=False)
            self.db.add(temp_role)
            self.db.flush()

            rc = RoleCompetency(role_id=temp_role.id, role_name=temp_role.name, competency_id=temp_comp.id, target_score=70.0, target_level=1, weight=1.0)
            self.db.add(rc)
            self.db.commit()

            client.post("/api/auth/register", json={
                "full_name": "Temp User",
                "email": temp_email,
                "password": self.password,
                "confirm_password": self.password
            })
            login_t = client.post("/api/auth/login", json={"email": temp_email, "password": self.password})
            h_t = {"Authorization": f"Bearer {login_t.json()['access_token']}"}

            # Set user role directly in DB to allow testing pool shortage on custom role
            u_t = self.db.query(User).filter(User.email == temp_email).first()
            u_t.role_id = temp_role.id
            u_t.designation = temp_role.name
            self.db.commit()

            # Attempt to start baseline
            res = client.post("/api/assessments/start", headers=h_t, json={
                "assessment_type": "baseline",
                "question_count": 10
            })
            # Strict Invariant: System rejects with 422 pool shortage, NEVER substitutes another competency
            self.assertEqual(res.status_code, 422)
            self.assertIn("does not have sufficient approved questions", res.json()["detail"])
        finally:
            # Guaranteed clean up
            self.db.rollback()
            u_t = self.db.query(User).filter(User.email == temp_email).first()
            if u_t:
                ass_ids = [a.id for a in self.db.query(Assessment.id).filter(Assessment.user_id == u_t.id).all()]
                if ass_ids:
                    self.db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id.in_(ass_ids)).delete(synchronize_session=False)
                self.db.query(Assessment).filter(Assessment.user_id == u_t.id).delete()
                self.db.query(UserCompetency).filter(UserCompetency.user_id == u_t.id).delete()
                self.db.query(CompetencyScore).filter(CompetencyScore.user_id == u_t.id).delete()
                self.db.query(User).filter(User.id == u_t.id).delete()
            if temp_role:
                self.db.query(RoleCompetency).filter(RoleCompetency.role_id == temp_role.id).delete()
                self.db.query(Role).filter(Role.id == temp_role.id).delete()
            if temp_comp:
                self.db.query(RoleCompetency).filter(RoleCompetency.competency_id == temp_comp.id).delete()
                self.db.query(Competency).filter(Competency.id == temp_comp.id).delete()
            self.db.commit()

    def test_13_baseline_completion_unlocks_learner_only_after_all_competencies_covered(self):
        """TEST 13: Baseline completion unlocks learner only after all required competencies are genuinely covered."""
        self.db.rollback()
        clean_email = f"clean_stat_{self.suffix}@gov.in"
        client.post("/api/auth/register", json={
            "full_name": "Clean Stat Learner",
            "email": clean_email,
            "password": self.password,
            "confirm_password": self.password
        })
        t = client.post("/api/auth/login", json={"email": clean_email, "password": self.password}).json()["access_token"]
        h = {"Authorization": f"Bearer {t}"}
        client.post("/api/users/onboarding", headers=h, json={"role_id": 1})

        me1 = client.get("/api/users/me", headers=h).json()
        self.assertFalse(me1["baseline_completed"])

        start_res = client.post("/api/assessments/start", headers=h, json={
            "assessment_type": "baseline",
            "question_count": 16
        })
        ass_id = start_res.json()["assessment_id"]

        for _ in range(16):
            r = client.get(f"/api/assessments/{ass_id}/resume", headers=h).json()
            if r["is_completed"]:
                break
            q = r["current_question"]
            opts = q.get("options", [])
            opt_id = opts[0]["id"] if opts else 1
            client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=h, json={
                "question_id": q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 2,
                "time_taken_seconds": 15
            })

        answers = self.db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == ass_id).all()
        cids_answered = {self.db.query(Question.competency_id).filter(Question.id == a.question_id).first()[0] for a in answers}
        self.assertEqual(cids_answered, set(self.stat_comp_ids))

        me2 = client.get("/api/users/me", headers=h).json()
        self.assertTrue(me2["baseline_completed"])

    def test_14_different_roles_produce_different_required_competency_sets(self):
        """TEST 14: Different roles produce different required competency sets (Stat Officer vs Research Officer)."""
        self.db.rollback()
        res_b = client.post("/api/assessments/start", headers=self.headers_b, json={
            "assessment_type": "baseline",
            "question_count": 10
        })
        self.assertEqual(res_b.status_code, 200)
        data_b = res_b.json()
        comps_b = set(data_b["competencies_covered"])
        
        self.assertEqual(comps_b, set(self.research_comp_names))
        self.assertNotEqual(comps_b, set(self.stat_comp_names))
        self.assertEqual(len(comps_b), 5)

    def test_15_frontend_cannot_override_the_backend_competency_set(self):
        """TEST 15: Frontend passing arbitrary competency parameters cannot override the role mapping."""
        self.db.rollback()
        res = client.post("/api/assessments/start", headers=self.headers_b, json={
            "assessment_type": "baseline",
            "competency_ids": [999, 888],
            "question_count": 10
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(set(res.json()["competencies_covered"]), set(self.research_comp_names))

if __name__ == "__main__":
    unittest.main()
