from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from datetime import datetime, timedelta
import io
import os

from models.user import User
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer
from models.user_competency import UserCompetency, CompetencyScore
from models.material import LearningMaterial, GeneratedQuestion
from models.recommendation import AIDiagnosis
from ai.service import AIService
from auth.security import hash_password

def run_tests():
    client = TestClient(app)
    db = SessionLocal()

    print("============================================================")
    print("   PHASE 7: AI SERVICE & SOURCE-GROUNDED GENERATION TEST    ")
    print("============================================================")

    # 1. Setup fresh officer
    test_email = "p7_ai_officer@gov.in"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id.in_(
            db.query(Assessment.id).filter(Assessment.user_id == existing.id)
        )).delete(synchronize_session=False)
        db.query(AIDiagnosis).filter(AIDiagnosis.user_id == existing.id).delete()
        db.query(Assessment).filter(Assessment.user_id == existing.id).delete()
        db.query(UserCompetency).filter(UserCompetency.user_id == existing.id).delete()
        db.query(CompetencyScore).filter(CompetencyScore.user_id == existing.id).delete()
        db.query(User).filter(User.id == existing.id).delete()
        db.commit()

    user = User(
        email=test_email,
        password_hash=hash_password("pass123"),
        full_name="Meera Sen",
        role="learner",
        role_id=1,  # Statistical Officer
        designation="Statistical Officer"
    )
    db.add(user)
    db.commit()

    # Login
    login_res = client.post("/api/auth/login", json={"email": test_email, "password": "pass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("1. [AUTHENTICATED]: Meera Sen (Statistical Officer)")

    # 2. Test AI Service Question Generation & Schema
    ai = AIService()
    q_generated = ai.generate_question(
        competency_name="Sampling Techniques",
        topic_name="Stratified Sampling",
        difficulty="3",
        source_context="MoSPI Official Sampling Handbook: In stratified sampling, Neyman allocation minimizes variance when stratum variances differ."
    )
    print(f"\n2. [AI QUESTION GENERATION ABSTRACTION]:")
    print(f"   - Question: '{q_generated.get('question_text')[:80]}...'")
    print(f"   - Correct Answer: '{q_generated.get('correct_answer')}'")
    print(f"   - Options Count: {len(q_generated.get('options', []))}")
    print(f"   - Source Reference: '{q_generated.get('source_reference')}'")
    print(f"   - Cognitive Level: '{q_generated.get('cognitive_level')}'")

    assert len(q_generated.get("options", [])) == 4
    assert q_generated.get("correct_answer") is not None
    assert "Sampling" in q_generated.get("competency", "")

    # 3. Test Question Validator with Good and Bad Inputs
    print(f"\n3. [QUESTION SCHEMA VALIDATION & REJECTION RULES]:")
    
    # Valid Question Test
    is_valid, msg = AIService.validate_question(q_generated)
    print(f"   - Valid Schema Test: is_valid={is_valid} ({msg})")
    assert is_valid is True

    # Bad Test 1: Only 3 options
    bad_q_3_opts = {
        "question_text": "What is the primary formula for stratified sampling variance?",
        "options": [
            {"text": "Option A", "is_correct": True},
            {"text": "Option B", "is_correct": False},
            {"text": "Option C", "is_correct": False}
        ],
        "correct_answer": "Option A"
    }
    is_valid_3, msg_3 = AIService.validate_question(bad_q_3_opts)
    print(f"   - Bad Schema (3 options) -> is_valid={is_valid_3} ({msg_3})")
    assert is_valid_3 is False

    # Bad Test 2: Two correct answers
    bad_q_2_correct = {
        "question_text": "What is the primary formula for stratified sampling variance?",
        "options": [
            {"text": "Option A", "is_correct": True},
            {"text": "Option B", "is_correct": True},
            {"text": "Option C", "is_correct": False},
            {"text": "Option D", "is_correct": False}
        ],
        "correct_answer": "Option A"
    }
    is_valid_2c, msg_2c = AIService.validate_question(bad_q_2_correct)
    print(f"   - Bad Schema (2 correct answers) -> is_valid={is_valid_2c} ({msg_2c})")
    assert is_valid_2c is False

    # Bad Test 3: Correct answer text does not match any option
    bad_q_mismatch = {
        "question_text": "What is the primary formula for stratified sampling variance?",
        "options": [
            {"text": "Option A", "is_correct": True},
            {"text": "Option B", "is_correct": False},
            {"text": "Option C", "is_correct": False},
            {"text": "Option D", "is_correct": False}
        ],
        "correct_answer": "Non-Existent Option X"
    }
    is_valid_mis, msg_mis = AIService.validate_question(bad_q_mismatch)
    print(f"   - Bad Schema (correct_answer mismatch) -> is_valid={is_valid_mis} ({msg_mis})")
    assert is_valid_mis is False

    # 4. Test Question Storage & Duplicate Prevention
    print(f"\n4. [DUPLICATE PREVENTION & REPOSITORY STORAGE]:")
    stored_q1 = AIService.validate_and_store_question(
        db=db,
        q_data=q_generated,
        competency_id=3,
        topic_id=7,
        created_by_user_id=user.id
    )
    assert stored_q1 is not None
    print(f"   - Stored New Question #{stored_q1.id} in Competency 3 (Sampling Techniques)")

    # Attempt to store exact same question again
    stored_q2 = AIService.validate_and_store_question(
        db=db,
        q_data=q_generated,
        competency_id=3,
        topic_id=7,
        created_by_user_id=user.id
    )
    assert stored_q2 is not None
    assert stored_q2.id == stored_q1.id
    print(f"   - Duplicate Prevention Verified: Identical question returned existing #{stored_q2.id} without re-inserting.")

    # 5. Test PDF / Document Material Ingestion Flow
    print(f"\n5. [MATERIAL INGESTION & QUESTION GENERATION PIPELINE]:")
    sample_text_content = (
        "National Statistical Commission (NSC) Technical Guidelines on Multistage Sampling Design. "
        "Chapter 4: Stratification and Post-Stratification in Periodic Labour Force Surveys. "
        "In rural sectors, villages constitute the first-stage units (FSUs), while households within selected "
        "FSUs form the ultimate stage units (USUs). Allocation of sample size across strata is conducted using "
        "Neyman optimal allocation to minimize sampling variance for key labour force indicators."
    )
    mock_file = io.BytesIO(sample_text_content.encode("utf-8"))
    
    upload_res = client.post(
        "/api/materials/upload",
        files={"file": ("mospi_plfs_guidelines.txt", mock_file, "text/plain")},
        headers=headers
    )
    assert upload_res.status_code == 200
    mat_data = upload_res.json()
    mat_id = mat_data["id"]
    print(f"   - Uploaded Material #{mat_id}: '{mat_data['title']}' (Extracted {mat_data['text_length']} chars)")
    print(f"   - Detected Topics: {mat_data['topics']}")
    print(f"   - Mapped Competencies: {mat_data['mapped_competencies']}")

    # Trigger source-grounded question generation from this material
    gen_res = client.post(
        f"/api/materials/{mat_id}/generate-questions?count=2&difficulty=2",
        headers=headers
    )
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    print(f"   - Generated & Validated {gen_data['validated_and_stored_count']} Questions from Material #{mat_id}")
    assert gen_data["validated_and_stored_count"] > 0

    # 6. Test AI Diagnosis & Caching / Cost Control
    print(f"\n6. [AI DIAGNOSIS & COST-CONTROL CACHING]:")
    
    # Establish assessment evidence with a gap
    t_now = datetime.now()
    ass = Assessment(user_id=user.id, assessment_type="baseline", status="completed", started_at=t_now, completed_at=t_now, overall_score=48.0)
    db.add(ass)
    db.commit()

    db.add(UserCompetency(user_id=user.id, competency_id=3, current_score=48.0, target_score=70.0, confidence=80.0, status="critical_gap"))
    db.commit()

    # First Call: Generates and caches
    diag_res1 = client.get("/api/competencies/me/diagnosis", headers=headers)
    assert diag_res1.status_code == 200
    diag1 = diag_res1.json()
    print(f"   - Initial Diagnosis (is_cached={diag1['is_cached']}):")
    print(f"     * Primary Gap: '{diag1['primary_gap']}'")
    print(f"     * Root Cause: '{diag1['root_cause']}'")
    print(f"     * Explanation: '{diag1['explanation']}'")
    print(f"     * Confidence: {diag1['confidence']}%")
    assert diag1["is_cached"] is False
    assert len(diag1["primary_gap"]) > 0

    # Second Call: Must return cached result without calling AI model
    diag_res2 = client.get("/api/competencies/me/diagnosis", headers=headers)
    assert diag_res2.status_code == 200
    diag2 = diag_res2.json()
    print(f"   - Second Call (is_cached={diag2['is_cached']}): Retrieved from database cache.")
    assert diag2["is_cached"] is True
    assert diag2["primary_gap"] == diag1["primary_gap"]

    # 7. CRITICAL EVIDENCE INTEGRITY CHECK:
    # Verify AI diagnosis DID NOT alter the user's competency score!
    db.expire_all()
    uc_check = db.query(UserCompetency).filter(
        UserCompetency.user_id == user.id,
        UserCompetency.competency_id == 3
    ).first()
    print(f"\n7. [CRITICAL SCORE INTEGRITY CHECK]:")
    print(f"   - Sampling Competency Score = {uc_check.current_score}% (UNCHANGED)")
    assert uc_check.current_score == 48.0
    print("   -> Integrity Rule PASSED: AI diagnoses explain evidence but NEVER overwrite scores!")

    db.close()
    print("\n============================================================")
    print("     ALL PHASE 7 AI SERVICE TESTS PASSED 100%!              ")
    print("============================================================")

if __name__ == "__main__":
    run_tests()
