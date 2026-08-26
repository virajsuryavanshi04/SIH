from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.competency import Competency
from models.user_competency import UserCompetency, CompetencyScore
from auth.security import hash_password

def run_test():
    client = TestClient(app)

    print("=== PHASE 2 COMPREHENSIVE WORKFLOW TEST ===")

    # Step 1: Create a brand new officer user
    db = SessionLocal()
    test_email = "p2_test_officer@gov.in"
    db.query(User).filter(User.email == test_email).delete()
    db.commit()

    new_user = User(
        email=test_email,
        password_hash=hash_password("secure123"),
        full_name="Dr. Sunita Rao",
        role="learner",
        role_id=None,
        designation=None
    )
    db.add(new_user)
    db.commit()
    db.close()

    # Step 2: Login
    res = client.post("/api/auth/login", json={"email": test_email, "password": "secure123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("1. [LOGIN SUCCESS]: Token acquired for Dr. Sunita Rao")

    # Step 3: Check initial profile
    res = client.get("/api/users/me", headers=headers)
    profile = res.json()
    print(f"2. [INITIAL STATE]: is_onboarded={profile['is_onboarded']}, designation={profile['designation']}")
    assert profile["is_onboarded"] is False

    # Step 4: Fetch Roles & Required Competencies for Role 1 (Statistical Officer)
    roles_res = client.get("/api/roles/")
    assert roles_res.status_code == 200
    roles = roles_res.json()
    print(f"3. [ROLES FETCHED]: {len(roles)} official roles found -> {[r['name'] for r in roles]}")

    role1_comp_res = client.get("/api/roles/1/competencies")
    assert role1_comp_res.status_code == 200
    role1_comps = role1_comp_res.json()
    print(f"4. [ROLE 1 FRAMEWORK]: Statistical Officer has {len(role1_comps)} required competencies:")
    for c in role1_comps[:3]:
        print(f"    • {c['competency_name']}: Target={c['target_score']}% (Weight: {c['weight']}x)")

    # Step 5: Complete Onboarding (Step 1: Role, Step 2: Dept, Step 3: Experience)
    onboard_res = client.post("/api/users/onboarding", json={
        "role_id": 1,
        "department_id": 1,
        "experience_years": 6,
        "work_areas": ["Macroeconomic Accounting", "Sampling Operations"]
    }, headers=headers)
    assert onboard_res.status_code == 200
    print(f"5. [ONBOARDING SAVED]: Role={onboard_res.json()['role_name']}, is_onboarded={onboard_res.json()['is_onboarded']}")

    # Step 6: Verify User Competencies are Unassessed (Not fake scores!)
    comp_me_res = client.get("/api/competencies/me", headers=headers)
    assert comp_me_res.status_code == 200
    user_comps = comp_me_res.json()
    print(f"6. [EVIDENCE-BASED INTEGRITY CHECK]: {len(user_comps)} competencies initialized with ZERO self-rating:")
    for uc in user_comps:
        assert uc["current_score"] is None
        assert uc["status"] == "not_assessed"
        print(f"    • {uc['competency_name']}: Score={uc['current_score']} | Status=\"{uc['status']}\" | Target={uc['target_score']}%")

    # Step 7: Simulate an assessment being completed to establish genuine evidence for one competency
    db = SessionLocal()
    user_db = db.query(User).filter(User.email == test_email).first()
    # Add historical score
    cs = CompetencyScore(user_id=user_db.id, competency_id=3, score=54.0, source="assessment")
    db.add(cs)
    # Update live user_competencies
    uc_db = db.query(UserCompetency).filter(UserCompetency.user_id == user_db.id, UserCompetency.competency_id == 3).first()
    if uc_db:
        uc_db.current_score = 54.0
        uc_db.status = "critical_gap"
    db.commit()
    db.close()
    print("7. [ASSESSMENT EVIDENCE RECORDED]: Sampling Techniques evidence score = 54.0%")

    # Step 8: Test Role Change (Switch from Statistical Officer [target 70%] to Survey Officer [target 80%])
    role_switch_res = client.put("/api/users/me/role", json={"role_id": 2}, headers=headers)
    assert role_switch_res.status_code == 200
    print(f"8. [ROLE SWITCHED]: New designation = {role_switch_res.json()['role_name']}")

    # Verify recalculated target and preserved score
    updated_comps = client.get("/api/competencies/me", headers=headers).json()
    for c in updated_comps:
        if c["competency_name"] == "Sampling Techniques":
            print(f"    • Sampling Techniques: Score={c['current_score']}% (PRESERVED) | New Target={c['target_score']}% (Survey Officer Benchmark) | Gap={c['gap']}%")
            assert c["current_score"] == 54.0
            assert c["target_score"] == 80.0
            assert c["gap"] == 26.0

    print("\n=== PHASE 2 TEST COMPLETE: ALL VERIFICATIONS PASSED 100% ===")

if __name__ == "__main__":
    run_test()
