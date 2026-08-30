"""
Phase 1 Security + Core Logic Stabilization — Comprehensive Test Suite

Tests:
A. Learner cannot obtain answer keys via question bank API
B. Admin can still manage questions  
C. Learner can start assessment
D. Learner can receive next adaptive question
E. Learner can submit answer
F. Assessment result still calculates correctly
G. Learner cannot modify another learner's learning-path item
H. Admin employee API does not expose password_hash
I. Competency insights correctly evaluate ALL competencies
J. Dashboard still loads
K. Learning recommendations still load
L. Existing role authorization still works
M. Materials API does not expose storage_path or extracted_text
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db
from seed.seed_data import seed_database

# Test database setup
TEST_DB_URL = "sqlite:///./test_phase1_security.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestSession()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_phase1_security.db"):
        os.remove("test_phase1_security.db")

client = TestClient(app)

def get_learner_token():
    resp = client.post("/api/auth/login", json={"email": "arjun.patel@gov.in", "password": "learn123"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]

def get_admin_token():
    resp = client.post("/api/auth/login", json={"email": "admin@smartlearn.gov.in", "password": "admin123"})
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["access_token"]

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# =============================================================
# TEST A: Learner CANNOT obtain answer keys via question bank API
# =============================================================

class TestQuestionBankSecurity:
    def test_unauthenticated_cannot_list_questions(self):
        """GET /api/questions/ without auth should return 401"""
        resp = client.get("/api/questions/")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"

    def test_unauthenticated_cannot_get_question(self):
        """GET /api/questions/1 without auth should return 401"""
        resp = client.get("/api/questions/1")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"

    def test_learner_cannot_list_questions(self):
        """Learner should be rejected from question bank listing"""
        token = get_learner_token()
        resp = client.get("/api/questions/", headers=auth_header(token))
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"

    def test_learner_cannot_get_question_detail(self):
        """Learner should be rejected from individual question detail"""
        token = get_learner_token()
        resp = client.get("/api/questions/1", headers=auth_header(token))
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"


# =============================================================
# TEST B: Admin CAN still manage questions
# =============================================================

class TestAdminQuestionManagement:
    def test_admin_can_list_questions(self):
        """Admin should be able to list all questions with answer keys"""
        token = get_admin_token()
        resp = client.get("/api/questions/", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0, "Question bank should not be empty"
        # Admin should see is_correct and correct_answer
        q = data[0]
        assert "options" in q
        assert "correct_answer" in q
        assert any(opt.get("is_correct") for opt in q["options"]), "Admin should see is_correct flags"

    def test_admin_can_get_question_detail(self):
        """Admin should be able to get individual question with answer key"""
        token = get_admin_token()
        resp = client.get("/api/questions/1", headers=auth_header(token))
        assert resp.status_code == 200
        q = resp.json()
        assert "correct_answer" in q
        assert "explanation" in q


# =============================================================
# TEST C: Learner can start assessment
# =============================================================

class TestAssessmentFlow:
    _assessment_id = None
    _first_question = None

    def test_learner_starts_assessment(self):
        """Learner should be able to start a baseline assessment"""
        token = get_learner_token()
        resp = client.post("/api/assessments/start", 
            json={"assessment_type": "baseline", "question_count": 4},
            headers=auth_header(token))
        assert resp.status_code == 200, f"Start failed: {resp.text}"
        data = resp.json()
        assert "assessment_id" in data
        assert data["total_questions"] > 0
        TestAssessmentFlow._assessment_id = data["assessment_id"]
        
        # CRITICAL: Verify no answer keys leak in assessment questions
        for q in data["questions"]:
            for opt in q["options"]:
                assert "is_correct" not in opt, f"is_correct leaked in assessment question option! Question {q['id']}"
            assert "correct_answer" not in q, f"correct_answer leaked in assessment question! Question {q['id']}"
        
        TestAssessmentFlow._first_question = data["questions"][0]

    # =============================================================
    # TEST E: Learner can submit answer
    # =============================================================
    def test_learner_submits_answer(self):
        """Learner should be able to submit an answer"""
        token = get_learner_token()
        assert TestAssessmentFlow._assessment_id is not None
        q = TestAssessmentFlow._first_question
        opt_id = q["options"][0]["id"]  # Pick any option
        
        resp = client.post(
            f"/api/assessments/{TestAssessmentFlow._assessment_id}/answer",
            json={"question_id": q["id"], "selected_option_id": opt_id, "confidence_level": 2},
            headers=auth_header(token))
        assert resp.status_code == 200, f"Submit answer failed: {resp.text}"

    # =============================================================
    # TEST F: Assessment result still calculates correctly
    # =============================================================
    def test_assessment_completes_and_scores(self):
        """Completing an assessment should return scored results"""
        token = get_learner_token()
        assert TestAssessmentFlow._assessment_id is not None
        
        resp = client.post(
            f"/api/assessments/{TestAssessmentFlow._assessment_id}/complete",
            headers=auth_header(token))
        assert resp.status_code == 200, f"Complete failed: {resp.text}"
        data = resp.json()
        assert "overall_score" in data or "overall_readiness" in data
        assert "competency_breakdown" in data


# =============================================================
# TEST D: Learner can receive next adaptive question
# =============================================================

class TestAdaptiveAssessment:
    def test_adaptive_assessment_flow(self):
        """Start adaptive assessment and get next question without answer leaks"""
        token = get_learner_token()
        
        # Start adaptive assessment
        resp = client.post("/api/assessments/start",
            json={"assessment_type": "adaptive_reassessment", "question_count": 3},
            headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        a_id = data["assessment_id"]
        
        # Verify no is_correct in initial questions
        for q in data["questions"]:
            for opt in q["options"]:
                assert "is_correct" not in opt, "is_correct leaked in adaptive question"
        
        # Submit answer and get next adaptive question
        q = data["questions"][0]
        opt_id = q["options"][0]["id"]
        resp = client.post(f"/api/assessments/{a_id}/adaptive-next",
            json={"question_id": q["id"], "selected_option_id": opt_id, "confidence_level": 2, "time_taken_seconds": 20},
            headers=auth_header(token))
        assert resp.status_code == 200
        step = resp.json()
        
        # Verify no is_correct in adaptive next question
        if step.get("next_question"):
            nq = step["next_question"]
            for opt in nq.get("options", []):
                assert "is_correct" not in opt, "is_correct leaked in adaptive next question"


# =============================================================
# TEST G: Learner cannot modify another learner's learning path
# =============================================================

class TestLearningPathIDOR:
    def test_cannot_complete_other_users_item(self):
        """User A should not be able to mark User B's learning path item as complete"""
        token_a = get_learner_token()  # Arjun
        
        # Login as a different learner
        resp = client.post("/api/auth/login", json={"email": "meera.nair@gov.in", "password": "learn123"})
        if resp.status_code != 200:
            pytest.skip("Second learner not available")
        token_b = resp.json()["access_token"]
        
        # Get User B's learning path to find an item
        resp_b = client.get("/api/learning-path/", headers=auth_header(token_b))
        assert resp_b.status_code == 200
        path_data = resp_b.json()
        items = path_data.get("items", [])
        if not items:
            pytest.skip("User B has no learning path items")
        
        target_item_id = items[0]["id"]
        
        # User A tries to complete User B's item
        resp_attack = client.patch(
            f"/api/learning-path/items/{target_item_id}/complete",
            headers=auth_header(token_a))
        assert resp_attack.status_code == 404, (
            f"IDOR vulnerability! User A completed User B's item. Status: {resp_attack.status_code}"
        )

    def test_own_items_still_work(self):
        """User should be able to complete their own learning path items"""
        token = get_learner_token()
        resp = client.get("/api/learning-path/", headers=auth_header(token))
        assert resp.status_code == 200
        items = resp.json().get("items", [])
        if not items:
            pytest.skip("No learning path items for user")
        # Find a non-completed item
        target = None
        for it in items:
            if it["status"] != "completed":
                target = it
                break
        if not target:
            pytest.skip("All items already completed")
        
        resp = client.patch(f"/api/learning-path/items/{target['id']}/complete", headers=auth_header(token))
        assert resp.status_code == 200


