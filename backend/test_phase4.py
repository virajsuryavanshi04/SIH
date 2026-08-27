from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.competency import Competency, CompetencyTopic, RoleCompetency
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
from models.user_competency import UserCompetency, CompetencyScore
from services.adaptive_assessment_service import AdaptiveAssessmentService
from auth.security import hash_password

def run_tests():
    client = TestClient(app)
    db = SessionLocal()

    print("============================================================")
    print("      PHASE 4: ADAPTIVE ASSESSMENT ENGINE TEST SUITE       ")
    print("============================================================")

    # Clean any dummy test questions
    db.query(QuestionOption).filter(QuestionOption.question_id.in_(
        db.query(Question.id).filter(Question.competency_id == 999)
    )).delete(synchronize_session=False)
    db.query(Question).filter(Question.competency_id == 999).delete(synchronize_session=False)
    db.commit()

    # ------------------------------------------------------------
    # Scenario A: Correct -> Correct -> difficulty increases
    # ------------------------------------------------------------
    print("\n[SCENARIO A]: 2 Consecutive Correct Answers -> Difficulty Increases")
    diff, c_str, i_str = AdaptiveAssessmentService.compute_next_difficulty(
        current_diff=2, is_correct=True, correct_streak=0, incorrect_streak=0
    )
    assert diff == 2 and c_str == 1 and i_str == 0
    print(f"  Answer 1 (Correct): Difficulty remains {diff}, Correct Streak = {c_str}")

    diff, c_str, i_str = AdaptiveAssessmentService.compute_next_difficulty(
        current_diff=diff, is_correct=True, correct_streak=c_str, incorrect_streak=i_str
    )
    assert diff == 3 and c_str == 0
    print(f"  Answer 2 (Correct): Difficulty PROMOTED to {diff} (Hard), Streak Reset = {c_str}")
    print("  -> Scenario A PASSED.")

    # ------------------------------------------------------------
    # Scenario B: Wrong -> Wrong -> difficulty decreases
    # ------------------------------------------------------------
    print("\n[SCENARIO B]: 2 Consecutive Incorrect Answers -> Difficulty Decreases")
    diff, c_str, i_str = AdaptiveAssessmentService.compute_next_difficulty(
        current_diff=2, is_correct=False, correct_streak=0, incorrect_streak=0
    )
    assert diff == 2 and c_str == 0 and i_str == 1
    print(f"  Answer 1 (Wrong): Difficulty remains {diff}, Incorrect Streak = {i_str}")

    diff, c_str, i_str = AdaptiveAssessmentService.compute_next_difficulty(
        current_diff=diff, is_correct=False, correct_streak=c_str, incorrect_streak=i_str
    )
    assert diff == 1 and i_str == 0
    print(f"  Answer 2 (Wrong): Difficulty DEMOTED to {diff} (Easy), Streak Reset = {i_str}")
    print("  -> Scenario B PASSED.")

    # ------------------------------------------------------------
    # Scenario C: Easy cannot go below Easy
    # ------------------------------------------------------------
    print("\n[SCENARIO C]: Difficulty Floor Bound (Easy / 1 cannot drop below 1)")
    diff, c_str, i_str = AdaptiveAssessmentService.compute_next_difficulty(
        current_diff=1, is_correct=False, correct_streak=0, incorrect_streak=1
    )
    assert diff == 1
    print(f"  2 Wrong on Easy -> Resulting Difficulty = {diff} (Floored at 1/Easy)")
    print("  -> Scenario C PASSED.")

    # ------------------------------------------------------------
    # Scenario D: Hard cannot go above Hard
    # ------------------------------------------------------------
    print("\n[SCENARIO D]: Difficulty Ceiling Bound (Hard / 3 cannot exceed 3)")
    diff, c_str, i_str = AdaptiveAssessmentService.compute_next_difficulty(
        current_diff=3, is_correct=True, correct_streak=1, incorrect_streak=0
    )
    assert diff == 3
    print(f"  2 Correct on Hard -> Resulting Difficulty = {diff} (Capped at 3/Hard)")
    print("  -> Scenario D PASSED.")

    # ------------------------------------------------------------
    # Scenario E: User weak in Stratified Sampling but strong in Fundamentals
    # System prioritizes Stratified Sampling.
    # ------------------------------------------------------------
    print("\n[SCENARIO E]: Weak Subtopic Prioritization")
    # Subtopic 7 = Stratified Sampling, Subtopic 8 = Sampling Fundamentals
    mock_state = {
        "competency_ids": [3],
        "per_competency_difficulty": {"3": 2},
        "per_topic_difficulty": {"7": 1, "8": 3},
        "performance_by_topic": {
            "8": {"name": "Sampling Fundamentals", "competency_id": 3, "total": 2, "correct": 2},  # 100%
            "7": {"name": "Stratified Sampling", "competency_id": 3, "total": 2, "correct": 0}    # 0% (Weak)
        },
        "answered_count": 4
    }
    next_cid, next_tid, next_diff = AdaptiveAssessmentService.choose_next_target(db, mock_state)
    print(f"  Identified Weak Subtopic to Probe: Topic ID = {next_tid} (Stratified Sampling), Target Difficulty = {next_diff}")
    assert next_tid == 7
    print("  -> Scenario E PASSED.")

    # ------------------------------------------------------------
    # Scenario F: Anti-repetition (Previously answered question is avoided)
    # ------------------------------------------------------------
    print("\n[SCENARIO F]: Anti-Repetition Question Selection")
    # Clean test user
    test_email = "p4_test_user@gov.in"
    existing_user = db.query(User).filter(User.email == test_email).first()
    if existing_user:
        db.query(UserQuestionHistory).filter(UserQuestionHistory.user_id == existing_user.id).delete()
        db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id.in_(
            db.query(Assessment.id).filter(Assessment.user_id == existing_user.id)
        )).delete(synchronize_session=False)
        db.query(Assessment).filter(Assessment.user_id == existing_user.id).delete()
        db.query(UserCompetency).filter(UserCompetency.user_id == existing_user.id).delete()
        db.query(CompetencyScore).filter(CompetencyScore.user_id == existing_user.id).delete()
        db.query(User).filter(User.id == existing_user.id).delete()
        db.commit()

    user = User(
        email=test_email,
        password_hash=hash_password("pass123"),
        full_name="Rajesh Verma",
        role="learner",
        role_id=1,
        designation="Statistical Officer"
    )
    db.add(user)
    db.commit()

    # Get first question in Competency 1
    q1 = db.query(Question).filter(Question.competency_id == 1, Question.status == "approved").first()
    assert q1 is not None

    # Simulate user has already answered/seen q1
    db.add(UserQuestionHistory(user_id=user.id, question_id=q1.id, times_seen=1))
    db.commit()

    # Ask adaptive selector for question in Comp 1
    q_selected, gen_req = AdaptiveAssessmentService.select_adaptive_question(
        db, user.id, competency_id=1, topic_id=q1.topic_id, difficulty=2, excluded_ids=[]
    )
    assert q_selected is not None
    assert q_selected.id != q1.id
    print(f"  Excluded seen Question #{q1.id} -> Selected fresh Question #{q_selected.id} ({q_selected.question_text[:45]}...)")
    print("  -> Scenario F PASSED.")

    # ------------------------------------------------------------
    # Scenario G: Fallback - No suitable question exists -> returns question_generation_required
    # ------------------------------------------------------------
    print("\n[SCENARIO G]: Fallback - Question Generation Required Abstraction")
    # Query an imaginary competency ID 999
    q_empty, gen_required = AdaptiveAssessmentService.select_adaptive_question(
        db, user.id, competency_id=999, topic_id=999, difficulty=3, excluded_ids=[]
    )
    assert q_empty is None
    assert gen_required is True
    print(f"  No available question for Competency 999 -> question_generation_required = {gen_required}")
    print("  -> Scenario G PASSED.")

    # ------------------------------------------------------------
    # Full Live End-to-End Test with API
    # ------------------------------------------------------------
    print("\n[SCENARIO H]: Full Live Dynamic Assessment API Step Flow")
    login_res = client.post("/api/auth/login", json={"email": test_email, "password": "pass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Start Adaptive Session
    start_res = client.post("/api/assessments/start", json={
        "assessment_type": "adaptive",
        "question_count": 6
    }, headers=headers)
    assert start_res.status_code == 200
    ass_data = start_res.json()
    ass_id = ass_data["assessment_id"]
    first_q = ass_data["questions"][0]
    print(f"  1. Started Adaptive Assessment #{ass_id} (Total: 6 steps)")

    curr_q = first_q
    for step in range(1, 7):
        # Pick option
        db_q = db.query(Question).filter(Question.id == curr_q["id"]).first()
        correct_opt = [o for o in db_q.options if o.is_correct][0]

        step_res = client.post(f"/api/assessments/{ass_id}/adaptive-next", json={
            "question_id": curr_q["id"],
            "selected_option_id": correct_opt.id,
            "confidence_level": 3,
            "time_taken_seconds": 10
        }, headers=headers)
        assert step_res.status_code == 200
        step_payload = step_res.json()

        if step_payload["is_completed"]:
            print(f"  Step {step}: Completed Assessment! Overall Score = {step_payload['result']['overall_readiness']}%")
            assert step_payload["result"] is not None
            break
        else:
            curr_q = step_payload["next_question"]
            print(f"  Step {step}: Answered -> Next Question #{curr_q['id']} in [{curr_q['competency_name']}] Topic: {curr_q['topic_name']} (Diff: {curr_q['difficulty']})")

    db.close()
    print("\n============================================================")
    print("      ALL PHASE 4 TEST SCENARIOS PASSED 100%!               ")
    print("============================================================")

if __name__ == "__main__":
    run_tests()
