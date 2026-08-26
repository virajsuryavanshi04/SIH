from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer
from models.user_competency import UserCompetency, CompetencyScore
from auth.security import hash_password

def run_test():
    client = TestClient(app)
    print("=== PHASE 3 BASELINE COMPETENCY ASSESSMENT TEST ===")

    # 1. Clean and create a fresh officer user
    db = SessionLocal()
    test_email = "p3_officer_fresh@gov.in"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id.in_(
            db.query(Assessment.id).filter(Assessment.user_id == existing.id)
        )).delete(synchronize_session=False)
        db.query(Assessment).filter(Assessment.user_id == existing.id).delete()
        db.query(UserCompetency).filter(UserCompetency.user_id == existing.id).delete()
        db.query(CompetencyScore).filter(CompetencyScore.user_id == existing.id).delete()
        db.query(User).filter(User.id == existing.id).delete()
        db.commit()

    user = User(
        email=test_email,
        password_hash=hash_password("pass123"),
        full_name="Kavita Nair",
        role="learner",
        role_id=None,
        designation=None
    )
    db.add(user)
    db.commit()
    db.close()

    # 2. Login
    login_res = client.post("/api/auth/login", json={"email": test_email, "password": "pass123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("1. [LOGIN]: Authenticated Kavita Nair")

    # 3. Onboard as Statistical Officer (Role 1)
    onboard_res = client.post("/api/users/onboarding", json={"role_id": 1, "department_id": 1}, headers=headers)
    assert onboard_res.status_code == 200
    print("2. [ONBOARDED]: Role assigned -> Statistical Officer (Targets: Sampling 70%, Stats 80%, Quality 70%)")

    # 4. Verify initial unassessed state (Strict Rule: Zero manual scores)
    init_comps = client.get("/api/competencies/me", headers=headers).json()
    assert all(c["current_score"] is None and c["status"] == "not_assessed" for c in init_comps)
    print("3. [VERIFIED UNASSESSED BASELINE]: All 8 competencies initialized as 'not_assessed' with None score.")

    # 5. Start Baseline Assessment
    start_res = client.post("/api/assessments/start", json={"assessment_type": "baseline"}, headers=headers)
    assert start_res.status_code == 200
    assessment_data = start_res.json()
    ass_id = assessment_data["assessment_id"]
    questions = assessment_data["questions"]
    print(f"4. [BASELINE ASSESSMENT STARTED]: ID={ass_id}, Type={assessment_data['assessment_type']}, Total Questions={len(questions)}")
    print(f"    Competencies sampled: {assessment_data['competencies_covered']}")
    assert len(questions) >= 8

    # Verify each question has competency, topic, and difficulty
    for idx, q in enumerate(questions):
        print(f"    Q{idx+1}: [{q['competency_name']}] Topic: {q['topic_name']} | Diff: {q['difficulty']} | Level: {q['cognitive_level']}")
        assert q["competency_id"] is not None
        assert q["competency_name"] is not None
        assert len(q["options"]) == 4

    # 6. Submit answers: answer Statistical Methods correctly (100%), Sampling incorrectly (0%), others mixed
    db = SessionLocal()
    correct_opt_map = {opt.question_id: opt.id for opt in db.query(QuestionOption).filter(QuestionOption.is_correct == True).all()}
    incorrect_opt_map = {opt.question_id: opt.id for opt in db.query(QuestionOption).filter(QuestionOption.is_correct == False).all()}
    db.close()

    print("5. [SUBMITTING ANSWERS]:")
    for q in questions:
        q_id = q["id"]
        c_name = q["competency_name"]
        
        if "Sampling" in c_name:
            chosen_opt = incorrect_opt_map.get(q_id, q["options"][1]["id"])
            conf = 1
        else:
            chosen_opt = correct_opt_map.get(q_id, q["options"][0]["id"])
            conf = 3

        ans_res = client.post(f"/api/assessments/{ass_id}/answer", json={
            "question_id": q_id,
            "selected_option_id": chosen_opt,
            "confidence_level": conf,
            "time_taken_seconds": 12
        }, headers=headers)
        assert ans_res.status_code == 200

    # 7. Complete Assessment
    complete_res = client.post(f"/api/assessments/{ass_id}/complete", headers=headers)
    assert complete_res.status_code == 200
    res_data = complete_res.json()

    print(f"\n6. [ASSESSMENT RESULT GENERATED]: Overall Readiness = {res_data['overall_readiness']}%")
    print(f"    Total Correct: {res_data['total_correct']} / {res_data['total_questions']}")
    
    print("\n   [STRONGEST COMPETENCIES]:")
    for s in res_data["strongest_competencies"]:
        print(f"    - {s['competency_name']}: Score={s['score']}% (Target: {s['target_score']}%)")

    print("\n   [NEEDS ATTENTION / CRITICAL GAPS]:")
    for n in res_data["needs_attention"]:
        print(f"    * {n['competency_name']}: Score={n['score']}% (Target: {n['target_score']}%) | Gap=-{n['gap']}%")

    if res_data["largest_gap"]:
        lg = res_data["largest_gap"]
        print(f"\n   [LARGEST PRIORITY GAP]: {lg['competency_name']} -> Current {lg['current_score']}% vs Target {lg['target_score']}% (Gap: -{lg['gap']}%)")
        assert "Sampling" in lg["competency_name"]
        assert lg["current_score"] == 0.0
        assert lg["gap"] == 70.0

    # 8. Verify User Competency Profile in Database
    updated_comps = client.get("/api/competencies/me", headers=headers).json()
    print("\n7. [USER COMPETENCY PROFILE UPDATED]:")
    for uc in updated_comps:
        print(f"    * {uc['competency_name']}: Evidence Score={uc['current_score']}% | Target={uc['target_score']}% | Status={uc['status']}")
        assert uc["current_score"] is not None
        assert uc["status"] != "not_assessed"

    # 9. Verify Immutable Competency History
    db = SessionLocal()
    history_records = db.query(CompetencyScore).filter(CompetencyScore.assessment_id == ass_id).all()
    print(f"\n8. [IMMUTABLE HISTORY SAVED]: {len(history_records)} historical measurement records logged for Assessment #{ass_id}.")
    assert len(history_records) >= 8
    db.close()

    print("\n=== PHASE 3 TEST COMPLETE: ALL VERIFICATIONS PASSED 100% ===")

if __name__ == "__main__":
    run_test()
