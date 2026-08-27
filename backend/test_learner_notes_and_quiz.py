import os
import uuid
from fastapi.testclient import TestClient
from database import get_db
from main import app
from models.user import User
from models.material import LearningMaterial
from models.competency import Competency
from models.assessment import Assessment, Question, QuestionOption
from auth.security import hash_password, create_access_token

client = TestClient(app)

def test_learner_notes_and_quiz_workflow():
    print("============================================================")
    print("   SMARTLEARN LEARNER NOTES & AI QUIZ WORKFLOW TEST SUITE   ")
    print("============================================================")

    db = next(get_db())
    uid = str(uuid.uuid4())[:8]

    # 1. Setup Learner A (Arjun Patel, Statistical Officer)
    learner_email = f"arjun_{uid}@mospi.gov.in"
    learner = User(
        email=learner_email,
        password_hash=hash_password("LearnerPass123!"),
        full_name="Arjun Patel",
        role="learner",
        designation="Statistical Officer",
        role_id=1
    )
    db.add(learner)
    db.commit()
    db.refresh(learner)

    learner_token = create_access_token(data={"sub": learner.email, "role": "learner"})
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # 2. Setup Learner B
    learner_b_email = f"officer_b_{uid}@mospi.gov.in"
    learner_b = User(
        email=learner_b_email,
        password_hash=hash_password("PassB123!"),
        full_name="Meera Sen",
        role="learner",
        designation="Survey Officer",
        role_id=2
    )
    db.add(learner_b)
    db.commit()
    db.refresh(learner_b)
    learner_b_token = create_access_token(data={"sub": learner_b.email, "role": "learner"})
    learner_b_headers = {"Authorization": f"Bearer {learner_b_token}"}

    # ------------------------------------------------------------
    # TEST 1: Learner Uploads Personal Study Notes & Receives AI Summary
    # ------------------------------------------------------------
    print("\n[TEST 1]: Learner uploads personal study notes...")
    notes_content = b"PLFS Field Notes: Stratified cluster sampling is used where primary sampling units are 2011 Census villages. Non-response imputation follows hot-deck methodology within matching demographic cells."
    upload_res = client.post(
        "/api/materials/learner-notes/upload",
        headers=learner_headers,
        files={"file": ("plfs_personal_field_notes.txt", notes_content, "text/plain")},
        data={"title": "PLFS Field Sampling Notes", "competency_id": 3}
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    notes_data = upload_res.json()
    note_id = notes_data["id"]
    assert "summary" in notes_data and len(notes_data["summary"]) > 10
    assert "topics" in notes_data
    print(f"  -> Uploaded Note #{note_id}: '{notes_data['title']}'")
    print(f"  -> AI Executive Summary: {notes_data['summary']}")
    print(f"  -> Detected Topics: {notes_data['topics']}")

    # ------------------------------------------------------------
    # TEST 2: Retrieve My Personal Notes List
    # ------------------------------------------------------------
    print("\n[TEST 2]: Fetching learner's personal study notes repository...")
    my_notes_res = client.get("/api/materials/learner-notes/my-notes", headers=learner_headers)
    assert my_notes_res.status_code == 200
    my_notes = my_notes_res.json()
    assert len(my_notes) >= 1
    assert any(n["id"] == note_id for n in my_notes)
    print(f"  -> Successfully retrieved {len(my_notes)} personal study notes documents.")

    # ------------------------------------------------------------
    # TEST 3: Synthesize Instant 3-Question Practice Drill from Notes
    # ------------------------------------------------------------
    print(f"\n[TEST 3]: Synthesizing 3-question short practice drill from Note #{note_id}...")
    quiz_res = client.post(
        f"/api/materials/learner-notes/{note_id}/generate-practice-quiz?count=3&difficulty=2",
        headers=learner_headers
    )
    assert quiz_res.status_code == 200, f"Quiz generation failed: {quiz_res.text}"
    quiz_data = quiz_res.json()
    assessment_id = quiz_data["assessment_id"]
    questions = quiz_data["questions"]
    assert len(questions) == 3, f"Expected 3 questions, got {len(questions)}"
    assert quiz_data["assessment_type"] == "practice"
    print(f"  -> Created Practice Drill Assessment #{assessment_id} with {len(questions)} source-grounded questions.")
    for idx, q in enumerate(questions):
        print(f"     Q{idx+1}: {q['text'][:70]}... ({len(q['options'])} options)")

    # ------------------------------------------------------------
    # TEST 4: Take the Generated Practice Drill
    # ------------------------------------------------------------
    print(f"\n[TEST 4]: Learner takes the generated practice drill...")
    for q in questions:
        c_opt = db.query(QuestionOption).filter(QuestionOption.question_id == q["id"], QuestionOption.is_correct == True).first()
        ans_res = client.post(f"/api/assessments/{assessment_id}/submit-answer", headers=learner_headers, json={
            "question_id": q["id"],
            "selected_option_id": c_opt.id if c_opt else q["options"][0]["id"],
            "confidence_level": 3,
            "time_taken_seconds": 10
        })
        assert ans_res.status_code == 200

    comp_res = client.post(f"/api/assessments/{assessment_id}/complete", headers=learner_headers)
    assert comp_res.status_code == 200
    res_data = comp_res.json()
    print(f"  -> Practice Assessment #{assessment_id} completed. Overall Score: {res_data.get('overall_score')}%")

    # ------------------------------------------------------------
    # TEST 5: Security & Isolation (Learner B cannot access Learner A's notes)
    # ------------------------------------------------------------
    print("\n[TEST 5]: Verifying privacy & authorization isolation across learners...")
    unauth_drill = client.post(
        f"/api/materials/learner-notes/{note_id}/generate-practice-quiz?count=3",
        headers=learner_b_headers
    )
    assert unauth_drill.status_code == 404, "Learner B must NOT be able to synthesize quizzes from Learner A's private notes."
    print("  -> Tenant isolation verified: Private notes documents are strictly scoped to the uploader.")

    print("\n============================================================")
    print("   ALL LEARNER NOTES & AI QUIZ WORKFLOW TESTS PASSED!       ")
    print("============================================================")

if __name__ == "__main__":
    test_learner_notes_and_quiz_workflow()
