import unittest
import sys
import uuid
import os
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
from models.competency import RoleCompetency
from models.user_competency import UserCompetency, CompetencyScore
from models.assessment import Assessment
from auth.security import verify_password

client = TestClient(app)

class TestRegistrationAndOnboarding(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db: Session = next(get_db())
        cls.suffix = uuid.uuid4().hex[:8]
        cls.test_email = f"cadre_officer_{cls.suffix}@smartlearn.gov.in"
        cls.test_password = "ValidPassword123!"
        cls.test_name = "Ananya Sen"
        cls.created_assessment_id = None
        
        # Verify an official role exists
        cls.role = cls.db.query(Role).filter(~Role.name.ilike("%admin%")).first()
        assert cls.role is not None, "At least one selectable professional role must exist"

    @classmethod
    def tearDownClass(cls):
        # Clean up test created user
        user = cls.db.query(User).filter(User.email.ilike(f"%{cls.suffix}%")).first()
        if user:
            cls.db.query(UserCompetency).filter(UserCompetency.user_id == user.id).delete()
            cls.db.query(CompetencyScore).filter(CompetencyScore.user_id == user.id).delete()
            cls.db.query(Assessment).filter(Assessment.user_id == user.id).delete()
            cls.db.query(User).filter(User.id == user.id).delete()
            cls.db.commit()
        cls.db.close()

    def test_01_successful_registration(self):
        """TEST 1: Successful registration creates user with hashed password and learner role."""
        res = client.post("/api/auth/register", json={
            "full_name": self.test_name,
            "email": self.test_email,
            "password": self.test_password,
            "confirm_password": self.test_password
        })
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["email"], self.test_email.lower())
        self.assertEqual(data["full_name"], self.test_name)
        self.assertEqual(data["role"], "learner")
        self.assertFalse(data["is_onboarded"])
        self.assertFalse(data.get("baseline_completed", False))

    def test_02_duplicate_email_rejected(self):
        """TEST 2: Duplicate email registration is rejected with clean error."""
        res = client.post("/api/auth/register", json={
            "full_name": "Duplicate Person",
            "email": self.test_email.upper(),  # test case-insensitive duplicate check
            "password": "DifferentPassword123!",
            "confirm_password": "DifferentPassword123!"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("already exists", res.json()["detail"])

    def test_03_invalid_email_rejected(self):
        """TEST 3: Invalid email syntax is rejected by schema validation."""
        res = client.post("/api/auth/register", json={
            "full_name": "Invalid Email Person",
            "email": "not-an-email",
            "password": self.test_password,
            "confirm_password": self.test_password
        })
        self.assertEqual(res.status_code, 422)

    def test_04_password_mismatch_rejected(self):
        """TEST 4: Password mismatch is rejected gracefully."""
        res = client.post("/api/auth/register", json={
            "full_name": "Mismatch Person",
            "email": f"mismatch_{self.suffix}@gov.in",
            "password": "PasswordOne123",
            "confirm_password": "PasswordTwo123"
        })
        self.assertEqual(res.status_code, 422)
        self.assertIn("match", res.json()["detail"].lower())

    def test_05_password_is_securely_hashed_never_plaintext(self):
        """TEST 5: Password is never stored in plaintext and is bcrypt hashed."""
        user = self.db.query(User).filter(User.email == self.test_email.lower()).first()
        self.assertIsNotNone(user)
        self.assertNotEqual(user.password_hash, self.test_password)
        self.assertTrue(user.password_hash.startswith("$2b$") or user.password_hash.startswith("$2a$"))
        self.assertTrue(verify_password(self.test_password, user.password_hash))

    def test_06_successful_login(self):
        """TEST 6: Successful login returns JWT access token."""
        res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")

    def test_07_invalid_credentials_rejected(self):
        """TEST 7: Invalid password or non-existent email is rejected with 401."""
        res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": "WrongPassword123"
        })
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["detail"], "Invalid credentials")

    def test_08_authenticated_me_returns_registered_user(self):
        """TEST 8: Authenticated /api/users/me returns registered user profile with baseline_completed=False."""
        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/users/me", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], self.test_email.lower())
        self.assertEqual(data["full_name"], self.test_name)
        self.assertFalse(data["is_onboarded"])
        self.assertFalse(data["baseline_completed"])

    def test_09_role_selection_succeeds_for_authenticated_user(self):
        """TEST 9: Authenticated user selects role from official roles via /onboarding without department."""
        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.post("/api/users/onboarding", headers=headers, json={
            "role_id": self.role.id,
            "experience_years": 4,
            "work_areas": ["Survey Sampling & Design"]
        })
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["role_id"], self.role.id)
        self.assertEqual(data["role_name"], self.role.name)
        self.assertTrue(data["is_onboarded"])
        self.assertFalse(data["baseline_completed"])

    def test_10_selected_role_persists_in_database(self):
        """TEST 10: Selected role is persisted in the database User record."""
        self.db.expire_all()
        user = self.db.query(User).filter(User.email == self.test_email.lower()).first()
        self.assertIsNotNone(user)
        self.assertEqual(user.role_id, self.role.id)
        self.assertEqual(user.designation, self.role.name)

    def test_11_selected_role_returned_by_current_user_endpoint(self):
        """TEST 11: Successive calls to /api/users/me return persisted role and baseline_completed=False."""
        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/users/me", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role_id"], self.role.id)
        self.assertEqual(data["role_name"], self.role.name)
        self.assertTrue(data["is_onboarded"])
        self.assertFalse(data["baseline_completed"])

    def test_12_unauthenticated_role_update_rejected(self):
        """TEST 12: Calling /onboarding without Bearer token returns 401."""
        res = client.post("/api/users/onboarding", json={"role_id": self.role.id})
        self.assertEqual(res.status_code, 401)

    def test_13_user_cannot_modify_another_users_role(self):
        """TEST 13: Operations strictly modify current_user; user cannot supply arbitrary user_id."""
        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.post("/api/users/onboarding", headers=headers, json={
            "role_id": self.role.id,
            "user_id": 1
        })
        self.assertEqual(res.status_code, 200)
        auth_user = self.db.query(User).filter(User.email == self.test_email.lower()).first()
        self.assertEqual(auth_user.role_id, self.role.id)

    def test_14_new_user_remains_unassessed_before_baseline(self):
        """TEST 14: UserCompetency entries are created with current_score=None and status='not_assessed'."""
        user = self.db.query(User).filter(User.email == self.test_email.lower()).first()
        ucs = self.db.query(UserCompetency).filter(UserCompetency.user_id == user.id).all()
        self.assertGreater(len(ucs), 0, "Role competencies must be populated upon onboarding")
        for uc in ucs:
            self.assertIsNone(uc.current_score, "Competency score must be None before baseline assessment")
            self.assertEqual(uc.status, "not_assessed")

    def test_15_no_assessment_record_created_merely_by_registration_or_onboarding(self):
        """TEST 15: No Assessment row is created during registration or role onboarding."""
        user = self.db.query(User).filter(User.email == self.test_email.lower()).first()
        assessments_count = self.db.query(Assessment).filter(Assessment.user_id == user.id).count()
        self.assertEqual(assessments_count, 0)

    def test_16_no_competency_score_fabricated_during_registration(self):
        """TEST 16: No historical CompetencyScore records exist before assessment is taken."""
        user = self.db.query(User).filter(User.email == self.test_email.lower()).first()
        scores_count = self.db.query(CompetencyScore).filter(CompetencyScore.user_id == user.id).count()
        self.assertEqual(scores_count, 0)

    def test_17_logout_session_invalidation(self):
        """TEST 17: Request with invalid / cleared token fails with 401."""
        bad_headers = {"Authorization": "Bearer invalid_garbage_token"}
        res = client.get("/api/users/me", headers=bad_headers)
        self.assertEqual(res.status_code, 401)

    def test_18_existing_user_data_remains_intact_and_baseline_complete(self):
        """TEST 18: Existing seeded users (like arjun.patel@gov.in) remain intact and have baseline_completed=True."""
        login_res = client.post("/api/auth/login", json={
            "email": "arjun.patel@gov.in",
            "password": "learn123"
        })
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/users/me", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], "arjun.patel@gov.in")
        self.assertTrue(data["is_onboarded"])
        self.assertTrue(data["baseline_completed"], "Seeded learner with completed assessments must have baseline_completed=True")

    def test_19_start_baseline_assessment_flow(self):
        """TEST 19: Starting baseline assessment initializes session in progress without marking baseline completed."""
        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        start_res = client.post("/api/assessments/start", headers=headers, json={
            "assessment_type": "baseline",
            "question_type": "MIXED",
            "question_count": 10
        })
        self.assertEqual(start_res.status_code, 200)
        start_data = start_res.json()
        self.assertIn("assessment_id", start_data)
        TestRegistrationAndOnboarding.created_assessment_id = start_data["assessment_id"]

        # Verify profile reports active_assessment_id and still baseline_completed=False
        me_res = client.get("/api/users/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.json()
        self.assertFalse(me_data["baseline_completed"], "In-progress assessment must NOT mark baseline_completed=True")
        self.assertEqual(me_data["active_assessment_id"], TestRegistrationAndOnboarding.created_assessment_id)

    def test_20_in_progress_baseline_assessment_resumed(self):
        """TEST 20: In-progress baseline assessment can be resumed cleanly via /resume endpoint."""
        ass_id = TestRegistrationAndOnboarding.created_assessment_id
        self.assertIsNotNone(ass_id)

        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resume_res = client.get(f"/api/assessments/{ass_id}/resume", headers=headers)
        self.assertEqual(resume_res.status_code, 200)
        resume_data = resume_res.json()
        self.assertEqual(resume_data["assessment_id"], ass_id)
        self.assertFalse(resume_data["is_completed"])
        self.assertIn("current_question", resume_data)

    def test_21_completing_baseline_marks_baseline_completed(self):
        """TEST 21: Completing the baseline assessment establishes scores and marks baseline_completed=True."""
        ass_id = TestRegistrationAndOnboarding.created_assessment_id
        self.assertIsNotNone(ass_id)

        login_res = client.post("/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Answer all questions to complete baseline
        while True:
            resume_res = client.get(f"/api/assessments/{ass_id}/resume", headers=headers)
            r_data = resume_res.json()
            if r_data.get("is_completed"):
                break
            q = r_data["current_question"]
            opts = q.get("options", [])
            opt_id = opts[0]["id"] if opts else 1
            ans_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=headers, json={
                "question_id": q["id"],
                "selected_option_id": opt_id,
                "confidence_level": 3,
                "time_taken_seconds": 15
            })
            self.assertEqual(ans_res.status_code, 200)
            if ans_res.json().get("is_completed"):
                break

        # Now verify assessment is marked completed
        self.db.expire_all()
        ass = self.db.query(Assessment).filter(Assessment.id == ass_id).first()
        self.assertEqual(ass.status, "completed")

        # Verify /api/users/me now reports baseline_completed=True and active_assessment_id=None
        me_res = client.get("/api/users/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.json()
        self.assertTrue(me_data["baseline_completed"], "Completed baseline assessment must mark baseline_completed=True")
        self.assertIsNone(me_data["active_assessment_id"])

if __name__ == "__main__":
    unittest.main()
