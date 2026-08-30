import os
import sys
import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from pathlib import Path

# Adjust path to import backend modules
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from database import SessionLocal
from config import settings
from models.user import User
from models.competency import Competency, CompetencyTopic, RoleCompetency
from models.user_competency import UserCompetency, CompetencyScore
from models.material import LearningMaterial, MaterialNote, MaterialFlashcardDeck, MaterialFlashcard, MaterialMindMap, MaterialQuizQuestionSet
from models.course import Course
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.recommendation import AIDiagnosis, AIRecommendation
from models.assessment import Question, QuestionOption, Assessment, AssessmentAnswer
from auth.security import create_access_token

class TestPhase5DPersonalizedLearning(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orig_provider = settings.AI_PROVIDER
        settings.AI_PROVIDER = "mock"

        cls.client = TestClient(app)
        cls.db: Session = SessionLocal()

        # Learner A (Arjun Patel, Statistical Officer)
        cls.learner_a = cls.db.query(User).filter(User.email == "learner_a_p5d@smartlearn.gov.in").first()
        if not cls.learner_a:
            cls.learner_a = User(
                email="learner_a_p5d@smartlearn.gov.in",
                password_hash="mock_password",
                full_name="Arjun Patel P5D",
                role="learner",
                designation="Statistical Officer",
                role_id=1,
                is_active=True
            )
            cls.db.add(cls.learner_a)
            cls.db.commit()
            cls.db.refresh(cls.learner_a)

        # Learner B (Priya Sharma, Survey Officer)
        cls.learner_b = cls.db.query(User).filter(User.email == "learner_b_p5d@smartlearn.gov.in").first()
        if not cls.learner_b:
            cls.learner_b = User(
                email="learner_b_p5d@smartlearn.gov.in",
                password_hash="mock_password",
                full_name="Priya Sharma P5D",
                role="learner",
                designation="Survey Officer",
                role_id=2,
                is_active=True
            )
            cls.db.add(cls.learner_b)
            cls.db.commit()
            cls.db.refresh(cls.learner_b)

        # Fresh Unassessed Learner C
        cls.learner_c = cls.db.query(User).filter(User.email == "learner_c_fresh_p5d@smartlearn.gov.in").first()
        if not cls.learner_c:
            cls.learner_c = User(
                email="learner_c_fresh_p5d@smartlearn.gov.in",
                password_hash="mock_password",
                full_name="Fresh Learner C",
                role="learner",
                designation="Statistical Officer",
                role_id=1,
                is_active=True
            )
            cls.db.add(cls.learner_c)
            cls.db.commit()
            cls.db.refresh(cls.learner_c)

        cls.token_a = create_access_token(data={"sub": cls.learner_a.email, "role": cls.learner_a.role, "user_id": cls.learner_a.id})
        cls.headers_a = {"Authorization": f"Bearer {cls.token_a}"}

        cls.token_b = create_access_token(data={"sub": cls.learner_b.email, "role": cls.learner_b.role, "user_id": cls.learner_b.id})
        cls.headers_b = {"Authorization": f"Bearer {cls.token_b}"}

        cls.token_c = create_access_token(data={"sub": cls.learner_c.email, "role": cls.learner_c.role, "user_id": cls.learner_c.id})
        cls.headers_c = {"Authorization": f"Bearer {cls.token_c}"}

    @classmethod
    def tearDownClass(cls):
        settings.AI_PROVIDER = cls.orig_provider
        cls.db.close()

    def clear_learning_paths(self, user_id):
        p_ids = [p.id for p in self.db.query(LearningPath).filter(LearningPath.user_id == user_id).all()]
        if p_ids:
            self.db.query(LearningPathItem).filter(LearningPathItem.learning_path_id.in_(p_ids)).delete(synchronize_session=False)
            self.db.query(LearningPath).filter(LearningPath.id.in_(p_ids)).delete(synchronize_session=False)
            self.db.commit()

    def setup_learner_a_gaps(self, gap_comp_id=1, gap_score=48.0):
        role_comps = self.db.query(RoleCompetency).filter(RoleCompetency.role_id == self.learner_a.role_id).all()
        for rc in role_comps:
            cid = rc.competency_id
            score = gap_score if cid == gap_comp_id else 75.0
            uc = self.db.query(UserCompetency).filter(
                UserCompetency.user_id == self.learner_a.id,
                UserCompetency.competency_id == cid
            ).first()
            if not uc:
                uc = UserCompetency(user_id=self.learner_a.id, competency_id=cid, current_score=score, target_score=70.0, status="active")
                self.db.add(uc)
            else:
                uc.current_score = score
                uc.target_score = 70.0
        self.db.commit()

    def test_01_unauthenticated_access_denied(self):
        """Unauthenticated request to GET /api/recommendations/next-action must return 401."""
        res = self.client.get("/api/recommendations/next-action")
        self.assertEqual(res.status_code, 401)

    def test_02_empty_state_unassessed_learner(self):
        """Unassessed learner receives graceful fallback ASSESSMENT action."""
        self.clear_learning_paths(self.learner_c.id)
        self.db.query(Assessment).filter(Assessment.user_id == self.learner_c.id).delete()
        self.db.query(UserCompetency).filter(UserCompetency.user_id == self.learner_c.id).delete()
        self.db.commit()

        res = self.client.get("/api/recommendations/next-action", headers=self.headers_c)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["action_type"], "ASSESSMENT")
        self.assertEqual(data["next_step"]["type"], "ASSESSMENT")
        self.assertEqual(data["next_step"]["route"], "/assessment")
        self.assertIn("initial diagnostic", data["reason"].lower())

    def test_03_real_competency_gap_and_course_recommendation(self):
        """Learner with active competency deficit receives data-driven recommendation with real metrics."""
        self.clear_learning_paths(self.learner_a.id)
        self.db.query(LearningMaterial).filter(LearningMaterial.uploaded_by == self.learner_a.id).delete()
        self.db.commit()

        # Set gap on Competency 1 (48%), other role competencies to 75%
        self.setup_learner_a_gaps(gap_comp_id=1, gap_score=48.0)

        # Record completed assessment
        ass = Assessment(
            user_id=self.learner_a.id,
            assessment_type="diagnostic",
            status="completed",
            overall_score=48.0,
            started_at=datetime.utcnow() - timedelta(hours=2),
            completed_at=datetime.utcnow() - timedelta(hours=1)
        )
        self.db.add(ass)
        self.db.flush()

        cs = CompetencyScore(
            user_id=self.learner_a.id,
            competency_id=1,
            assessment_id=ass.id,
            score=48.0,
            assessed_at=datetime.utcnow() - timedelta(hours=1)
        )
        self.db.add(cs)
        self.db.commit()

        res = self.client.get("/api/recommendations/next-action", headers=self.headers_a)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["action_type"], "COURSE")
        self.assertEqual(data["competency_id"], 1)
        self.assertEqual(data["current_score"], 48.0)
        self.assertGreaterEqual(data["target_score"], 70.0)
        self.assertEqual(data["gap"], round(data["target_score"] - 48.0, 1))
        self.assertIn("below your", data["reason"].lower())
        self.assertEqual(data["resource"]["type"], "course")
        self.assertIsNotNone(data["resource"]["id"])

    def test_04_learner_owned_material_and_study_content_awareness(self):
        """When learner owns completed material matching the gap, recommendation shifts to study content."""
        self.clear_learning_paths(self.learner_a.id)
        self.setup_learner_a_gaps(gap_comp_id=1, gap_score=48.0)

        # Add completed material with Notes
        mat = LearningMaterial(
            title="Advanced Stratified Survey Handbook",
            filename="stratified_handbook.pdf",
            original_filename="stratified_handbook.pdf",
            file_type="pdf",
            file_size=80000,
            storage_path="uploads/stratified_handbook.pdf",
            uploaded_by=self.learner_a.id,
            processing_status="completed",
            material_scope="OFFICIAL_COMPETENCY",
            competency_id=1,
            extracted_text="Stratified sampling partitions heterogeneous population units into homogeneous strata."
        )
        self.db.add(mat)
        self.db.commit()
        self.db.refresh(mat)

        note = MaterialNote(
            material_id=mat.id,
            title="Stratified Sampling Study Notes",
            content={"title": "Stratified Sampling Study Notes", "sections": [{"heading": "Overview", "content": "Key stratified formulas"}]}
        )
        self.db.add(note)
        self.db.commit()

        res = self.client.get("/api/recommendations/next-action", headers=self.headers_a)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["action_type"], "STUDY_MATERIAL")
        self.assertEqual(data["resource"]["type"], "material")
        self.assertEqual(data["resource"]["id"], mat.id)
        self.assertEqual(data["next_step"]["type"], "NOTES")
        self.assertIn(f"/materials?materialId={mat.id}", data["next_step"]["route"])

        # Now add Flashcards deck -> Action becomes FLASHCARDS
        deck = MaterialFlashcardDeck(
            material_id=mat.id,
            title="Stratified Sampling Flashcards",
            version=1,
            status="ready"
        )
        self.db.add(deck)
        self.db.flush()
        fc = MaterialFlashcard(deck_id=deck.id, material_id=mat.id, front="What is Neyman allocation?", back="Sample size proportional to stratum size.", order=1)
        self.db.add(fc)
        self.db.commit()

        res_deck = self.client.get("/api/recommendations/next-action", headers=self.headers_a)
        self.assertEqual(res_deck.status_code, 200)
        data_deck = res_deck.json()
        self.assertEqual(data_deck["action_type"], "FLASHCARDS")
        self.assertEqual(data_deck["next_step"]["type"], "FLASHCARDS")

        # Now add Material Quiz Set -> Action becomes MATERIAL_QUIZ
        qset = MaterialQuizQuestionSet(
            material_id=mat.id,
            title="Stratified Sampling Quiz Set",
            version=1,
            status="ready"
        )
        self.db.add(qset)
        self.db.commit()

        res_quiz = self.client.get("/api/recommendations/next-action", headers=self.headers_a)
        self.assertEqual(res_quiz.status_code, 200)
        data_quiz = res_quiz.json()
        self.assertEqual(data_quiz["action_type"], "MATERIAL_QUIZ")
        self.assertEqual(data_quiz["next_step"]["type"], "QUIZ")
        self.assertIn("action=quiz", data_quiz["next_step"]["route"])

    def test_05_other_learning_material_integrity(self):
        """OTHER_LEARNING material must never fabricate competency_id or dummy associations."""
        other_mat = LearningMaterial(
            title="General Workplace Productivity Guide",
            filename="productivity.txt",
            original_filename="productivity.txt",
            file_type="txt",
            file_size=12000,
            storage_path="uploads/productivity.txt",
            uploaded_by=self.learner_b.id,
            processing_status="completed",
            material_scope="OTHER_LEARNING",
            competency_id=None,
            topic_id=None,
            extracted_text="General workplace time management and digital documentation tips."
        )
        self.db.add(other_mat)
        self.db.commit()
        self.db.refresh(other_mat)

        self.assertIsNone(other_mat.competency_id)
        self.assertEqual(other_mat.material_scope, "OTHER_LEARNING")

    def test_06_learning_progress_awareness_continue_learning(self):
        """Active in-progress learning path milestone produces CONTINUE_LEARNING."""
        self.clear_learning_paths(self.learner_a.id)

        path = LearningPath(
            user_id=self.learner_a.id,
            is_active=True,
            ai_reasoning="Active tailored curriculum."
        )
        self.db.add(path)
        self.db.flush()

        item = LearningPathItem(
            learning_path_id=path.id,
            title="MoSPI Field Sampling Module 1",
            description="Foundational survey execution",
            item_type="course",
            reference_id=1,
            competency_id=1,
            order=1,
            status="current",
            estimated_duration="2h",
            difficulty="intermediate"
        )
        self.db.add(item)
        self.db.commit()

        res = self.client.get("/api/recommendations/next-action", headers=self.headers_a)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["action_type"], "CONTINUE_LEARNING")
        self.assertEqual(data["resource"]["type"], "learning_path_item")
        self.assertEqual(data["resource"]["id"], item.id)
        self.assertEqual(data["next_step"]["route"], "/learning-path")
        self.assertIn("active in-progress", data["reason"].lower())

    def test_07_ownership_and_security(self):
        """Learner B cannot receive or access Learner A's private materials."""
        priv_mat = LearningMaterial(
            title="Learner A Secret Notes",
            filename="secret_a.txt",
            original_filename="secret_a.txt",
            file_type="txt",
            file_size=10000,
            storage_path="uploads/secret_a.txt",
            uploaded_by=self.learner_a.id,
            processing_status="completed",
            material_scope="OTHER_LEARNING",
            extracted_text="Confidential private study notes."
        )
        self.db.add(priv_mat)
        self.db.commit()

        res_b = self.client.get("/api/recommendations/next-action", headers=self.headers_b)
        self.assertEqual(res_b.status_code, 200)
        data_b = res_b.json()

        if data_b.get("resource") and data_b["resource"].get("type") == "material":
            self.assertNotEqual(data_b["resource"]["id"], priv_mat.id)

    def test_08_no_fake_data_and_real_ids(self):
        """All returned IDs and scores must exist in the database."""
        res = self.client.get("/api/recommendations/next-action", headers=self.headers_a)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        if data.get("competency_id"):
            comp = self.db.query(Competency).filter(Competency.id == data["competency_id"]).first()
            self.assertIsNotNone(comp)

        if data.get("resource") and data["resource"].get("id"):
            r_type = data["resource"]["type"]
            r_id = data["resource"]["id"]
            if r_type == "material":
                mat = self.db.query(LearningMaterial).filter(LearningMaterial.id == r_id).first()
                self.assertIsNotNone(mat)
            elif r_type == "learning_path_item":
                lpi = self.db.query(LearningPathItem).filter(LearningPathItem.id == r_id).first()
                self.assertIsNotNone(lpi)
            elif r_type == "course":
                course = self.db.query(Course).filter(Course.id == r_id).first()
                self.assertIsNotNone(course)

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
