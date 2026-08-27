from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from datetime import datetime, timedelta
from models.user import User
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.course import Course, CourseCompetency
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
from models.user_competency import UserCompetency, CompetencyScore
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from services.igot_service import MockIGOTService, get_learning_resource_provider
from auth.security import hash_password

def run_tests():
    client = TestClient(app)
    db = SessionLocal()

    print("============================================================")
    print("  PHASE 6: PERSONALIZED RECOMMENDATION ENGINE TEST SUITE    ")
    print("============================================================")

    # 1. Setup fresh officer
    test_email = "p6_recs_officer@gov.in"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id.in_(
            db.query(Assessment.id).filter(Assessment.user_id == existing.id)
        )).delete(synchronize_session=False)
        db.query(Assessment).filter(Assessment.user_id == existing.id).delete()
        db.query(LearningProgress).filter(LearningProgress.user_id == existing.id).delete()
        db.query(LearningPathItem).filter(LearningPathItem.learning_path_id.in_(
            db.query(LearningPath.id).filter(LearningPath.user_id == existing.id)
        )).delete(synchronize_session=False)
        db.query(LearningPath).filter(LearningPath.user_id == existing.id).delete()
        db.query(UserCompetency).filter(UserCompetency.user_id == existing.id).delete()
        db.query(CompetencyScore).filter(CompetencyScore.user_id == existing.id).delete()
        db.query(User).filter(User.id == existing.id).delete()
        db.commit()

    user = User(
        email=test_email,
        password_hash=hash_password("pass123"),
        full_name="Vikram Sethi",
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
    print("1. [AUTHENTICATED]: Vikram Sethi (Statistical Officer)")

    # 2. Establish baseline competency profile where:
    # Sampling Techniques (ID 3) = 48% (Target: 70%, Gap: -22% -> LARGEST GAP)
    # All other competencies = 80-85% (Target met, 0 gap)
    role_reqs = db.query(RoleCompetency).filter(RoleCompetency.role_id == 1).all()
    for req in role_reqs:
        cid = req.competency_id
        if cid == 3:
            # Priority deficit gap
            uc = UserCompetency(user_id=user.id, competency_id=3, current_score=48.0, target_score=70.0, confidence=80.0, status="critical_gap")
        else:
            # Satisfied benchmark
            uc = UserCompetency(user_id=user.id, competency_id=cid, current_score=85.0, target_score=req.target_score, confidence=90.0, status="strong")
        db.add(uc)
    db.commit()

    # Also register a weak subtopic for Sampling (Topic 7 = Stratified Sampling)
    # Simulate an answer in topic 7 that was incorrect
    q_st = db.query(Question).filter(Question.competency_id == 3).first()
    if q_st and q_st.topic_id:
        ass_dummy = Assessment(user_id=user.id, assessment_type="baseline", status="completed", overall_score=48.0)
        db.add(ass_dummy)
        db.commit()
        db.add(AssessmentAnswer(assessment_id=ass_dummy.id, question_id=q_st.id, selected_option_id=1, is_correct=False))
        db.commit()

    print(f"2. [ACTIVE COMPETENCY STATE]:")
    print(f"   - Sampling Techniques: 48.0% vs Target 70.0% (PRIMARY DEFICIT GAP: -22.0%)")
    print(f"   - Other Role Competencies: 85.0% (Proficient, Gap: 0.0%)")

    # 3. Call GET /api/courses/recommended
    recs_res = client.get("/api/courses/recommended", headers=headers)
    assert recs_res.status_code == 200
    recs = recs_res.json()
    assert len(recs) > 0

    top_rec = recs[0]
    print(f"\n3. [RECOMMENDATION RANKING VERIFIED]:")
    print(f"   #1 Top Match: '{top_rec['title']}'")
    print(f"      - Competency: {top_rec['competency_name']}")
    print(f"      - Match Score: {top_rec['match_percent']}%")
    print(f"      - Provider: {top_rec['provider']} ({top_rec['resource_type']})")
    print(f"      - Explanation: '{top_rec['explanation']}'")
    print(f"      - Breakdown: {top_rec['score_components']}")

    # Verification of explainable formula:
    # Top recommendation MUST address the priority deficit in Sampling Techniques
    assert top_rec["competency_id"] == 3
    assert top_rec["match_percent"] >= 70.0
    assert "Sampling" in top_rec["explanation"]

    # Verify that a course in Data Quality (where user is already 85%) has a significantly lower match score
    dq_rec = next((r for r in recs if r["competency_id"] == 5), None)
    if dq_rec:
        print(f"   Competency 5 (Data Quality) Course Match Score = {dq_rec['match_percent']}% (Lower due to zero deficit gap)")
        assert dq_rec["match_percent"] < top_rec["match_percent"]

    # 4. Test iGOT Provider Abstraction
    provider = get_learning_resource_provider()
    provider_courses = provider.get_courses(db, limit=5)
    print(f"\n4. [iGOT SERVICE ABSTRACTION]: Provider returned {len(provider_courses)} accredited resources.")
    assert len(provider_courses) > 0

    # 5. Test Learning Progress Lifecycle (Enroll -> Progress -> Complete)
    course_id = top_rec["id"]
    print(f"\n5. [LEARNING PROGRESS LIFECYCLE]:")
    
    # Enroll
    enroll_res = client.post(f"/api/courses/{course_id}/enroll", headers=headers)
    assert enroll_res.status_code == 200
    print(f"   - Enrolled in Course #{course_id}")

    # Update Progress to 50%
    prog_res = client.patch(f"/api/courses/{course_id}/progress", json={"progress_percent": 50.0}, headers=headers)
    assert prog_res.status_code == 200
    print(f"   - Progress updated: 50.0%")

    # Complete Course
    comp_res = client.post(f"/api/courses/{course_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    print(f"   - Course #{course_id} marked COMPLETED")

    # 6. CRITICAL EVIDENCE RULE VERIFICATION:
    # Verify course completion DID NOT alter the user's competency score!
    db.expire_all()
    uc_after = db.query(UserCompetency).filter(
        UserCompetency.user_id == user.id,
        UserCompetency.competency_id == 3
    ).first()
    print(f"\n6. [CRITICAL EVIDENCE INTEGRITY CHECK]:")
    print(f"   - Sampling Competency Score after course completion = {uc_after.current_score}% (UNCHANGED)")
    assert uc_after.current_score == 48.0
    print("   -> Integrity Rule PASSED: Competency scores update ONLY through assessment evidence!")

    # 7. Test Learning Path Generation
    lp_res = client.post("/api/learning-path/generate", headers=headers)
    assert lp_res.status_code == 200
    lp_data = lp_res.json()
    print(f"\n7. [PERSONALIZED LEARNING PATH GENERATED]:")
    print(f"   Path ID #{lp_data['id']}: {len(lp_data['items'])} milestones sequenced to close active gaps:")
    for item in lp_data["items"][:3]:
        print(f"   Step {item['order']}: '{item['title']}' ({item['estimated_duration']}, Status: {item['status']})")
    assert len(lp_data["items"]) > 0

    db.close()
    print("\n============================================================")
    print("   ALL PHASE 6 RECOMMENDATION ENGINE TESTS PASSED 100%!     ")
    print("============================================================")

if __name__ == "__main__":
    run_tests()
