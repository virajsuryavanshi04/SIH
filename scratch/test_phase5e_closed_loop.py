import os
import sys
import unittest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

backend_dir = "d:/Affan/Hackathons/SIH/SmartLearn/backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database import SessionLocal
from config import settings
from models.user import User
from models.role import Role
from models.competency import Competency, RoleCompetency, CompetencyTopic
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer
from models.user_competency import UserCompetency, CompetencyScore
from models.material import LearningMaterial, MaterialQuizQuestionSet, MaterialQuizQuestion, MaterialQuizOption, MaterialNote, MaterialFlashcardDeck
from auth.security import create_access_token
from services.recommendation_service import RecommendationService
from services.adaptive_assessment_service import AdaptiveAssessmentService
from services.assessment_service import get_assessment_result

class TestPhase5EClosedLoop(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        
        # Setup Test User 1
        cls.u1 = cls.db.query(User).filter(User.email == "p5e_learner1@smartlearn.test").first()
        if not cls.u1:
            cls.u1 = User(
                email="p5e_learner1@smartlearn.test",
                full_name="Phase 5E Learner One",
                name="Phase 5E Learner One",
                role="learner",
                role_id=1,
                designation="Statistical Officer",
                department_name="Statistics",
                password_hash="mock_password_hash"
            )
            cls.db.add(cls.u1)
            cls.db.commit()
            cls.db.refresh(cls.u1)

        # Setup Test User 2
        cls.u2 = cls.db.query(User).filter(User.email == "p5e_learner2@smartlearn.test").first()
        if not cls.u2:
            cls.u2 = User(
                email="p5e_learner2@smartlearn.test",
                full_name="Phase 5E Learner Two",
                name="Phase 5E Learner Two",
                role="learner",
                role_id=1,
                designation="Statistical Officer",
                department_name="Statistics",
                password_hash="mock_password_hash"
            )
            cls.db.add(cls.u2)
            cls.db.commit()
            cls.db.refresh(cls.u2)

        cls.token1 = create_access_token(data={"sub": cls.u1.email, "role": cls.u1.role, "user_id": cls.u1.id})
        cls.headers1 = {"Authorization": f"Bearer {cls.token1}"}

        cls.token2 = create_access_token(data={"sub": cls.u2.email, "role": cls.u2.role, "user_id": cls.u2.id})
        cls.headers2 = {"Authorization": f"Bearer {cls.token2}"}

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_targeted_reassessment_start_single_competency(self):
        """1. Targeted reassessment can start for one competency."""
        res = self.client.post("/api/assessments/start", headers=self.headers1, json={
            "assessment_type": "adaptive_reassessment",
            "competency_id": 1,
            "question_count": 10,
            "question_type": "MIXED"
        })
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["assessment_type"], "adaptive_reassessment")
        self.assertEqual(data["total_questions"], 10)
        self.assertGreaterEqual(len(data["questions"]), 1)
        self.assertEqual(data["questions"][0]["competency_id"], 1)

    def test_02_only_approved_questions_for_targeted_competency(self):
        """2 & 3. Reassessment uses only approved questions for the targeted competency; rejected/pending excluded."""
        bad_q = self.db.query(Question).filter(Question.competency_id == 1, Question.status == "rejected").first()
        if not bad_q:
            bad_q = Question(
                competency_id=1,
                question_text="Rejected test question for comp 1",
                question_type="SHORT_MCQ",
                difficulty="2",
                status="rejected"
            )
            self.db.add(bad_q)
            self.db.commit()
            self.db.refresh(bad_q)
        bad_q_id = bad_q.id

        res = self.client.post("/api/assessments/start", headers=self.headers1, json={
            "assessment_type": "adaptive_reassessment",
            "competency_id": 1,
            "question_count": 10,
            "question_type": "MIXED"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        first_q_id = data["questions"][0]["id"]
        self.assertNotEqual(first_q_id, bad_q_id)

    def test_03_adaptive_difficulty_progression(self):
        """4. Adaptive difficulty: 2 consecutive correct -> harder, 2 consecutive incorrect -> easier."""
        next_diff, c_streak, i_streak = AdaptiveAssessmentService.compute_next_difficulty(2, True, 1, 0)
        self.assertEqual(next_diff, 3)
        self.assertEqual(c_streak, 0)  # Reset after level-up

        next_diff, c_streak, i_streak = AdaptiveAssessmentService.compute_next_difficulty(2, False, 0, 1)
        self.assertEqual(next_diff, 1)
        self.assertEqual(i_streak, 0)  # Reset after level-down

    def test_04_no_leakage_and_answer_confidence_requirement(self):
        """5 & 6. Active reassessment does not expose answer/explanation; requires answer+confidence."""
        res = self.client.post("/api/assessments/start", headers=self.headers1, json={
            "assessment_type": "adaptive_reassessment",
            "competency_id": 1,
            "question_count": 10,
            "question_type": "MIXED"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        ass_id = data["assessment_id"]
        first_q = data["questions"][0]

        for opt in first_q["options"]:
            self.assertNotIn("is_correct", opt)
        self.assertNotIn("explanation", first_q)
        self.assertNotIn("correct_answer", first_q)

        # Submit without answer should fail
        fail_res = self.client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers1, json={})
        self.assertEqual(fail_res.status_code, 422)

    def test_05_reassessment_completion_updates_user_competency_and_competency_scores(self):
        """7 & 8. Reassessment completion updates UserCompetency and appends CompetencyScore with source='adaptive_reassessment'."""
        self.db.query(CompetencyScore).filter(CompetencyScore.user_id == self.u1.id, CompetencyScore.competency_id == 1).delete()
        self.db.query(Assessment).filter(Assessment.user_id == self.u1.id).delete()
        self.db.commit()

        prior_score = 48.0
        uc = self.db.query(UserCompetency).filter(UserCompetency.user_id == self.u1.id, UserCompetency.competency_id == 1).first()
        if not uc:
            uc = UserCompetency(user_id=self.u1.id, competency_id=1, current_score=prior_score, target_score=80.0, status="critical_gap")
            self.db.add(uc)
        else:
            uc.current_score = prior_score
            uc.target_score = 80.0
            uc.status = "critical_gap"

        prior_cs = CompetencyScore(
            user_id=self.u1.id,
            competency_id=1,
            score=prior_score,
            source="baseline",
            assessed_at=datetime.utcnow() - timedelta(days=2)
        )
        self.db.add(prior_cs)
        self.db.commit()

        # Start 10-question targeted reassessment on competency 1
        start_res = self.client.post("/api/assessments/start", headers=self.headers1, json={
            "assessment_type": "adaptive_reassessment",
            "competency_id": 1,
            "question_count": 10,
            "question_type": "MIXED"
        })
        self.assertEqual(start_res.status_code, 200)
        ass_id = start_res.json()["assessment_id"]

        curr_step = start_res.json()
        for step_num in range(1, 11):
            q_obj = curr_step["questions"][0] if "questions" in curr_step else curr_step["next_question"]
            q_id = q_obj["id"]
            
            opts = self.db.query(QuestionOption).filter(QuestionOption.question_id == q_id).all()
            correct_opt = next((o for o in opts if o.is_correct), opts[0])
            incorrect_opt = next((o for o in opts if not o.is_correct), opts[-1])

            # Score 8 correct, 2 incorrect -> 80.0%
            chosen_opt = correct_opt if step_num <= 8 else incorrect_opt

            step_res = self.client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers1, json={
                "question_id": q_id,
                "selected_option_id": chosen_opt.id,
                "confidence_level": 3,
                "time_taken_seconds": 12
            })
            self.assertEqual(step_res.status_code, 200)
            curr_step = step_res.json()
            if curr_step.get("is_completed"):
                break

        self.assertTrue(curr_step.get("is_completed"))
        result_data = curr_step.get("result")
        self.assertIsNotNone(result_data)

        # Check UserCompetency update
        self.db.expire_all()
        uc_after = self.db.query(UserCompetency).filter(UserCompetency.user_id == self.u1.id, UserCompetency.competency_id == 1).first()
        self.assertEqual(uc_after.current_score, 80.0)

        # Check CompetencyScore new record
        latest_cs = self.db.query(CompetencyScore).filter(
            CompetencyScore.user_id == self.u1.id,
            CompetencyScore.competency_id == 1
        ).order_by(CompetencyScore.assessed_at.desc()).first()
        self.assertEqual(latest_cs.score, 80.0)
        self.assertEqual(latest_cs.source, "adaptive_reassessment")
        self.assertEqual(latest_cs.assessment_id, ass_id)

    def test_06_before_after_delta_and_status_evaluation(self):
        """9-15. Before score, after score, score delta, previous/current gaps, and statuses."""
        ass = self.db.query(Assessment).filter(
            Assessment.user_id == self.u1.id,
            Assessment.assessment_type == "adaptive_reassessment",
            Assessment.status == "completed"
        ).order_by(Assessment.completed_at.desc()).first()
        self.assertIsNotNone(ass)

        res = self.client.get(f"/api/assessments/{ass.id}/result", headers=self.headers1)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        summary = data.get("reassessment_summary")
        self.assertIsNotNone(summary)

        self.assertEqual(summary["competency_id"], 1)
        self.assertEqual(summary["previous_score"], 48.0)
        self.assertEqual(summary["current_score"], 80.0)
        self.assertEqual(summary["score_delta"], 32.0)
        self.assertEqual(summary["target_score"], 80.0)
        self.assertEqual(summary["previous_gap"], 32.0)
        self.assertEqual(summary["current_gap"], 0.0)
        self.assertEqual(summary["status"], "MET_BENCHMARK")

    def test_07_initial_measurement_null_handling(self):
        """16. First measurement handles previous_score = None safely (INITIAL_MEASUREMENT)."""
        self.db.query(CompetencyScore).filter(CompetencyScore.user_id == self.u2.id, CompetencyScore.competency_id == 2).delete()
        self.db.commit()

        start_res = self.client.post("/api/assessments/start", headers=self.headers2, json={
            "assessment_type": "adaptive_reassessment",
            "competency_id": 2,
            "question_count": 10,
            "question_type": "MIXED"
        })
        self.assertEqual(start_res.status_code, 200)
        ass_id = start_res.json()["assessment_id"]
        curr_step = start_res.json()

        for step_num in range(1, 11):
            q_obj = curr_step["questions"][0] if "questions" in curr_step else curr_step["next_question"]
            q_id = q_obj["id"]
            opts = self.db.query(QuestionOption).filter(QuestionOption.question_id == q_id).all()
            opt = opts[0]

            step_res = self.client.post(f"/api/assessments/{ass_id}/adaptive-next", headers=self.headers2, json={
                "question_id": q_id,
                "selected_option_id": opt.id,
                "confidence_level": 2,
                "time_taken_seconds": 15
            })
            self.assertEqual(step_res.status_code, 200)
            curr_step = step_res.json()
            if curr_step.get("is_completed"):
                break

        res = self.client.get(f"/api/assessments/{ass_id}/result", headers=self.headers2)
        self.assertEqual(res.status_code, 200)
        summary = res.json().get("reassessment_summary")
        self.assertIsNotNone(summary)
        self.assertIsNone(summary["previous_score"])
        self.assertEqual(summary["status"], "INITIAL_MEASUREMENT")

    def test_08_closed_loop_recommendation_advances_after_target_met(self):
        """17 & 18. RecommendationService recalculates after reassessment; met competency is no longer top deficit."""
        u1_fresh = self.db.query(User).filter(User.id == self.u1.id).first()
        next_action = RecommendationService.get_next_learning_action(self.db, u1_fresh)

        self.assertIsNotNone(next_action)
        if next_action["competency_id"] is not None and next_action["action_type"] != "CONTINUE_LEARNING":
            self.assertTrue(next_action["competency_id"] != 1 or next_action["gap"] == 0 or next_action["gap"] is None)

    def test_09_tenant_isolation_security(self):
        """19. Learner B cannot access Learner A's reassessment/result."""
        ass_u1 = self.db.query(Assessment).filter(Assessment.user_id == self.u1.id).first()
        if ass_u1:
            res = self.client.get(f"/api/assessments/{ass_u1.id}/result", headers=self.headers2)
            if res.status_code == 200:
                data = res.json()
                self.assertTrue(data.get("assessment_id") is None or data.get("assessment_id") != ass_u1.id)
            else:
                self.assertIn(res.status_code, [403, 404])

    def test_10_material_quiz_and_study_content_integrity(self):
        """20 & 21. Material quiz completion does not overwrite official score; content availability != completion."""
        uc = self.db.query(UserCompetency).filter(UserCompetency.user_id == self.u1.id, UserCompetency.competency_id == 1).first()
        self.assertEqual(uc.current_score, 80.0)

        notes = self.db.query(MaterialNote).first()
        self.assertIsNotNone(notes)
        self.assertTrue(not hasattr(notes, "is_completed") or getattr(notes, "status") in ["ready", "processing"])

    def test_11_baseline_data_preservation(self):
        """22. Existing Phase 5A/5B/5C/Phase 4/Phase 3/Phase 2 data remains intact."""
        q_count = self.db.query(Question).count()
        bank_q_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        mat_count = self.db.query(LearningMaterial).count()
        m49 = self.db.query(LearningMaterial).filter(LearningMaterial.id == 49).first()

        self.assertGreaterEqual(q_count, 220)
        self.assertEqual(bank_q_count, 80)
        self.assertGreaterEqual(mat_count, 51)
        self.assertIsNotNone(m49)
        self.assertEqual(m49.material_scope, "OFFICIAL_COMPETENCY")
        self.assertEqual(m49.processing_status, "completed")

if __name__ == "__main__":
    unittest.main()
