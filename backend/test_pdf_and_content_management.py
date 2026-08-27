import os
import uuid
from fastapi.testclient import TestClient
from database import get_db
from main import app
from models.user import User
from models.material import LearningMaterial, GeneratedQuestion
from models.competency import Competency, RoleCompetency
from models.assessment import Question, QuestionOption, Assessment
from auth.security import hash_password, create_access_token

client = TestClient(app)

def test_pdf_and_content_management_flow():
    print("============================================================")
    print("   SMARTLEARN PDF UPLOAD & CONTENT MANAGEMENT TEST SUITE    ")
    print("============================================================")

    db = next(get_db())
    uid = str(uuid.uuid4())[:8]

    # 1. Setup Admin
    admin_email = f"content_admin_{uid}@mospi.gov.in"
    admin = User(
        email=admin_email,
        password_hash=hash_password("AdminPass123!"),
        full_name="Director General Content Manager",
        role="admin",
        designation="Director General"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    admin_token = create_access_token(data={"sub": admin.email, "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Setup Learner
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

    # ------------------------------------------------------------
    # TEST 1: Learner Access & Practice Workflow
    # ------------------------------------------------------------
    print("\n[TEST 1]: Verifying Learner Materials Access and Practice Launch...")
    mats_res = client.get("/api/materials/", headers=learner_headers)
    assert mats_res.status_code == 200
    print(f"  -> Learner successfully viewed {len(mats_res.json())} knowledge base handbooks.")

    practice_res = client.post("/api/assessments/start", headers=learner_headers, json={
        "assessment_type": "practice",
        "competency_ids": [1],
        "difficulty": "2",
        "question_count": 5
    })
    assert practice_res.status_code == 200
    print(f"  -> Practice Assessment #{practice_res.json()['assessment_id']} created for learner.")

    # ------------------------------------------------------------
    # TEST 2: Content Admin PDF Upload & Ingestion Pipeline
    # ------------------------------------------------------------
    print("\n[TEST 2]: Content Admin uploads official statistical PDF...")
    pdf_sample = b"%PDF-1.4 MoSPI National Socio-Economic Survey Methodology Standards: Section 4.2 Stratified Neyman Allocation."
    upload_res = client.post(
        "/api/materials/upload",
        headers=admin_headers,
        files={"file": ("mospi_sampling_guidelines_2026.pdf", pdf_sample, "application/pdf")},
        data={"title": "MoSPI Sampling Guidelines 2026", "competency_id": 3}
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    mat_data = upload_res.json()
    mat_id = mat_data["id"]
    assert mat_data["processing_status"] == "completed"
    print(f"  -> Ingested Material #{mat_id}: '{mat_data['title']}' | Status: {mat_data['processing_status']}")

    # ------------------------------------------------------------
    # TEST 3: AI MCQ Generation from Ingested PDF
    # ------------------------------------------------------------
    print("\n[TEST 3]: Generating 10 MCQs from uploaded material...")
    gen_res = client.post(
        f"/api/materials/{mat_id}/generate-questions?count=10&difficulty=2",
        headers=admin_headers
    )
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    questions = gen_data["questions"]
    assert len(questions) == 10
    print(f"  -> Successfully synthesized {len(questions)} source-grounded questions.")
    for q in questions:
        assert q["status"] == "pending_review"
    print("  -> All 10 candidate questions verified with status='pending_review'.")

    # ------------------------------------------------------------
    # TEST 4: Question Review, Approval, Rejection & Editing
    # ------------------------------------------------------------
    q_to_approve = questions[0]
    q_to_reject = questions[1]

    print(f"\n[TEST 4]: Admin reviews Question #{q_to_approve['id']}...")
    app_res = client.patch(f"/api/questions/{q_to_approve['id']}/status", headers=admin_headers, json={"status": "approved"})
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"
    print(f"  -> Question #{q_to_approve['id']} marked as approved.")

    rej_res = client.patch(f"/api/questions/{q_to_reject['id']}/status", headers=admin_headers, json={"status": "rejected"})
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "rejected"
    print(f"  -> Question #{q_to_reject['id']} marked as rejected.")

    edit_res = client.put(f"/api/questions/{q_to_approve['id']}", headers=admin_headers, json={
        "text": q_to_approve["text"] + " [Reviewed 2026]",
        "explanation": "Updated official mathematical rationale."
    })
    assert edit_res.status_code == 200
    print(f"  -> Question #{q_to_approve['id']} edited and persisted.")

    # ------------------------------------------------------------
    # TEST 5: Learner Question Bank Availability
    # ------------------------------------------------------------
    print("\n[TEST 5]: Verifying learner assessment only draws from approved question pool...")
    from services.assessment_service import select_questions
    learner_sample = select_questions(db, user=learner, assessment_type="baseline")
    for q in learner_sample:
        assert q.status == "approved", f"Question #{q.id} with status '{q.status}' was served to learner!"
    print("  -> Learner pool integrity verified: 100% of served questions have status='approved'.")

    # ------------------------------------------------------------
    # TEST 6: Security & Role Authorization Boundaries
    # ------------------------------------------------------------
    print("\n[TEST 6]: Verifying learner unauthorized actions are rejected with 403...")
    
    # 1. Learner cannot upload material
    unauth_up = client.post(
        "/api/materials/upload",
        headers=learner_headers,
        files={"file": ("test.pdf", b"pdf content", "application/pdf")}
    )
    assert unauth_up.status_code == 403, f"Expected 403, got {unauth_up.status_code}"
    print(f"  -> Learner PDF upload blocked with 403: {unauth_up.json()['detail']}")

    # 2. Learner cannot trigger AI question generation
    unauth_gen = client.post(
        f"/api/materials/{mat_id}/generate-questions?count=5",
        headers=learner_headers
    )
    assert unauth_gen.status_code == 403
    print("  -> Learner AI MCQ synthesis blocked with 403.")

    # 3. Learner cannot approve questions
    unauth_app = client.patch(
        f"/api/questions/{q_to_reject['id']}/status",
        headers=learner_headers,
        json={"status": "approved"}
    )
    assert unauth_app.status_code == 403
    print("  -> Learner Question curation blocked with 403.")

    print("\n============================================================")
    print("   ALL 6 PDF UPLOAD & CONTENT MANAGEMENT TESTS PASSED!     ")
    print("============================================================")

if __name__ == "__main__":
    test_pdf_and_content_management_flow()
