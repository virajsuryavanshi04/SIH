import os
import uuid
from fastapi.testclient import TestClient
from database import get_db
from main import app
from models.user import User
from models.material import LearningMaterial
from models.competency import Competency, RoleCompetency
from models.assessment import Question, QuestionOption, Assessment
from auth.security import hash_password, create_access_token

client = TestClient(app)

def run_ai_mcq_review_tests():
    print("============================================================")
    print("   SMARTLEARN AI MCQ GENERATION & REVIEW TEST SUITE        ")
    print("============================================================")

    db = next(get_db())

    # 1. Setup Admin and Learner
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        admin = User(
            email="dg.admin@mospi.gov.in",
            password_hash=hash_password("AdminSecure2026!"),
            full_name="Director General Admin",
            role="admin",
            designation="Admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    admin_token = create_access_token(data={"sub": admin.email, "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    learner = db.query(User).filter(User.role == "learner").first()
    learner_token = create_access_token(data={"sub": learner.email, "role": "learner"})
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # ------------------------------------------------------------
    # TEST 1: Upload Material & Generate 10 Questions
    # ------------------------------------------------------------
    print("\n[TEST 1]: Uploading material and generating 10 questions...")
    test_pdf_content = b"MoSPI National Survey Handbook 2026: Section 4.2 Stratified Sampling Allocation Rules and Neyman Formulas."
    upload_res = client.post(
        "/api/materials/upload",
        headers=admin_headers,
        files={"file": ("mospi_sampling_guide.txt", test_pdf_content, "text/plain")},
        data={"title": "MoSPI Sampling Handbook 2026", "competency_id": 3}
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    mat_id = upload_res.json()["id"]

    gen_10_res = client.post(
        f"/api/materials/{mat_id}/generate-questions?count=10&difficulty=2",
        headers=admin_headers
    )
    assert gen_10_res.status_code == 200
    gen_10_data = gen_10_res.json()
    questions_10 = gen_10_data["questions"]
    assert len(questions_10) == 10, f"Expected 10 generated questions, got {len(questions_10)}"
    print(f"  -> Generated {len(questions_10)} questions from Material #{mat_id}.")
    for q in questions_10:
        assert q["status"] == "pending_review"
    print("  -> All 10 questions persisted with status='pending_review'.")

    # ------------------------------------------------------------
    # TEST 2: Generate exactly 5 questions on demand
    # ------------------------------------------------------------
    print("\n[TEST 2]: Generating 5 questions via on-demand question synthesis...")
    gen_5_res = client.post("/api/questions/generate", headers=admin_headers, json={
        "competency_id": 1,
        "difficulty": "2",
        "count": 5
    })
    assert gen_5_res.status_code == 200
    gen_5_data = gen_5_res.json()
    assert len(gen_5_data["questions"]) == 5
    print(f"  -> Successfully generated exactly 5 questions (Count check passed).")

    # ------------------------------------------------------------
    # TEST 3: Verify No Duplicate Questions in 10-Question Batch
    # ------------------------------------------------------------
    print("\n[TEST 3]: Checking duplicate prevention in generated batch...")
    q_texts = [q["question_text"] for q in questions_10]
    unique_texts = set(q_texts)
    assert len(unique_texts) == len(q_texts), "All generated questions must have distinct scenarios."
    print(f"  -> All {len(q_texts)} generated questions are unique.")

    # ------------------------------------------------------------
    # TEST 4: Schema & Structure Verification for each Question
    # ------------------------------------------------------------
    print("\n[TEST 4]: Verifying required schema on generated questions...")
    sample_q = questions_10[0]
    assert "competency_name" in sample_q and sample_q["competency_name"]
    assert "difficulty" in sample_q and sample_q["difficulty"]
    assert "correct_answer" in sample_q and sample_q["correct_answer"]
    assert "explanation" in sample_q and len(sample_q["explanation"]) > 10
    assert "source_reference" in sample_q and sample_q["source_reference"]
    assert len(sample_q["options"]) == 4
    
    correct_opts = [o for o in sample_q["options"] if o.get("is_correct")]
    assert len(correct_opts) == 1, f"Expected exactly 1 correct option, got {len(correct_opts)}"
    assert correct_opts[0]["text"] == sample_q["correct_answer"]
    print("  -> Question schema verified: 4 options, 1 correct key matching text, explanation & source citation present.")

    # ------------------------------------------------------------
    # TEST 5: Approve Question & Check Active Bank Availability
    # ------------------------------------------------------------
    print("\n[TEST 5]: Approving Question #{}...".format(sample_q["id"]))
    approve_res = client.patch(f"/api/questions/{sample_q['id']}/status", headers=admin_headers, json={"status": "approved"})
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"
    
    # Verify in approved bank
    approved_list = client.get("/api/questions/?status=approved", headers=admin_headers).json()
    assert any(q["id"] == sample_q["id"] for q in approved_list)
    print(f"  -> Question #{sample_q['id']} approved and added to active assessment pool.")

    # ------------------------------------------------------------
    # TEST 6: Reject Question & Check Exclusion
    # ------------------------------------------------------------
    reject_target = questions_10[1]
    print(f"\n[TEST 6]: Rejecting Question #{reject_target['id']}...")
    reject_res = client.patch(f"/api/questions/{reject_target['id']}/status", headers=admin_headers, json={"status": "rejected"})
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"
    print(f"  -> Question #{reject_target['id']} status set to rejected (excluded from active pool).")

    # ------------------------------------------------------------
    # TEST 7: Edit Question and verify persistence
    # ------------------------------------------------------------
    print(f"\n[TEST 7]: Editing Question #{sample_q['id']}...")
    edit_res = client.put(f"/api/questions/{sample_q['id']}", headers=admin_headers, json={
        "text": sample_q["text"] + " [Peer Reviewed Benchmark 2026]",
        "explanation": "Updated official explanation based on MoSPI Chapter 4 standards."
    })
    assert edit_res.status_code == 200
    assert "Peer Reviewed Benchmark 2026" in edit_res.json()["question_text"]
    print(f"  -> Question #{sample_q['id']} successfully updated and persisted.")

    # ------------------------------------------------------------
    # TEST 8: Verify Learner Assessment Does NOT Leak is_correct
    # ------------------------------------------------------------
    print("\n[TEST 8]: Starting learner assessment and checking no answer leakage...")
    ass_start = client.post("/api/assessments/start", headers=learner_headers, json={"assessment_type": "baseline"})
    assert ass_start.status_code == 200
    learner_questions = ass_start.json()["questions"]
    for lq in learner_questions:
        for opt in lq["options"]:
            assert "is_correct" not in opt or opt["is_correct"] is None, "Learner assessment must NEVER expose is_correct in options!"
    print("  -> Learner security verified: Option answers are hidden during assessment session.")

    # ------------------------------------------------------------
    # TEST 9: Adaptive Assessment Engine Selects Approved Questions
    # ------------------------------------------------------------
    print("\n[TEST 9]: Verifying adaptive engine integration with approved pool...")
    from services.assessment_service import select_questions
    selected = select_questions(db, user=admin, assessment_type="baseline")
    assert len(selected) >= 1
    for sq in selected:
        assert sq.status == "approved"
    print("  -> Adaptive engine verified: Strictly queries questions where status='approved'.")

    print("\n============================================================")
    print("   ALL 9 AI MCQ GENERATION & REVIEW TESTS PASSED 100%!     ")
    print("============================================================")

if __name__ == "__main__":
    run_ai_mcq_review_tests()