# =============================================================
# TEST H: Admin employee API does NOT expose password_hash
# =============================================================

class TestPasswordHashProtection:
    def test_no_password_hash_in_employees(self):
        """GET /api/admin/employees must not contain password_hash"""
        token = get_admin_token()
        resp = client.get("/api/admin/employees", headers=auth_header(token))
        assert resp.status_code == 200
        employees = resp.json()
        assert len(employees) > 0
        for emp in employees:
            assert "password_hash" not in emp, f"password_hash exposed for user {emp.get('id', '?')}"
            assert "password" not in emp, f"password field exposed for user {emp.get('id', '?')}"
            # Verify expected fields are present
            assert "id" in emp
            assert "email" in emp
            assert "full_name" in emp
            assert "role" in emp


# =============================================================
# TEST I: Competency insights correctly evaluate ALL competencies
# =============================================================

class TestCompetencyInsights:
    def test_bottleneck_evaluates_all_competencies(self):
        """Competency insights bottleneck should identify the actual worst competency, not just the last one"""
        token = get_learner_token()
        
        # Get detailed competencies to know what the bottleneck SHOULD be
        resp_detail = client.get("/api/competencies/me", headers=auth_header(token))
        assert resp_detail.status_code == 200
        detailed = resp_detail.json()
        
        # Calculate expected bottleneck manually
        max_weighted_gap = -1.0
        expected_bottleneck = None
        for item in detailed:
            curr = item.get("current_score")
            target = item.get("target_score", 70.0)
            w = item.get("weight", 1.0)
            gap = max(0.0, target - (curr or 0.0))
            w_gap = gap * w
            if w_gap > max_weighted_gap and gap > 0:
                max_weighted_gap = w_gap
                expected_bottleneck = item["competency_name"]
        
        # Get insights and compare
        resp = client.get("/api/competencies/me/insights", headers=auth_header(token))
        assert resp.status_code == 200
        insights = resp.json()
        
        assert "overall_readiness" in insights
        assert "priority_bottleneck_gap" in insights
        
        if expected_bottleneck and insights["priority_bottleneck_gap"]:
            actual_bottleneck = insights["priority_bottleneck_gap"]["competency_name"]
            assert actual_bottleneck == expected_bottleneck, (
                f"Bottleneck mismatch! Expected '{expected_bottleneck}', got '{actual_bottleneck}'. "
                f"This indicates the indentation bug was not properly fixed."
            )


