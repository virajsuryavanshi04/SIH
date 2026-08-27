import os
import sys
from fastapi.testclient import TestClient
from database import get_db, Base, engine
from main import app
from models.user import User
from models.role import Role
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.user_competency import UserCompetency, CompetencyScore
from models.assessment import Question, QuestionOption
from models.material import LearningMaterial
from auth.security import hash_password
from services.admin_service import get_org_stats, compute_heatmap, prioritize_gaps

client = TestClient(app)

def run_phase9_tests():
    print("============================================================")
    print("   PHASE 9: CONTENT / ADMIN WORKFLOW TEST SUITE             ")
    print("============================================================")

    db = next(get_db())

    # 1. Setup Admin and Learner Users
    admin_email = "admin_director@mospi.gov.in"
    learner_email = "investigator_rahul@mospi.gov.in"

    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        admin_user = User(
            email=admin_email,
            password_hash=hash_password("adminpass123"),
            full_name="Director General Admin",
            role="admin",
            designation="Director General",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    learner_user = db.query(User).filter(User.email == learner_email).first()
    if not learner_user:
        learner_user = User(
            email=learner_email,
            password_hash=hash_password("learnerpass123"),
            full_name="Rahul Verma",
            role="learner",
            designation="Statistical Investigator",
            is_active=True
        )
        db.add(learner_user)
        db.commit()
        db.refresh(learner_user)

    # Login Admin
    admin_login = client.post("/api/auth/login", json={"email": admin_email, "password": "adminpass123"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Login Learner
    learner_login = client.post("/api/auth/login", json={"email": learner_email, "password": "learnerpass123"})
    assert learner_login.status_code == 200
    learner_token = learner_login.json()["access_token"]
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    print(f"1. [AUTHENTICATION]: Admin ({admin_user.full_name}) and Learner ({learner_user.full_name}) initialized.")

    # 2. Authorization Security Check: Learner cannot access admin-only endpoints
    learner_attempt = client.get("/api/admin/dashboard", headers=learner_headers)
    assert learner_attempt.status_code in [401, 403], f"Learner should be forbidden from admin dashboard, got {learner_attempt.status_code}"
    print("2. [SECURITY CHECK]: Learner correctly forbidden from admin-only endpoints.")

    # 3. Material Upload Flow (Title, Competency, Topic, File)
    sample_text = (
        "MoSPI Sampling Guidelines for National Household Surveys. "
        "Stratified random sampling requires partitioning the population into homogeneous strata. "
        "When variances differ significantly across strata, Neyman allocation minimizes the overall standard error. "
        "Non-response adjustment factors must be computed using weighting classes."
    )
    
    upload_res = client.post(
        "/api/materials/upload",
        headers=admin_headers,
        data={"title": "MoSPI Survey Handbook 2026", "competency_id": "3"},
        files={"file": ("mospi_handbook_2026.txt", sample_text.encode('utf-8'), "text/plain")}
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    material_id = upload_data["id"]
    print(f"3. [MATERIAL INGESTION]: Uploaded '{upload_data['title']}' (ID #{material_id}, Status: {upload_data['processing_status']}).")

    # 4. On-Demand Question Set Generation by Admin
    gen_res = client.post(
        "/api/questions/generate",
        headers=admin_headers,
        json={
            "competency_id": 3,
            "topic_id": 7,
            "difficulty": "2",
            "count": 3
        }
    )
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    generated_questions = gen_data["questions"]
    assert len(generated_questions) >= 1
    target_q = generated_questions[0]
    q_id = target_q["id"]
    
    print(f"4. [ON-DEMAND AI GENERATION]: Synthesized {len(generated_questions)} questions in Competency #3.")
    print(f"   Candidate Question #{q_id}: '{target_q['question_text'][:70]}...'")
    print(f"   Initial Status = '{target_q['status']}' (Pending Review)")
    assert target_q["status"] == "pending_review"

    # 5. Question Review & Curation Workflow
    # A. Inspect Question Details
    get_q_res = client.get(f"/api/questions/{q_id}", headers=admin_headers)
    assert get_q_res.status_code == 200
    q_detail = get_q_res.json()
    assert len(q_detail["options"]) == 4
    assert q_detail["correct_answer"] != ""
    print(f"5. [QUESTION INSPECTION]: Verified schema (4 options, 1 correct: '{q_detail['correct_answer']}').")

    # B. Edit Question Prompt & Explanation
    edit_res = client.put(
        f"/api/questions/{q_id}",
        headers=admin_headers,
        json={
            "text": "In official multi-stage household surveys, what is the mathematical basis for Neyman optimum allocation?",
            "explanation": "Neyman allocation assigns sample sizes proportional to stratum size and standard deviation."
        }
    )
    assert edit_res.status_code == 200
    assert "Neyman optimum allocation" in edit_res.json()["question_text"]
    print(f"   [QUESTION EDITED]: Updated text for Question #{q_id}.")

    # C. Approve Question -> Enters active assessment pool
    app_res = client.patch(f"/api/questions/{q_id}/status", headers=admin_headers, json={"status": "approved"})
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"
    print(f"   [QUESTION APPROVED]: Question #{q_id} status updated to 'approved' (Eligible for active pool).")

    # D. Reject a Question
    if len(generated_questions) > 1:
        reject_id = generated_questions[1]["id"]
        rej_res = client.patch(f"/api/questions/{reject_id}/status", headers=admin_headers, json={"status": "rejected"})
        assert rej_res.status_code == 200
        assert rej_res.json()["status"] == "rejected"
        print(f"   [QUESTION REJECTED]: Question #{reject_id} status updated to 'rejected'.")

    # 6. Workforce Insights & Aggregated Analytics (Zero Sensitive Data Leaks)
    stats_res = client.get("/api/admin/dashboard", headers=admin_headers)
    assert stats_res.status_code == 200
    org_stats = stats_res.json()
    
    print("\n6. [WORKFORCE ANALYTICS & INSIGHTS]:")
    print(f"   - Total Employees Enrolled: {org_stats['total_employees']}")
    print(f"   - Workforce Average Competency Index: {org_stats['avg_competency']}%")
    print(f"   - Capacity Improvement Trend: +{org_stats['avg_improvement']} pts")
    print(f"   - Completed Learning Modules: {org_stats['courses_completed']}")

    # Check Competency Breakdown List
    overview = org_stats["competency_overview"]
    for c_stat in overview[:3]:
        print(f"   * {c_stat['competency_name']}: Average = {c_stat['avg_score']}% (Target: {c_stat['target_score']}%, Gap: {c_stat['gap']}%)")

    # 7. Workforce Deficit Gap Prioritization
    gaps_res = client.get("/api/admin/gaps/priorities", headers=admin_headers)
    assert gaps_res.status_code == 200
    gaps_data = gaps_res.json()
    print(f"\n7. [PRIORITIZED GAPS]: {len(gaps_data)} workforce capability areas evaluated.")
    for g in gaps_data[:3]:
        print(f"   - Rank #{g['priority_rank']}: {g['competency_name']} | {g['percent_below_target']}% below benchmark | Action: {g['recommended_intervention']}")

    print("\n============================================================")
    print("   ALL PHASE 9 ADMIN WORKFLOW TESTS PASSED 100%!           ")
    print("============================================================")

if __name__ == "__main__":
    run_phase9_tests()
