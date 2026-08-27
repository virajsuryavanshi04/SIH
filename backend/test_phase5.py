from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from datetime import datetime, timedelta
from models.user import User
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer, UserQuestionHistory
from models.user_competency import UserCompetency, CompetencyScore
from auth.security import hash_password

def run_tests():
    client = TestClient(app)
    db = SessionLocal()

    print("============================================================")
    print("   PHASE 5: CONTINUOUS COMPETENCY EVALUATION TEST SUITE     ")
    print("============================================================")

    # 1. Setup fresh officer
    test_email = "p5_continuous_officer@gov.in"
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
        full_name="Pooja Sharma",
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
    print("1. [AUTHENTICATED]: Pooja Sharma (Statistical Officer)")

    # 2. Simulate Assessment 1 (Baseline): Sampling = 48.0%, Stats = 80.0%
    t1 = datetime.utcnow() - timedelta(days=15)
    ass1 = Assessment(user_id=user.id, assessment_type="baseline", status="completed", started_at=t1, completed_at=t1, overall_score=64.0)
    db.add(ass1)
    db.commit()
    db.refresh(ass1)

    db.add(CompetencyScore(user_id=user.id, competency_id=3, score=48.0, assessment_id=ass1.id, source="baseline", assessed_at=t1))
    db.add(CompetencyScore(user_id=user.id, competency_id=1, score=80.0, assessment_id=ass1.id, source="baseline", assessed_at=t1))
    
    uc3 = UserCompetency(user_id=user.id, competency_id=3, current_score=48.0, target_score=70.0, confidence=80.0, status="critical_gap", last_assessed=t1)
    uc1 = UserCompetency(user_id=user.id, competency_id=1, current_score=80.0, target_score=80.0, confidence=90.0, status="strong", last_assessed=t1)
    db.add(uc3)
    db.add(uc1)
    db.commit()
    print("2. [BASELINE RECORDED]: Sampling = 48.0% (Target: 70.0%, Gap: -22.0%), Stats = 80.0%")

    # Check /api/competencies/me
    res1 = client.get("/api/competencies/me", headers=headers).json()
    sampling_1 = [c for c in res1 if c["competency_name"] == "Sampling Techniques"][0]
    assert sampling_1["current_score"] == 48.0
    assert sampling_1["gap"] == 22.0
    assert sampling_1["status"] == "critical_gap"
    assert sampling_1["assessment_count"] == 1
    assert sampling_1["trend"] == "new"

    # 3. Simulate Assessment 2 (Reassessment 1 after learning): Sampling improves to 56.0%
    t2 = datetime.utcnow() - timedelta(days=10)
    ass2 = Assessment(user_id=user.id, assessment_type="adaptive_reassessment", status="completed", started_at=t2, completed_at=t2, overall_score=68.0)
    db.add(ass2)
    db.commit()
    db.refresh(ass2)

    db.add(CompetencyScore(user_id=user.id, competency_id=3, score=56.0, assessment_id=ass2.id, source="adaptive_reassessment", assessed_at=t2))
    uc3.current_score = 56.0
    uc3.status = "needs_attention"
    uc3.last_assessed = t2
    db.commit()

    res2 = client.get("/api/competencies/me", headers=headers).json()
    sampling_2 = [c for c in res2 if c["competency_name"] == "Sampling Techniques"][0]
    print(f"3. [REASSESSMENT 1]: Sampling = {sampling_2['current_score']}% | Change = +{sampling_2['change_points']} pts | Trend = {sampling_2['trend']} | Imprv = +{sampling_2['percentage_improvement']}%")
    assert sampling_2["current_score"] == 56.0
    assert sampling_2["previous_score"] == 48.0
    assert sampling_2["change_points"] == 8.0
    assert sampling_2["trend"] == "improving"
    assert sampling_2["assessment_count"] == 2

    # 4. Simulate Assessment 3 (Reassessment 2): Sampling improves to 64.0%
    t3 = datetime.utcnow() - timedelta(days=5)
    ass3 = Assessment(user_id=user.id, assessment_type="adaptive_reassessment", status="completed", started_at=t3, completed_at=t3, overall_score=72.0)
    db.add(ass3)
    db.commit()
    db.refresh(ass3)

    db.add(CompetencyScore(user_id=user.id, competency_id=3, score=64.0, assessment_id=ass3.id, source="adaptive_reassessment", assessed_at=t3))
    uc3.current_score = 64.0
    uc3.status = "on_track"
    uc3.last_assessed = t3
    db.commit()

    res3 = client.get("/api/competencies/me", headers=headers).json()
    sampling_3 = [c for c in res3 if c["competency_name"] == "Sampling Techniques"][0]
    print(f"4. [REASSESSMENT 2]: Sampling = {sampling_3['current_score']}% | Change = +{sampling_3['change_points']} pts | Trend = {sampling_3['trend']}")
    assert sampling_3["current_score"] == 64.0
    assert sampling_3["previous_score"] == 56.0
    assert sampling_3["change_points"] == 8.0
    assert sampling_3["trend"] == "improving"
    assert sampling_3["assessment_count"] == 3

    # 5. Simulate Assessment 4 (Reassessment 3): Sampling improves to 72.0% (Target Met!)
    t4 = datetime.utcnow()
    ass4 = Assessment(user_id=user.id, assessment_type="adaptive_reassessment", status="completed", started_at=t4, completed_at=t4, overall_score=76.0)
    db.add(ass4)
    db.commit()
    db.refresh(ass4)

    db.add(CompetencyScore(user_id=user.id, competency_id=3, score=72.0, assessment_id=ass4.id, source="adaptive_reassessment", assessed_at=t4))
    uc3.current_score = 72.0
    uc3.status = "strong"
    uc3.last_assessed = t4
    db.commit()

    res4 = client.get("/api/competencies/me", headers=headers).json()
    sampling_4 = [c for c in res4 if c["competency_name"] == "Sampling Techniques"][0]
    print(f"5. [REASSESSMENT 3]: Sampling = {sampling_4['current_score']}% | Target = {sampling_4['target_score']}% | Status = {sampling_4['status']} | Gap = {sampling_4['gap']}%")
    assert sampling_4["current_score"] == 72.0
    assert sampling_4["target_score"] == 70.0
    assert sampling_4["gap"] == 0.0
    assert sampling_4["status"] == "strong"
    assert sampling_4["assessment_count"] == 4

    # 6. Verify Full Chronological History (/api/competencies/me/history)
    history_res = client.get("/api/competencies/me/history", headers=headers).json()
    sampling_history = [h for h in history_res if h["competency_name"] == "Sampling Techniques"]
    print(f"\n6. [IMMUTABLE HISTORY AUDIT]: {len(sampling_history)} historical measurements found for Sampling Techniques:")
    scores_chronological = [h["score"] for h in reversed(sampling_history)]
    print(f"   Trajectory: {' -> '.join(f'{s}%' for s in scores_chronological)}")
    assert scores_chronological == [48.0, 56.0, 64.0, 72.0]

    # 7. Verify Ranked Deficit Gaps (/api/competencies/me/gaps)
    gaps_res = client.get("/api/competencies/me/gaps", headers=headers).json()
    print("\n7. [RANKED DEFICIT GAPS]:")
    for g in gaps_res[:3]:
        print(f"   - {g['competency_name']}: Score={g['current_score']} | Target={g['target_score']}% | Gap={g['gap']}% | Priority={g['priority_weight']}x | Action='{g['recommended_action']}'")
    assert len(gaps_res) > 0

    # 8. Verify Overall Readiness & Insights (/api/competencies/me/insights)
    insights_res = client.get("/api/competencies/me/insights", headers=headers).json()
    print("\n8. [DETERMINISTIC READINESS & INSIGHTS]:")
    print(f"   - Overall Weighted Readiness: {insights_res['overall_readiness']}%")
    print(f"   - Total Assessments Taken: {insights_res['total_assessments_taken']}")
    print(f"   - Total Improvement Points Gained: +{insights_res['total_improvement_points']} pts")
    print(f"   - Strongest Verified Capability: {insights_res['strongest_competency']}")
    print(f"   - Priority Bottleneck Gap: {insights_res['priority_bottleneck_gap']}")
    print(f"   - Summary: {insights_res['diagnostic_summary']}")
    assert insights_res["overall_readiness"] > 0
    assert insights_res["total_improvement_points"] >= 24.0

    # 9. Verify Live Dashboard (/api/dashboard/learner)
    dash_res = client.get("/api/dashboard/learner", headers=headers).json()
    print(f"\n9. [DYNAMIC DASHBOARD VERIFIED]: Overall Score={dash_res['overall_score']}%, Delta=+{dash_res['score_delta']}")
    assert dash_res["overall_score"] == insights_res["overall_readiness"]
    assert dash_res["score_delta"] == insights_res["total_improvement_points"]

    db.close()
    print("\n============================================================")
    print("   ALL PHASE 5 CONTINUOUS EVALUATION TESTS PASSED 100%!     ")
    print("============================================================")

if __name__ == "__main__":
    run_tests()
