import os
import sys
import unittest
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.abspath("d:/Affan/Hackathons/SIH/SmartLearn/backend"))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from main import app
from database import get_db, engine
from models.user import User
from models.assessment import Question, QuestionOption, QuestionReviewHistory
from models.competency import Competency, CompetencyTopic
from auth.security import create_access_token
from services.assessment_service import select_questions

client = TestClient(app)

class TestPhase2Governance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Open db session
        cls.db: Session = next(get_db())
        
        # Find an admin and a learner user
        cls.admin_user = cls.db.query(User).filter(User.role == "admin").first()
        if not cls.admin_user:
            cls.admin_user = User(
                email="admin_test@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Admin Officer",
                role="admin"
            )
            cls.db.add(cls.admin_user)
            cls.db.commit()
            cls.db.refresh(cls.admin_user)

        cls.learner_user = cls.db.query(User).filter(User.role == "learner").first()
        if not cls.learner_user:
            cls.learner_user = User(
                email="learner_test@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Learner Officer",
                role="learner"
            )
            cls.db.add(cls.learner_user)
            cls.db.commit()
            cls.db.refresh(cls.learner_user)

        cls.admin_token = create_access_token({"sub": cls.admin_user.email, "role": "admin"})
        cls.learner_token = create_access_token({"sub": cls.learner_user.email, "role": "learner"})
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}
        cls.learner_headers = {"Authorization": f"Bearer {cls.learner_token}"}

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_learner_authorization_denied(self):
        """Learner token must receive 403 Forbidden on admin governance routes."""
        # 1. Stats
        res = client.get("/api/questions/stats", headers=self.learner_headers)
        self.assertEqual(res.status_code, 403, "Learner should be blocked from GET /api/questions/stats")

        # 2. List
        res = client.get("/api/questions/", headers=self.learner_headers)
        self.assertEqual(res.status_code, 403, "Learner should be blocked from GET /api/questions/")

        # 3. Edit Question #141
        res = client.put("/api/questions/141", json={"text": "Hacked"}, headers=self.learner_headers)
        self.assertEqual(res.status_code, 403, "Learner should be blocked from PUT /api/questions/{id}")

        # 4. Status Update
        res = client.patch("/api/questions/141/status", json={"status": "approved"}, headers=self.learner_headers)
        self.assertEqual(res.status_code, 403, "Learner should be blocked from PATCH /api/questions/{id}/status")

    def test_02_admin_get_stats_realtime(self):
        """Admin can get dynamic database statistics."""
        res = client.get("/api/questions/stats", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total", data)
        self.assertIn("pending_review", data)
        self.assertIn("approved", data)
        self.assertIn("rejected", data)
        self.assertIn("by_type", data)
        self.assertIn("by_difficulty", data)
        self.assertIn("by_source", data)
        self.assertGreaterEqual(data["total"], 220)

    def test_03_filtering_and_search(self):
        """Admin can filter by status, type, difficulty, source, and search."""
        # Filter by status = pending_review
        res = client.get("/api/questions/?status=pending_review", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        pending_list = res.json()
        self.assertTrue(all(q["status"] == "pending_review" for q in pending_list))

        # Filter by question_type = CASE_STUDY
        res = client.get("/api/questions/?question_type=CASE_STUDY", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        case_list = res.json()
        self.assertTrue(all(q["question_type"] == "CASE_STUDY" for q in case_list))

        # Search by Bank ID 'SM-001'
        res = client.get("/api/questions/?search=SM-001", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        results = res.json()
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["bank_question_id"], "SM-001")

    def test_04_edit_validation(self):
        """PUT /api/questions/{id} validates 4 options and single correct answer."""
        target_q = self.db.query(Question).filter(Question.bank_question_id == "SM-001").first()
        self.assertIsNotNone(target_q)

        # Invalid: Only 2 options
        payload_bad = {
            "text": "Valid prompt text?",
            "options": [
                {"option_text": "A", "is_correct": True},
                {"option_text": "B", "is_correct": False}
            ]
        }
        res = client.put(f"/api/questions/{target_q.id}", json=payload_bad, headers=self.admin_headers)
        self.assertEqual(res.status_code, 422)

        # Invalid: 4 options but 2 correct
        payload_bad2 = {
            "text": "Valid prompt text?",
            "options": [
                {"option_text": "A", "is_correct": True},
                {"option_text": "B", "is_correct": True},
                {"option_text": "C", "is_correct": False},
                {"option_text": "D", "is_correct": False}
            ]
        }
        res = client.put(f"/api/questions/{target_q.id}", json=payload_bad2, headers=self.admin_headers)
        self.assertEqual(res.status_code, 422)

        # Invalid: Invalid difficulty
        payload_bad3 = {
            "difficulty": "super_hard"
        }
        res = client.put(f"/api/questions/{target_q.id}", json=payload_bad3, headers=self.admin_headers)
        self.assertEqual(res.status_code, 422)

    def test_05_edit_and_audit_log(self):
        """Admin editing creates an EDIT audit record without changing pending status."""
        target_q = self.db.query(Question).filter(Question.bank_question_id == "SM-002").first()
        self.assertIsNotNone(target_q)
        initial_status = target_q.status

        payload = {
            "question_text": target_q.text + " (Calibrated by Admin)",
            "explanation": "Updated statistical rationale.",
            "difficulty": "2",
            "question_type": "SHORT_MCQ",
            "comment": "Minor phrasing enhancement",
            "options": [
                {"id": target_q.options[0].id, "option_text": target_q.options[0].text, "is_correct": target_q.options[0].is_correct},
                {"id": target_q.options[1].id, "option_text": target_q.options[1].text, "is_correct": target_q.options[1].is_correct},
                {"id": target_q.options[2].id, "option_text": target_q.options[2].text, "is_correct": target_q.options[2].is_correct},
                {"id": target_q.options[3].id, "option_text": target_q.options[3].text, "is_correct": target_q.options[3].is_correct}
            ]
        }
        res = client.put(f"/api/questions/{target_q.id}", json=payload, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], initial_status, "Status should remain pending after edit")
        
        # Verify review_history has EDIT action
        history = data.get("review_history", [])
        self.assertTrue(any(h["action"] == "EDIT" and h["comment"] == "Minor phrasing enhancement" for h in history))

    def test_06_reject_with_reason(self):
        """Admin can reject candidate question with optional reason comment."""
        target_q = self.db.query(Question).filter(Question.bank_question_id == "SM-003").first()
        self.assertIsNotNone(target_q)

        payload = {
            "status": "rejected",
            "comment": "Ambiguous wording in distractor C"
        }
        res = client.patch(f"/api/questions/{target_q.id}/status", json=payload, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "rejected")
        
        # Check review_history
        history = data.get("review_history", [])
        self.assertTrue(any(h["action"] == "REJECT" and "Ambiguous wording" in h["comment"] for h in history))

    def test_07_approve_workflow(self):
        """Admin can approve question, entering active assessment pool."""
        target_q = self.db.query(Question).filter(Question.bank_question_id == "SM-004").first()
        self.assertIsNotNone(target_q)

        payload = {
            "status": "approved"
        }
        res = client.patch(f"/api/questions/{target_q.id}/status", json=payload, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "approved")

        # Check review_history
        history = data.get("review_history", [])
        self.assertTrue(any(h["action"] == "APPROVE" for h in history))

    def test_08_assessment_pool_excludes_pending_and_rejected(self):
        """Verify only status='approved' questions are selected for official assessments."""
        comp = self.db.query(Competency).first()
        selected = select_questions(self.db, user=self.learner_user, competency_ids=[comp.id], question_count=10)
        self.assertGreater(len(selected), 0)
        for q in selected:
            self.assertEqual(q.status, "approved", f"Selected question #{q.id} has non-approved status: {q.status}")

    def test_09_database_integrity_preserved(self):
        """Verify all 80 bank questions and pre-existing questions remain intact."""
        total_count = self.db.query(Question).count()
        self.assertGreaterEqual(total_count, 220, f"Expected at least 220 total questions, got {total_count}")

        bank_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        self.assertEqual(bank_count, 80, f"Expected 80 bank questions, got {bank_count}")

        # Check options on all 80 bank questions: 4 options each, exactly 1 correct
        bank_questions = self.db.query(Question).filter(Question.bank_question_id.isnot(None)).all()
        for q in bank_questions:
            self.assertEqual(len(q.options), 4, f"Question #{q.id} does not have 4 options")
            correct_opts = [opt for opt in q.options if opt.is_correct]
            self.assertEqual(len(correct_opts), 1, f"Question #{q.id} does not have exactly 1 correct option")

        # Verify type breakdown for 80 bank questions: 24 SHORT_MCQ, 24 WORD_PROBLEM, 32 CASE_STUDY
        short_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None), Question.question_type == "SHORT_MCQ").count()
        word_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None), Question.question_type == "WORD_PROBLEM").count()
        case_count = self.db.query(Question).filter(Question.bank_question_id.isnot(None), Question.question_type == "CASE_STUDY").count()
        self.assertEqual(short_count, 24)
        self.assertEqual(word_count, 24)
        self.assertEqual(case_count, 32)

if __name__ == "__main__":
    unittest.main()
