import sys
import os
import io
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Setup backend paths
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.chdir(str(backend_dir))

from main import app
from database import SessionLocal
from models.user import User
from models.material import LearningMaterial, MaterialQuizQuestionSet, MaterialQuizQuestion, MaterialQuizOption
from models.assessment import Assessment
from auth.security import create_access_token
from ai.service import AIService
from config import settings

class TestMaterialQuizRegression(unittest.TestCase):
    """
    Comprehensive regression test suite for Material MCQ Generation:
    - Normalization of schema quirks (multi-correct booleans, type aliases, difficulty aliases)
    - Real AI generation on arbitrary uploaded notes (Mixed Mode 10 questions)
    - Dynamic grounding across all formats (SHORT_MCQ, WORD_PROBLEM, CASE_STUDY, MIXED) and counts (10, 15, 20)
    - Full end-to-end adaptive progression with zero leakage
    """

    @classmethod
    def setUpClass(cls):
        cls.orig_provider = settings.AI_PROVIDER
        cls.client = TestClient(app)
        cls.db: Session = SessionLocal()

        cls.learner = cls.db.query(User).filter(User.role == "learner").first()
        if not cls.learner:
            cls.learner = User(
                email="quiz_regression_learner@smartlearn.gov.in",
                hashed_password="hashed_test_pass",
                full_name="Quiz Regression Learner",
                role="learner",
                is_active=True
            )
            cls.db.add(cls.learner)
            cls.db.commit()
            cls.db.refresh(cls.learner)

        cls.token = create_access_token(data={"sub": cls.learner.email, "role": cls.learner.role, "user_id": cls.learner.id})
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

        # Upload realistic study notes on database architecture
        note_content = (
            "Relational Database Architecture and Indexing Guidelines.\n\n"
            "A Relational Database Management System (RDBMS) organizes structured data into tables consisting of rows and columns.\n"
            "The PRIMARY KEY uniquely identifies each record in a relational table, enforcing entity integrity.\n"
            "A FOREIGN KEY creates a referential link between columns in two tables, enforcing referential integrity.\n"
            "B-Tree Indexes accelerate query lookups by maintaining a balanced search tree over indexed column attributes.\n"
            "The EXPLAIN statement enables database engineers to inspect the execution plan and scan strategies chosen by the query optimizer.\n"
            "Transaction ACID properties guarantee Atomicity, Consistency, Isolation, and Durability across concurrent transactions.\n"
            "Normalization reduces data redundancy through sequential normal forms: 1NF, 2NF, 3NF, and BCNF.\n"
            "Denormalization selectively introduces redundancy to optimize read-heavy analytical query workloads."
        )

        upload_res = cls.client.post(
            "/api/materials/upload",
            headers=cls.headers,
            data={
                "title": "Database Architecture & Optimization Guide",
                "material_scope": "OTHER_LEARNING"
            },
            files={"file": ("db_architecture.txt", io.BytesIO(note_content.encode("utf-8")), "text/plain")}
        )
        assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
        cls.uploaded_material_id = upload_res.json()["id"]

    @classmethod
    def tearDownClass(cls):
        settings.AI_PROVIDER = cls.orig_provider
        cls.db.close()

    def test_01_question_normalization_unit_tests(self):
        """Test AIService._normalize_question_data handles real-world LLM output quirks."""
        ai = AIService()

        # 1. Multiple is_correct=True reconciled by correct_answer text
        raw_multi_correct = {
            "question_text": "What is the primary function of a database PRIMARY KEY constraint?",
            "question_type": "short mcq",  # alias
            "difficulty": "Level 1",        # alias
            "cognitive_level": "knowledge",  # alias
            "options": [
                {"text": "Uniquely identifies each record in a relational table", "is_correct": True},
                {"text": "Allows duplicate values across all rows", "is_correct": True}, # LLM bug: marked true
                {"text": "Deletes the table when dropped", "is_correct": False},
                {"text": "Encrypts the disk storage partition", "is_correct": False}
            ],
            "correct_answer": "Uniquely identifies each record in a relational table",
            "explanation": "Primary keys enforce unique identification for every tuple in a relation.",
            "concept": "Primary Keys"
        }
        norm = ai._normalize_question_data(raw_multi_correct)
        self.assertIsNotNone(norm)
        self.assertEqual(norm["question_type"], "SHORT_MCQ")
        self.assertEqual(norm["difficulty"], "1")
        self.assertEqual(norm["cognitive_level"], "understand")
        self.assertEqual(len(norm["options"]), 4)
        
        # Verify exactly one option is marked is_correct=True
        correct_opts = [o for o in norm["options"] if o["is_correct"]]
        self.assertEqual(len(correct_opts), 1)
        self.assertEqual(correct_opts[0]["text"], "Uniquely identifies each record in a relational table")
        self.assertEqual(norm["correct_answer"], "Uniquely identifies each record in a relational table")

        # 2. Case study and word problem type alias normalization
        raw_cs = {
            "question_text": "Case Study Scenario: An e-commerce platform experiences severe locking contention during flash sales.",
            "question_type": "scenario_case",
            "difficulty": "hard",
            "cognitive_level": "analysis",
            "options": [
                {"text": "Implement row-level locking with read-committed isolation", "is_correct": True},
                {"text": "Disable the database engine", "is_correct": False},
                {"text": "Force full table locks on all queries", "is_correct": False},
                {"text": "Remove all indexes from the schema", "is_correct": False}
            ],
            "correct_answer": "Implement row-level locking with read-committed isolation",
            "explanation": "Row level locking prevents transactions from blocking unaffected rows."
        }
        norm_cs = ai._normalize_question_data(raw_cs)
        self.assertIsNotNone(norm_cs)
        self.assertEqual(norm_cs["question_type"], "CASE_STUDY")
        self.assertEqual(norm_cs["difficulty"], "3")
        self.assertEqual(norm_cs["cognitive_level"], "analyze")

    def test_02_mixed_mode_10_questions_start_api(self):
        """Test starting a 10-question Mixed Mode material quiz on uploaded notes."""
        res = self.client.post(
            f"/api/materials/{self.uploaded_material_id}/quiz/start",
            json={"question_count": 10, "question_type": "MIXED"},
            headers=self.headers
        )
        self.assertEqual(res.status_code, 200, f"Failed: {res.text}")
        data = res.json()

        self.assertIn("assessment_id", data)
        self.assertEqual(data["assessment_type"], "material_quiz")
        self.assertEqual(data["total_questions"], 10)
        self.assertEqual(len(data["questions"]), 1)

        first_q = data["questions"][0]
        self.assertGreaterEqual(len(first_q["options"]), 4)

        # Zero leakage check
        self.assertNotIn("is_correct", first_q)
        self.assertNotIn("correct_answer", first_q)
        self.assertNotIn("explanation", first_q)
        for opt in first_q["options"]:
            self.assertNotIn("is_correct", opt)
            self.assertIn("id", opt)
            self.assertIn("text", opt)

    def test_03_all_formats_and_counts_support(self):
        """Test starting quizzes with SHORT_MCQ, WORD_PROBLEM, CASE_STUDY, and MIXED across 10, 15, 20 counts."""
        settings.AI_PROVIDER = "mock"
        try:
            for q_type in ["SHORT_MCQ", "WORD_PROBLEM", "CASE_STUDY", "MIXED"]:
                for count in [10, 15, 20]:
                    res = self.client.post(
                        f"/api/materials/{self.uploaded_material_id}/quiz/start",
                        json={"question_count": count, "question_type": q_type},
                        headers=self.headers
                    )
                    self.assertEqual(res.status_code, 200, f"Failed for format {q_type} count {count}: {res.text}")
                    data = res.json()
                    self.assertEqual(data["total_questions"], count)
                    self.assertEqual(len(data["questions"]), 1)
        finally:
            settings.AI_PROVIDER = self.orig_provider

    def test_04_full_adaptive_progression_completion(self):
        """Test taking a complete 10-question material quiz through adaptive next and verifying results."""
        settings.AI_PROVIDER = "mock"
        try:
            start_res = self.client.post(
                f"/api/materials/{self.uploaded_material_id}/quiz/start",
                json={"question_count": 10, "question_type": "MIXED"},
                headers=self.headers
            )
            self.assertEqual(start_res.status_code, 200)
            start_data = start_res.json()
            assessment_id = start_data["assessment_id"]
            current_q = start_data["questions"][0]

            # Step through 10 questions
            for step in range(1, 11):
                chosen_opt_id = current_q["options"][0]["id"]
                step_res = self.client.post(
                    f"/api/assessments/{assessment_id}/adaptive-next",
                    json={
                        "question_id": current_q["id"],
                        "selected_option_id": chosen_opt_id,
                        "confidence_level": 3,
                        "time_taken_seconds": 10
                    },
                    headers=self.headers
                )
                self.assertEqual(step_res.status_code, 200, f"Step {step} failed: {step_res.text}")
                step_data = step_res.json()

                if step < 10:
                    self.assertFalse(step_data["is_completed"])
                    self.assertIsNotNone(step_data["next_question"])
                    current_q = step_data["next_question"]
                else:
                    self.assertTrue(step_data["is_completed"])
                    self.assertIsNotNone(step_data["result"])
                    res_obj = step_data["result"]
                    self.assertEqual(res_obj["total_questions"], 10)
                    self.assertEqual(len(res_obj["responses"]), 10)
        finally:
            settings.AI_PROVIDER = self.orig_provider

if __name__ == "__main__":
    unittest.main()