# =============================================================
# TEST J: Dashboard still loads
# =============================================================

class TestDashboard:
    def test_learner_dashboard_loads(self):
        """Learner dashboard should return valid data"""
        token = get_learner_token()
        resp = client.get("/api/dashboard/learner", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "user_name" in data or "overall_score" in data


# =============================================================
# TEST K: Learning recommendations still load
# =============================================================

class TestRecommendations:
    def test_course_recommendations_load(self):
        """Personalized course recommendations should return"""
        token = get_learner_token()
        resp = client.get("/api/courses/recommended", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)


# =============================================================
# TEST L: Existing role authorization still works
# =============================================================

class TestRoleAuthorization:
    def test_learner_cannot_access_admin_dashboard(self):
        """Learner should not be able to access admin endpoints"""
        token = get_learner_token()
        resp = client.get("/api/admin/dashboard", headers=auth_header(token))
        assert resp.status_code == 403

    def test_admin_can_access_admin_dashboard(self):
        """Admin should be able to access admin endpoints"""
        token = get_admin_token()
        resp = client.get("/api/admin/dashboard", headers=auth_header(token))
        assert resp.status_code == 200

    def test_unauthenticated_cannot_start_assessment(self):
        """Unauthenticated user should not be able to start assessment"""
        resp = client.post("/api/assessments/start", json={"assessment_type": "baseline"})
        assert resp.status_code == 401


# =============================================================
# TEST M: Materials API does not expose internal fields
# =============================================================

class TestMaterialsSerialization:
    def test_materials_list_no_storage_path(self):
        """GET /api/materials/ should not expose storage_path or extracted_text"""
        resp = client.get("/api/materials/")
        assert resp.status_code == 200
        materials = resp.json()
        for m in materials:
            assert "storage_path" not in m, "storage_path exposed in materials list"
            assert "extracted_text" not in m, "extracted_text exposed in materials list"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
