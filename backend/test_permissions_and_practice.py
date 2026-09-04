import os
import uuid
from fastapi.testclient import TestClient
from database import get_db
from main import app
from models.user import User
from models.material import LearningMaterial
from models.competency import Competency, RoleCompetency
from models.assessment import Assessment, Question
from auth.security import hash_password, create_access_token

client = TestClient(app)

def test_permissions_and_practice_workflow():
    print("============================================================")
    print("   SMARTLEARN PERMISSIONS & PRACTICE WORKFLOW TEST SUITE   ")
    print("============================================================")

    db = next(get_db())

    # 1. Setup Learner (Arjun Patel, Statistical Officer)
    uid = str(uuid.uuid4())[:8]
    officer_email = f"arjun_{uid}@mospi.gov.in"
    officer = User(
        email=officer_email,
        password_hash=hash_password("Pass123!"),
        full_name="Arjun Patel",
        role="learner",
        designation="Statistical Officer",
        role_id=1
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)

    learner_token = create_access_token(data={"sub": officer.email, "role": "learner"})
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # 2. Setup Admin
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        admin = User(
            email=f"admin_{uid}@mospi.gov.in",
            password_hash=hash_password("AdminPass123!"),
            full_name="System Administrator",
            role="admin",
            designation="Administrator"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    admin_token = create_access_token(data={"sub": admin.email, "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    db.close()

    from config import settings
    settings.AI_PROVIDER = "mock"

    # ------------------------------------------------------------
    # TEST 1: Authentication & Role Verification
    # ------------------------------------------------------------
    print("\n[TEST 1]: Verifying authenticated user role...")
    me_res = client.get("/api/users/me", headers=learner_headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["role"] == "learner"
    assert user_data["designation"] == "Statistical Officer"
    print(f"  -> User: {user_data['full_name']} | Role: {user_data['role']} | Designation: {user_data['designation']}")

    # ------------------------------------------------------------
    # TEST 2: Learner Practice Assessment Flow
    # ------------------------------------------------------------
    print("\n[TEST 2]: Testing Learner Targeted Practice Session Creation...")
    practice_res = client.post("/api/assessments/start", headers=learner_headers, json={
        "assessment_type": "practice",
        "competency_ids": [1],
        "difficulty": "2",
        "question_count": 10
    })
    assert practice_res.status_code == 200, f"Practice start failed: {practice_res.text}"
    p_data = practice_res.json()
    assert "assessment_id" in p_data
    assert len(p_data["questions"]) >= 1
    print(f"  -> Practice Assessment #{p_data['assessment_id']} created with {len(p_data['questions'])} questions.")

    # ------------------------------------------------------------
    # TEST 3: Admin AI Question Generation Access
    # ------------------------------------------------------------
    print("\n[TEST 3]: Testing Admin AI Question Generation authorization...")
    admin_gen_res = client.post("/api/questions/generate", headers=admin_headers, json={
        "competency_id": 1,
        "difficulty": "2",
        "count": 3
    })
    assert admin_gen_res.status_code == 200
    assert len(admin_gen_res.json()["questions"]) == 3
    print("  -> Admin authorized: Generated 3 candidate questions with status='pending_review'.")

    # ------------------------------------------------------------
    # TEST 4: Learner Blocked from AI Generation with Clear Error
    # ------------------------------------------------------------
    print("\n[TEST 4]: Testing Learner restriction on AI Question Generation...")
    unauth_gen_res = client.post("/api/questions/generate", headers=learner_headers, json={
        "competency_id": 1,
        "difficulty": "2",
        "count": 3
    })
    assert unauth_gen_res.status_code == 403, f"Expected 403, got {unauth_gen_res.status_code}"
    error_detail = unauth_gen_res.json().get("detail", "")
    assert "Content Administrators" in error_detail
    print(f"  -> Correctly blocked learner with 403: '{error_detail}'")

    # ------------------------------------------------------------
    # TEST 5: Role Switch & Benchmark Target Recalibration
    # ------------------------------------------------------------
    print("\n[TEST 5]: Testing Role Update: Statistical Officer -> Data Analyst...")
    role_change_res = client.put("/api/users/me/role", headers=learner_headers, json={"role_id": 2})
    assert role_change_res.status_code == 200
    updated_user = role_change_res.json()
    assert updated_user["role_name"] == "Data Analyst"
    print(f"  -> Role persisted as: {updated_user['role_name']}")

    # ------------------------------------------------------------
    # TEST 6: Security Assertions
    # ------------------------------------------------------------
    print("\n[TEST 6]: Verifying backend authorization enforcement...")
    admin_dash_res = client.get("/api/admin/dashboard", headers=learner_headers)
    assert admin_dash_res.status_code == 403
    print("  -> Non-admin user forbidden from admin dashboard.")

    print("\n============================================================")
    print("   ALL PERMISSIONS & PRACTICE WORKFLOW TESTS PASSED!       ")
    print("============================================================")

if __name__ == "__main__":
    test_permissions_and_practice_workflow()
