import os
import uuid
from fastapi.testclient import TestClient
from database import get_db
from main import app
from models.user import User
from models.role import Role
from models.assessment import Question, QuestionOption
from auth.security import hash_password, create_access_token

client = TestClient(app)

def test_role_security_and_privilege_escalation():
    print("============================================================")
    print("   SMARTLEARN ROLE SECURITY & PRIVILEGE ESCALATION SUITE   ")
    print("============================================================")

    db = next(get_db())
    uid = str(uuid.uuid4())[:8]

    # ------------------------------------------------------------
    # TEST 1: Register a new user -> verify system_role = "learner"
    # ------------------------------------------------------------
    print("\n[TEST 1]: Registering new user...")
    reg_email = f"officer_{uid}@mospi.gov.in"
    reg_res = client.post("/api/auth/register", json={
        "email": reg_email,
        "password": "Password123!",
        "full_name": "Rohan Sharma",
        "department_id": 1
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    user_data = reg_res.json()
    assert user_data["role"] == "learner", f"Expected role='learner', got '{user_data['role']}'"
    print(f"  -> User registered with system role: '{user_data['role']}'")

    # ------------------------------------------------------------
    # TEST 2: Verify professional role list excludes "Administrator"
    # ------------------------------------------------------------
    print("\n[TEST 2]: Fetching available professional roles...")
    roles_res = client.get("/api/roles/")
    assert roles_res.status_code == 200
    roles = roles_res.json()
    role_names = [r["name"] for r in roles]
    print(f"  -> Available professional roles: {role_names}")
    for name in role_names:
        assert "admin" not in name.lower() and "administrator" not in name.lower(), \
            f"Privileged role '{name}' found in selectable professional roles!"
    print("  -> Verified: Administrator role is completely excluded from selectable roles.")

    # ------------------------------------------------------------
    # TEST 3: Privilege Escalation during Registration
    # ------------------------------------------------------------
    print("\n[TEST 3]: Malicious registration attempt specifying system_role='administrator'...")
    mal_email = f"attacker_{uid}@mospi.gov.in"
    mal_reg = client.post("/api/auth/register", json={
        "email": mal_email,
        "password": "Password123!",
        "full_name": "Attacker Account",
        "role": "admin",
        "system_role": "administrator"
    })
    assert mal_reg.status_code == 200
    assert mal_reg.json()["role"] == "learner", "System role must remain 'learner' despite payload payload injection!"
    
    # Check DB state directly
    attacker_db = db.query(User).filter(User.email == mal_email).first()
    assert attacker_db.role == "learner"
    print("  -> Verified: Injected system_role parameter safely ignored; user created as 'learner'.")

    # ------------------------------------------------------------
    # TEST 4: Privilege Escalation via Profile Update (PATCH/PUT /api/users/me)
    # ------------------------------------------------------------
    print("\n[TEST 4]: Learner attempts to self-promote via PATCH /api/users/me...")
    learner_token = create_access_token(data={"sub": reg_email, "role": "learner"})
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    hack_res = client.patch("/api/users/me", headers=learner_headers, json={
        "role": "admin"
    })
    assert hack_res.status_code == 403, f"Expected 403 Forbidden, got {hack_res.status_code}"
    print(f"  -> Blocked privilege escalation with HTTP 403: {hack_res.json()['detail']}")

    # ------------------------------------------------------------
    # TEST 5: Change Professional Role (Statistical Officer -> Data Analyst)
    # ------------------------------------------------------------
    print("\n[TEST 5]: Learner changes professional role (Statistical Officer -> Data Analyst)...")
    data_analyst_role = next(r for r in roles if r["name"] == "Data Analyst")
    role_update_res = client.patch("/api/users/me/role", headers=learner_headers, json={
        "role_id": data_analyst_role["id"]
    })
    assert role_update_res.status_code == 200
    updated_profile = role_update_res.json()
    assert updated_profile["role_name"] == "Data Analyst"
    assert updated_profile["role"] == "learner", "System role must NOT become admin when changing professional roles!"
    print(f"  -> Professional role updated to: '{updated_profile['role_name']}'")
    print(f"  -> System authorization role remains: '{updated_profile['role']}'")

    # ------------------------------------------------------------
    # TEST 6: Legitimate Administrator Features
    # ------------------------------------------------------------
    print("\n[TEST 6]: Verifying legitimate administrator account capabilities...")
    admin_email = f"real_admin_{uid}@mospi.gov.in"
    admin_user = User(
        email=admin_email,
        password_hash=hash_password("AdminPass123!"),
        full_name="Director General Admin",
        role="admin",
        designation="Director General",
        role_id=1
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    admin_token = create_access_token(data={"sub": admin_email, "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Upload material as admin
    admin_up = client.post(
        "/api/materials/upload",
        headers=admin_headers,
        files={"file": ("admin_test.txt", b"Admin official curriculum document text.", "text/plain")},
        data={"title": "Official Test Document", "competency_id": 1}
    )
    assert admin_up.status_code == 200, f"Admin upload failed: {admin_up.text}"
    admin_mat_id = admin_up.json()["id"]
    print(f"  -> Admin uploaded official material #{admin_mat_id}.")

    # Generate questions as admin
    admin_gen = client.post(
        f"/api/materials/{admin_mat_id}/generate-questions?count=3&difficulty=2",
        headers=admin_headers
    )
    assert admin_gen.status_code == 200
    q_id = admin_gen.json()["questions"][0]["id"]
    print(f"  -> Admin generated questions; sample Question #{q_id}.")

    # Approve question as admin
    admin_app = client.patch(f"/api/questions/{q_id}/status", headers=admin_headers, json={"status": "approved"})
    assert admin_app.status_code == 200
    print(f"  -> Admin approved Question #{q_id} for active pool.")

    # ------------------------------------------------------------
    # TEST 7: Learner blocked from Admin Operations
    # ------------------------------------------------------------
    print("\n[TEST 7]: Verifying learner is blocked from all administrative operations...")
    unauth_up = client.post(
        "/api/materials/upload",
        headers=learner_headers,
        files={"file": ("unauth.txt", b"text", "text/plain")}
    )
    assert unauth_up.status_code == 403
    print("  -> Learner blocked from POST /api/materials/upload (403).")

    unauth_gen = client.post(
        f"/api/materials/{admin_mat_id}/generate-questions?count=3",
        headers=learner_headers
    )
    assert unauth_gen.status_code == 403
    print("  -> Learner blocked from POST /api/materials/{id}/generate-questions (403).")

    unauth_app = client.patch(
        f"/api/questions/{q_id}/status",
        headers=learner_headers,
        json={"status": "rejected"}
    )
    assert unauth_app.status_code == 403
    print("  -> Learner blocked from PATCH /api/questions/{id}/status (403).")

    print("\n============================================================")
    print("   ALL 7 ROLE SECURITY & AUTHORIZATION TESTS PASSED!       ")
    print("============================================================")

if __name__ == "__main__":
    test_role_security_and_privilege_escalation()
