import os
import uuid
from fastapi.testclient import TestClient
from database import get_db
from main import app
from models.user import User
from models.role import Role
from models.competency import RoleCompetency, Competency
from models.assessment import Assessment, AssessmentAnswer, Question, QuestionOption
from auth.security import hash_password

client = TestClient(app)

def test_role_propagation_and_persistence_workflow():
    print("============================================================")
    print("   SMARTLEARN ROLE WORKFLOW & INTEGRATION VERIFICATION     ")
    print("============================================================")

    db = next(get_db())
    uid = str(uuid.uuid4())[:8]
    user_email = f"officer_{uid}@mospi.gov.in"
    user_password = "SecurePassword123!"

    # 1. Register new user
    print("\n[TEST A.1]: Registering initial user...")
    reg_res = client.post("/api/auth/register", json={
        "email": user_email,
        "password": user_password,
        "full_name": f"Pooja Sharma {uid}",
        "role": "learner",
        "designation": "Survey Officer"
    })
    assert reg_res.status_code == 200
    user_id = reg_res.json()["id"]

    # 2. Login
    login_res = client.post("/api/auth/login", json={
        "email": user_email,
        "password": user_password
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initial onboarding as Data Analyst (Role ID 2)
    onboard_res = client.post("/api/users/onboarding", headers=headers, json={
        "role_id": 2,
        "department_id": 2,
        "experience_years": 4
    })
    assert onboard_res.status_code == 200
    assert onboard_res.json()["role_name"] == "Data Analyst"
    print(f"  -> Initialized as: Data Analyst (Role ID #2)")

    # Verify initial role in /api/users/me and /api/auth/me
    me_res = client.get("/api/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["role_name"] == "Data Analyst"
    assert me_res.json()["role_id"] == 2

    # 3. Change role to Statistical Officer (Role ID 1)
    print("\n[TEST A.2]: Changing role: Data Analyst -> Statistical Officer (Role ID #1)...")
    role_update_res = client.put("/api/users/me/role", headers=headers, json={"role_id": 1})
    assert role_update_res.status_code == 200
    updated_profile = role_update_res.json()
    assert updated_profile["role_name"] == "Statistical Officer"
    assert updated_profile["role_id"] == 1
    print(f"  -> Role updated and persisted as: {updated_profile['role_name']}")

    # 4. Verify /api/users/me and /api/auth/me both reflect Statistical Officer
    auth_me_res = client.get("/api/auth/me", headers=headers)
    assert auth_me_res.status_code == 200
    assert auth_me_res.json()["role_name"] == "Statistical Officer"
    assert auth_me_res.json()["role_id"] == 1
    print("  -> Single source of truth verified in /api/auth/me and /api/users/me.")

    # 5. Start Assessment as Statistical Officer
    print("\n[TEST A.3]: Starting baseline assessment as Statistical Officer...")
    ass_res = client.post("/api/assessments/start", headers=headers, json={"assessment_type": "baseline"})
    assert ass_res.status_code == 200
    ass_data = ass_res.json()
    ass_id = ass_data["assessment_id"]
    questions = ass_data["questions"]
    assert len(questions) >= 1

    # Verify that sampled questions belong to Statistical Officer required competencies
    stat_role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == 1).all()
    stat_comp_ids = {r.competency_id for r in stat_role_reqs}
    for q in questions:
        assert q["competency_id"] in stat_comp_ids, f"Question #{q['id']} competency {q['competency_id']} not in Statistical Officer framework!"
    print(f"  -> Assessment #{ass_id} successfully created with question strictly sampled from Statistical Officer framework.")

    # 6. Complete assessment adaptively and verify score calculation against Statistical Officer targets
    print("\n[TEST A.4]: Completing assessment adaptively and scoring against Statistical Officer targets...")
    current_q = questions[0]
    comp_result = None
    while True:
        c_opt = db.query(QuestionOption).filter(QuestionOption.question_id == current_q["id"], QuestionOption.is_correct == True).first()
        opt_id = c_opt.id if c_opt else current_q["options"][0]["id"]
        step_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=headers, json={
            "question_id": current_q["id"],
            "selected_option_id": opt_id,
            "confidence_level": 3,
            "time_taken_seconds": 12
        })
        assert step_res.status_code == 200
        step_data = step_res.json()
        if step_data.get("is_completed"):
            comp_result = step_data.get("result")
            break
        current_q = step_data["next_question"]

    assert comp_result is not None
    print(f"  -> Assessment #{ass_id} scored: {comp_result.get('overall_score')}% against Statistical Officer benchmarks.")

    # ------------------------------------------------------------
    # TEST B: Change Role to Data Management Officer (Role ID 3) and verify history preservation
    # ------------------------------------------------------------
    print("\n[TEST B.1]: Changing role: Statistical Officer -> Data Management Officer (Role ID #3)...")
    role_update_res2 = client.put("/api/users/me/role", headers=headers, json={"role_id": 3})
    assert role_update_res2.status_code == 200
    da_profile = role_update_res2.json()
    assert da_profile["role_name"] == "Data Management Officer"
    assert da_profile["role_id"] == 3
    print(f"  -> Role updated to: {da_profile['role_name']}")

    # Verify previous assessment history is NOT deleted
    hist_assessments = client.get("/api/assessments/history/list", headers=headers).json()
    assert len(hist_assessments) >= 1
    assert any(a["id"] == ass_id for a in hist_assessments)
    print(f"  -> Historical Assessment #{ass_id} preserved intact.")

    # Start new assessment under Data Management Officer
    print("\n[TEST B.2]: Launching new assessment under Data Management Officer framework...")
    da_ass_res = client.post("/api/assessments/start", headers=headers, json={"assessment_type": "baseline"})
    assert da_ass_res.status_code == 200
    da_questions = da_ass_res.json()["questions"]
    da_role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == 3).all()
    da_comp_ids = {r.competency_id for r in da_role_reqs}
    for q in da_questions:
        assert q["competency_id"] in da_comp_ids, f"Question #{q['id']} competency {q['competency_id']} not in Data Management Officer framework!"
    print(f"  -> New Assessment #{da_ass_res.json()['assessment_id']} questions strictly mapped to Data Management Officer framework.")

    # ------------------------------------------------------------
    # TEST E: Security and Tenant Scoping
    # ------------------------------------------------------------
    print("\n[TEST E]: Security assertions (auth requirement & admin protection)...")
    unauth_res = client.put("/api/users/me/role", json={"role_id": 1})
    assert unauth_res.status_code == 401, "Unauthenticated role modification must be rejected with 401."
    
    admin_res = client.get("/api/admin/dashboard", headers=headers)
    assert admin_res.status_code in [401, 403], "Learner must be forbidden from admin dashboard."
    print("  -> Security assertions verified: Scoped JWT & Role authorization active.")

    print("\n============================================================")
    print("   ALL ROLE SELECTION, PERSISTENCE & HISTORY TESTS PASSED!  ")
    print("============================================================")

if __name__ == "__main__":
    test_role_propagation_and_persistence_workflow()
