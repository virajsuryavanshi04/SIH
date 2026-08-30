import os
import sys
import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

# Adjust path to import backend modules
backend_dir = r"d:\Affan\Hackathons\SIH\SmartLearn\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database import SessionLocal
from models.user import User
from models.competency import Competency
from models.material import LearningMaterial, MaterialQuizQuestionSet, MaterialQuizQuestion, MaterialQuizOption
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer
from auth.security import create_access_token
from ai.service import AIService

class TestPhase5CMaterialQuiz(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from config import settings
        cls.orig_provider = settings.AI_PROVIDER
        settings.AI_PROVIDER = "mock"

        cls.client = TestClient(app)
        cls.db: Session = SessionLocal()

        # Retrieve learners and admin
        cls.learner_a = cls.db.query(User).filter(User.email == "learner@smartlearn.gov.in").first()
        if not cls.learner_a:
            cls.learner_a = cls.db.query(User).filter(User.role == "learner").first()
        
        # Second learner for access control tests
        cls.learner_b = cls.db.query(User).filter(User.id != cls.learner_a.id, User.role == "learner").first()
        if not cls.learner_b:
            cls.learner_b = User(
                email="learner_b_phase5c@smartlearn.gov.in",
                hashed_password="hashed_test_pass",
                full_name="Learner B Test",
                role="learner",
                is_active=True
            )
            cls.db.add(cls.learner_b)
            cls.db.commit()
            cls.db.refresh(cls.learner_b)

        cls.token_a = create_access_token(data={"sub": cls.learner_a.email, "role": cls.learner_a.role, "user_id": cls.learner_a.id})
        cls.headers_a = {"Authorization": f"Bearer {cls.token_a}"}

        cls.token_b = create_access_token(data={"sub": cls.learner_b.email, "role": cls.learner_b.role, "user_id": cls.learner_b.id})
        cls.headers_b = {"Authorization": f"Bearer {cls.token_b}"}

        # Setup test material for Learner A
        cls.test_material = LearningMaterial(
            title="Phase 5C Official Sampling Handbook",
            filename="sampling_handbook_5c.pdf",
            original_filename="sampling_handbook_5c.pdf",
            file_type="pdf",
            file_size=102400,
            storage_path="uploads/sampling_handbook_5c.pdf",
            uploaded_by=cls.learner_a.id,
            processing_status="completed",
            material_scope="OFFICIAL_COMPETENCY",
            competency_id=1,
            extracted_text="""Official Sampling and Survey Methodology Handbook.
Stratified Sampling: Partitions a heterogeneous population into homogeneous non-overlapping strata.
Neyman Optimal Allocation minimizes estimator variance by allocating sample sizes proportional to stratum size multiplied by stratum standard deviation.
Cluster Sampling: Groups population into primary sampling units. Intra-cluster correlation (roh) increases the design effect (Deff > 1).
Quality Assurance: Field auditing, non-response weight adjustment, and dual-stage verification maintain standard survey accuracy."""
        )
        cls.db.add(cls.test_material)
        cls.db.commit()
        cls.db.refresh(cls.test_material)

        # Setup OTHER_LEARNING material (no competency)
        cls.other_material = LearningMaterial(
            title="TCP vs UDP Network Telemetry Guide",
            filename="tcp_udp_guide.txt",
            original_filename="tcp_udp_guide.txt",
            file_type="txt",
            file_size=45000,
            storage_path="uploads/tcp_udp_guide.txt",
            uploaded_by=cls.learner_a.id,
            processing_status="completed",
            material_scope="OTHER_LEARNING",
            competency_id=None,
            topic_id=None,
            extracted_text="""Transport Layer Networking Guide: TCP and UDP Protocols.
TCP (Transmission Control Protocol) is a connection-oriented, reliable transport protocol that uses sequence numbers, acknowledgments, and flow control.
UDP (User Datagram Protocol) is a connectionless transport protocol prioritized for low latency and minimal overhead where dropped packets are acceptable.
Case studies demonstrate TCP for distributed database synchronization and UDP for real-time telemetry streaming."""
        )
        cls.db.add(cls.other_material)
        cls.db.commit()
        cls.db.refresh(cls.other_material)

    @classmethod
    def tearDownClass(cls):
        from config import settings
        settings.AI_PROVIDER = cls.orig_provider
        cls.db.close()

    def test_01_readiness_and_parameter_validation(self):
        """Test material readiness check and 10/15/20 count and question type validation."""
        # 1. Non-ready material rejection
        unready_mat = LearningMaterial(
            title="Unprocessed Draft",
            filename="unprocessed.pdf",
            original_filename="unprocessed.pdf",
            file_type="pdf",
            file_size=5000,
            storage_path="uploads/unprocessed.pdf",
            uploaded_by=self.learner_a.id,
            processing_status="uploaded",  # Not completed
            material_scope="OTHER_LEARNING",
            extracted_text=""
        )
        self.db.add(unready_mat)
        self.db.commit()
        self.db.refresh(unready_mat)

        res_unready = self.client.post(
            f"/api/materials/{unready_mat.id}/quiz/start",
            json={"question_count": 10, "question_type": "MIXED"},
            headers=self.headers_a
        )
        self.assertEqual(res_unready.status_code, 400)
        self.assertIn("not ready", res_unready.json()["detail"].lower())

        # 2. Invalid question counts (e.g. 5, 12, 30) -> HTTP 422
        for invalid_count in [5, 12, 30]:
            res_inv_count = self.client.post(
                f"/api/materials/{self.test_material.id}/quiz/start",
                json={"question_count": invalid_count, "question_type": "MIXED"},
                headers=self.headers_a
            )
            self.assertEqual(res_inv_count.status_code, 422)

        # 3. Invalid question type -> HTTP 422
        res_inv_type = self.client.post(
            f"/api/materials/{self.test_material.id}/quiz/start",
            json={"question_count": 10, "question_type": "INVALID_TYPE"},
            headers=self.headers_a
        )
        self.assertEqual(res_inv_type.status_code, 422)

    def test_02_material_quiz_start_and_zero_leakage(self):
        """Test starting a 10-question material quiz with no correct answer or solution leakage."""
        res = self.client.post(
            f"/api/materials/{self.test_material.id}/quiz/start",
            json={"question_count": 10, "question_type": "MIXED"},
            headers=self.headers_a
        )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()

        self.assertIn("assessment_id", data)
        self.assertEqual(data["assessment_type"], "material_quiz")
        self.assertEqual(data["total_questions"], 10)
        self.assertEqual(len(data["questions"]), 1)

        first_q = data["questions"][0]
        self.assertEqual(len(first_q["options"]), 4)

        # Confirm ZERO correct answer leakage
        self.assertNotIn("is_correct", first_q)
        self.assertNotIn("correct_answer", first_q)
        self.assertNotIn("explanation", first_q)
        for opt in first_q["options"]:
            self.assertNotIn("is_correct", opt)
            self.assertIn("id", opt)
            self.assertIn("text", opt)
            self.assertIn("order", opt)

    def test_03_full_adaptive_progression_10_questions(self):
        """Test full adaptive progression through a 10-question session and final completion."""
        res_start = self.client.post(
            f"/api/materials/{self.test_material.id}/quiz/start",
            json={"question_count": 10, "question_type": "MIXED"},
            headers=self.headers_a
        )
        self.assertEqual(res_start.status_code, 200)
        start_data = res_start.json()
        assessment_id = start_data["assessment_id"]
        current_q = start_data["questions"][0]

        # Step through questions 1 to 10
        for step in range(1, 11):
            selected_opt_id = current_q["options"][0]["id"]
            res_step = self.client.post(
                f"/api/assessments/{assessment_id}/adaptive-next",
                json={
                    "question_id": current_q["id"],
                    "selected_option_id": selected_opt_id,
                    "confidence_level": 3,
                    "time_taken_seconds": 12
                },
                headers=self.headers_a
            )
            self.assertEqual(res_step.status_code, 200, res_step.text)
            step_data = res_step.json()

            if step < 10:
                self.assertFalse(step_data["is_completed"])
                self.assertIsNotNone(step_data["next_question"])
                current_q = step_data["next_question"]
            else:
                self.assertTrue(step_data["is_completed"])
                self.assertIsNotNone(step_data["result"])
                result = step_data["result"]
                self.assertEqual(result["assessment_id"], assessment_id)
                self.assertEqual(result["assessment_type"], "material_quiz")
                self.assertEqual(result["total_questions"], 10)
                self.assertEqual(len(result["responses"]), 10)
                self.assertEqual(result["source_material_title"], self.test_material.title)

    def test_04_other_learning_material_quiz(self):
        """Test material quiz on OTHER_LEARNING material (no competency fabricated)."""
        res_start = self.client.post(
            f"/api/materials/{self.other_material.id}/quiz/start",
            json={"question_count": 10, "question_type": "SHORT_MCQ"},
            headers=self.headers_a
        )
        self.assertEqual(res_start.status_code, 200, res_start.text)
        data = res_start.json()
        self.assertEqual(data["assessment_type"], "material_quiz")
        first_q = data["questions"][0]
        self.assertIsNone(first_q["competency_id"])  # No fabricated competency

    def test_05_question_format_support(self):
        """Test starting quizzes with SHORT_MCQ, WORD_PROBLEM, CASE_STUDY, and MIXED."""
        for q_type in ["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY", "MIXED"]:
            res = self.client.post(
                f"/api/materials/{self.test_material.id}/quiz/start",
                json={"question_count": 10, "question_type": q_type},
                headers=self.headers_a
            )
            self.assertEqual(res.status_code, 200, f"Failed for {q_type}: {res.text}")
            data = res.json()
            self.assertEqual(data["assessment_type"], "material_quiz")
            self.assertEqual(data["total_questions"], 10)

    def test_06_ownership_and_security(self):
        """Test that Learner B cannot start or access Learner A's private material quiz."""
        # Create private OTHER_LEARNING material for Learner A
        private_mat = LearningMaterial(
            title="Learner A Private Notes",
            filename="private_notes.txt",
            original_filename="private_notes.txt",
            file_type="txt",
            file_size=20000,
            storage_path="uploads/private_notes.txt",
            uploaded_by=self.learner_a.id,
            processing_status="completed",
            material_scope="OTHER_LEARNING",
            extracted_text="Private research study notes on distributed databases and indexing."
        )
        self.db.add(private_mat)
        self.db.commit()
        self.db.refresh(private_mat)

        # Learner B attempt to start quiz on Learner A private material -> 403
        res_unauth = self.client.post(
            f"/api/materials/{private_mat.id}/quiz/start",
            json={"question_count": 10, "question_type": "MIXED"},
            headers=self.headers_b
        )
        self.assertEqual(res_unauth.status_code, 403)

    def test_07_question_set_versioning_and_immutability(self):
        """Test that quiz regeneration creates a new version without mutating historical questions."""
        # 1. Start v1 quiz
        res_v1 = self.client.post(
            f"/api/materials/{self.test_material.id}/quiz/start",
            json={"question_count": 10, "question_type": "MIXED"},
            headers=self.headers_a
        )
        self.assertEqual(res_v1.status_code, 200)
        ass_v1_id = res_v1.json()["assessment_id"]

        # Complete v1 session
        ass_v1 = self.db.query(Assessment).filter(Assessment.id == ass_v1_id).first()
        v1_set_id = ass_v1.material_quiz_set_id
        v1_questions_count = self.db.query(MaterialQuizQuestion).filter(MaterialQuizQuestion.set_id == v1_set_id).count()

        # 2. Regenerate / Start v2 quiz
        res_v2 = self.client.post(
            f"/api/materials/{self.test_material.id}/quiz/start",
            json={"question_count": 15, "question_type": "MIXED"},
            headers=self.headers_a
        )
        self.assertEqual(res_v2.status_code, 200)
        ass_v2_id = res_v2.json()["assessment_id"]
        ass_v2 = self.db.query(Assessment).filter(Assessment.id == ass_v2_id).first()
        v2_set_id = ass_v2.material_quiz_set_id

        # Verify new distinct set and version incremented
        self.assertNotEqual(v1_set_id, v2_set_id)
        set_v1 = self.db.query(MaterialQuizQuestionSet).filter(MaterialQuizQuestionSet.id == v1_set_id).first()
        set_v2 = self.db.query(MaterialQuizQuestionSet).filter(MaterialQuizQuestionSet.id == v2_set_id).first()
        self.assertEqual(set_v2.version, set_v1.version + 1)

        # Verify historical v1 questions remain untouched
        v1_questions_after = self.db.query(MaterialQuizQuestion).filter(MaterialQuizQuestion.set_id == v1_set_id).count()
        self.assertEqual(v1_questions_count, v1_questions_after)

    def test_08_structural_and_grounding_validators(self):
        """Test AIService structural and grounding validators directly."""
        ai = AIService()
        
        # Valid questions structure
        valid_qs = [
            {
                "question_text": f"Question scenario number {i} testing sampling variance in stratified surveys",
                "question_type": "SHORT_MCQ" if i <= 4 else ("WORD_PROBLEM" if i <= 7 else "CASE_STUDY"),
                "difficulty": "2",
                "cognitive_level": "apply",
                "options": [
                    {"text": f"Correct Option {i}", "is_correct": True, "order": 1},
                    {"text": f"Distractor A {i}", "is_correct": False, "order": 2},
                    {"text": f"Distractor B {i}", "is_correct": False, "order": 3},
                    {"text": f"Distractor C {i}", "is_correct": False, "order": 4}
                ],
                "correct_answer": f"Correct Option {i}",
                "explanation": f"Grounded explanation for question {i} regarding stratified sampling formulas.",
                "concept": "Sampling"
            }
            for i in range(1, 11)
        ]

        is_valid, msg = ai.validate_material_quiz_questions(valid_qs, 10, "MIXED")
        self.assertTrue(is_valid, msg)

        # Invalid structure: missing option
        invalid_qs = [dict(q) for q in valid_qs]
        invalid_qs[0]["options"] = invalid_qs[0]["options"][:3]  # Only 3 options
        is_invalid, msg = ai.validate_material_quiz_questions(invalid_qs, 10, "MIXED")
        self.assertFalse(is_invalid)

        # Grounding test
        is_grounded, msg = ai.validate_material_quiz_grounding(valid_qs, self.test_material.extracted_text)
        self.assertTrue(is_grounded, msg)

    def test_09_baseline_data_preservation(self):
        """Verify 220+ questions, 80 bank questions, 51+ materials, and Material #49 remain intact."""
        total_questions = self.db.query(Question).count()
        self.assertGreaterEqual(total_questions, 220)

        bank_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        self.assertEqual(bank_count, 80)

        materials_count = self.db.query(LearningMaterial).count()
        self.assertGreaterEqual(materials_count, 51)

        mat_49 = self.db.query(LearningMaterial).filter(LearningMaterial.id == 49).first()
        self.assertIsNotNone(mat_49)
        self.assertEqual(mat_49.material_scope, "OFFICIAL_COMPETENCY")

if __name__ == "__main__":
    unittest.main()
