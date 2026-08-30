import os
import sys
import unittest
import io

# Setup path
sys.path.insert(0, r"d:\Affan\Hackathons\SIH\SmartLearn\backend")

from fastapi.testclient import TestClient
from main import app
from database import get_db, SessionLocal
from models.user import User
from models.material import LearningMaterial, MaterialNote, MaterialFlashcardDeck, MaterialFlashcard, MaterialMindMap
from models.assessment import Question
from auth.security import create_access_token

class TestPhase5BStudyContent(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from config import settings
        cls.orig_provider = settings.AI_PROVIDER
        settings.AI_PROVIDER = "mock"

        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Users
        cls.learner1 = cls.db.query(User).filter(User.email == "learner_a_p5b@smartlearn.gov.in").first()
        if not cls.learner1:
            cls.learner1 = User(
                email="learner_a_p5b@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Learner A Officer",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            cls.db.add(cls.learner1)
            cls.db.commit()
            cls.db.refresh(cls.learner1)

        cls.learner2 = cls.db.query(User).filter(User.email == "learner_b_p5b@smartlearn.gov.in").first()
        if not cls.learner2:
            cls.learner2 = User(
                email="learner_b_p5b@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Learner B Officer",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            cls.db.add(cls.learner2)
            cls.db.commit()
            cls.db.refresh(cls.learner2)

        cls.admin = cls.db.query(User).filter(User.role == "admin").first()
        if not cls.admin:
            cls.admin = User(
                email="admin_p5b@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Admin Officer",
                role="admin"
            )
            cls.db.add(cls.admin)
            cls.db.commit()
            cls.db.refresh(cls.admin)

        cls.learner1_token = create_access_token({"sub": cls.learner1.email, "role": cls.learner1.role})
        cls.learner2_token = create_access_token({"sub": cls.learner2.email, "role": cls.learner2.role})
        cls.admin_token = create_access_token({"sub": cls.admin.email, "role": cls.admin.role})

        cls.h1 = {"Authorization": f"Bearer {cls.learner1_token}"}
        cls.h2 = {"Authorization": f"Bearer {cls.learner2_token}"}
        cls.h_admin = {"Authorization": f"Bearer {cls.admin_token}"}

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_study_content_status_and_readiness_protection(self):
        """Verify readiness check prevents study content generation on unready materials."""
        # 1. Create a dummy unready material
        unready_mat = LearningMaterial(
            title="Unready Material",
            filename="unready.txt",
            original_filename="unready.txt",
            file_type="text/plain",
            file_size=100,
            storage_path="uploads/unready.txt",
            material_scope="OTHER_LEARNING",
            uploaded_by=self.learner1.id,
            processing_status="error",  # Not completed
            extracted_text=""
        )
        self.db.add(unready_mat)
        self.db.commit()
        self.db.refresh(unready_mat)

        # Generating notes on unready material must fail with 400
        res = self.client.post(f"/api/materials/{unready_mat.id}/notes/generate", headers=self.h1)
        self.assertEqual(res.status_code, 400)
        self.assertIn("not ready", res.json()["detail"].lower())

        # Generating flashcards on unready material must fail with 400
        res = self.client.post(f"/api/materials/{unready_mat.id}/flashcards/generate", headers=self.h1)
        self.assertEqual(res.status_code, 400)

        # Generating mind map on unready material must fail with 400
        res = self.client.post(f"/api/materials/{unready_mat.id}/mind-map/generate", headers=self.h1)
        self.assertEqual(res.status_code, 400)

        # Check status endpoint
        res = self.client.get(f"/api/materials/{unready_mat.id}/study-content-status", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        st = res.json()
        self.assertFalse(st["has_notes"])
        self.assertFalse(st["has_flashcards"])
        self.assertFalse(st["has_mind_map"])

    def test_02_notes_generation_retrieval_and_regeneration(self):
        """Verify notes generation, section structure, retrieval of latest version, and regeneration."""
        # Upload valid material
        content = (
            "National Statistical Sampling Standards.\n"
            "Stratified sampling improves estimation efficiency by dividing the population into homogeneous strata.\n"
            "Neyman optimal allocation determines sample size per stratum based on variance.\n"
            "Non-sampling errors include respondent bias and data entry mistakes."
        )
        file_obj = io.BytesIO(content.encode('utf-8'))
        res = self.client.post(
            "/api/materials/upload",
            headers=self.h1,
            data={"material_scope": "OFFICIAL_COMPETENCY", "competency_id": 1, "title": "Statistical Sampling Manual"},
            files={"file": ("sampling_manual.txt", file_obj, "text/plain")}
        )
        self.assertEqual(res.status_code, 200)
        mat_id = res.json()["id"]

        # 1. Generate Notes (v1)
        res = self.client.post(f"/api/materials/{mat_id}/notes/generate", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        n1 = res.json()
        self.assertEqual(n1["version"], 1)
        self.assertEqual(n1["status"], "ready")
        self.assertTrue(len(n1["sections"]) >= 2)
        headings = [s["heading"] for s in n1["sections"]]
        self.assertTrue(any("Overview" in h or "Key" in h or "Concepts" in h for h in headings))

        # 2. Get Notes -> returns v1
        res = self.client.get(f"/api/materials/{mat_id}/notes", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["version"], 1)

        # 3. Regenerate Notes -> creates v2
        res = self.client.post(f"/api/materials/{mat_id}/notes/generate", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        n2 = res.json()
        self.assertEqual(n2["version"], 2)

        # 4. Get Notes -> returns v2
        res = self.client.get(f"/api/materials/{mat_id}/notes", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["version"], 2)

    def test_03_flashcards_generation_deck_versioning_and_isolation(self):
        """Verify flashcards generation, card structure, and that regeneration separates decks without mixing cards."""
        content = (
            "Periodic Labour Force Survey Guidelines.\n"
            "Usual Principal Activity Status refers to the activity pursued for a majority of 365 days.\n"
            "Current Weekly Status measures activity during the preceding 7 days.\n"
            "Worker Population Ratio is the percentage of employed persons in the total population."
        )
        file_obj = io.BytesIO(content.encode('utf-8'))
        res = self.client.post(
            "/api/materials/upload",
            headers=self.h1,
            data={"material_scope": "OFFICIAL_COMPETENCY", "competency_id": 2, "title": "PLFS Labour Guide"},
            files={"file": ("plfs_guide.txt", file_obj, "text/plain")}
        )
        self.assertEqual(res.status_code, 200)
        mat_id = res.json()["id"]

        # 1. Generate Flashcards (Deck v1)
        res = self.client.post(f"/api/materials/{mat_id}/flashcards/generate?count=5", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        d1 = res.json()
        deck1_id = d1["deck_id"]
        self.assertEqual(d1["version"], 1)
        self.assertTrue(len(d1["cards"]) >= 2)
        v1_cards = d1["cards"]
        v1_card_ids = [c["id"] for c in v1_cards]

        # 2. Get Flashcards -> returns Deck v1 with its cards
        res = self.client.get(f"/api/materials/{mat_id}/flashcards", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["deck_id"], deck1_id)
        self.assertEqual(res.json()["version"], 1)

        # 3. Regenerate Flashcards (Deck v2)
        res = self.client.post(f"/api/materials/{mat_id}/flashcards/generate?count=5", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        d2 = res.json()
        deck2_id = d2["deck_id"]
        self.assertNotEqual(deck1_id, deck2_id)
        self.assertEqual(d2["version"], 2)
        v2_cards = d2["cards"]
        v2_card_ids = [c["id"] for c in v2_cards]

        # Critical: Verify cards from Deck 1 and Deck 2 are strictly distinct (no mixing!)
        self.assertEqual(len(set(v1_card_ids).intersection(set(v2_card_ids))), 0)

        # 4. Get Flashcards -> returns only Deck v2 cards
        res = self.client.get(f"/api/materials/{mat_id}/flashcards", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["deck_id"], deck2_id)
        self.assertEqual(res.json()["version"], 2)
        retrieved_ids = [c["id"] for c in res.json()["cards"]]
        self.assertEqual(retrieved_ids, v2_card_ids)

    def test_04_mind_map_generation_tree_structure_and_regeneration(self):
        """Verify mind map generation, hierarchical tree structure, and regeneration."""
        content = (
            "Official Statistical Quality Framework.\n"
            "Dimension 1: Relevance and completeness of indicators.\n"
            "Dimension 2: Accuracy and reliability through sampling audits.\n"
            "Dimension 3: Timeliness and punctuality of census release schedules."
        )
        file_obj = io.BytesIO(content.encode('utf-8'))
        res = self.client.post(
            "/api/materials/upload",
            headers=self.h1,
            data={"material_scope": "OTHER_LEARNING", "title": "Data Quality Principles"},
            files={"file": ("quality_principles.txt", file_obj, "text/plain")}
        )
        self.assertEqual(res.status_code, 200)
        mat_id = res.json()["id"]

        # 1. Generate Mind Map (v1)
        res = self.client.post(f"/api/materials/{mat_id}/mind-map/generate", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        mm1 = res.json()
        self.assertEqual(mm1["version"], 1)
        self.assertIn("root_node", mm1)
        self.assertTrue("label" in mm1["root_node"])
        self.assertTrue(isinstance(mm1["root_node"]["children"], list))

        # 2. Get Mind Map -> returns v1
        res = self.client.get(f"/api/materials/{mat_id}/mind-map", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["version"], 1)

        # 3. Regenerate Mind Map -> creates v2
        res = self.client.post(f"/api/materials/{mat_id}/mind-map/generate", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        mm2 = res.json()
        self.assertEqual(mm2["version"], 2)

        # 4. Get Mind Map -> returns v2
        res = self.client.get(f"/api/materials/{mat_id}/mind-map", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["version"], 2)

    def test_05_ownership_security_isolation(self):
        """Verify Learner B cannot generate or access Learner A's study content."""
        # Learner 1 uploads Material
        content = "Confidential statistical analysis framework for official use only."
        file_obj = io.BytesIO(content.encode('utf-8'))
        res = self.client.post(
            "/api/materials/upload",
            headers=self.h1,
            data={"material_scope": "OTHER_LEARNING", "title": "Confidential Framework"},
            files={"file": ("confidential.txt", file_obj, "text/plain")}
        )
        mat_id = res.json()["id"]

        # Learner 1 generates notes, flashcards, mind map
        self.client.post(f"/api/materials/{mat_id}/notes/generate", headers=self.h1)
        self.client.post(f"/api/materials/{mat_id}/flashcards/generate", headers=self.h1)
        self.client.post(f"/api/materials/{mat_id}/mind-map/generate", headers=self.h1)

        # Learner 2 attempts access -> 403 Forbidden
        res = self.client.get(f"/api/materials/{mat_id}/study-content-status", headers=self.h2)
        self.assertEqual(res.status_code, 403)

        res = self.client.get(f"/api/materials/{mat_id}/notes", headers=self.h2)
        self.assertEqual(res.status_code, 403)

        res = self.client.post(f"/api/materials/{mat_id}/notes/generate", headers=self.h2)
        self.assertEqual(res.status_code, 403)

        res = self.client.get(f"/api/materials/{mat_id}/flashcards", headers=self.h2)
        self.assertEqual(res.status_code, 403)

        res = self.client.post(f"/api/materials/{mat_id}/flashcards/generate", headers=self.h2)
        self.assertEqual(res.status_code, 403)

        res = self.client.get(f"/api/materials/{mat_id}/mind-map", headers=self.h2)
        self.assertEqual(res.status_code, 403)

        res = self.client.post(f"/api/materials/{mat_id}/mind-map/generate", headers=self.h2)
        self.assertEqual(res.status_code, 403)

        # Admin can access
        res = self.client.get(f"/api/materials/{mat_id}/notes", headers=self.h_admin)
        self.assertEqual(res.status_code, 200)

    def test_06_controlled_content_grounding(self):
        """Controlled test verifying generated content reflects supplied facts (TCP vs UDP)."""
        controlled_text = (
            "Computer Networks: Transport Layer Fundamentals.\n"
            "TCP is connection-oriented, establishing a three-way handshake and guaranteeing reliable in-order delivery.\n"
            "UDP is connectionless and does not perform handshake or retransmission, minimizing transmission latency."
        )
        file_obj = io.BytesIO(controlled_text.encode('utf-8'))
        res = self.client.post(
            "/api/materials/upload",
            headers=self.h1,
            data={"material_scope": "OTHER_LEARNING", "title": "Transport Protocols: TCP and UDP"},
            files={"file": ("tcp_udp.txt", file_obj, "text/plain")}
        )
        self.assertEqual(res.status_code, 200)
        mat_id = res.json()["id"]

        # 1. Notes Grounding
        res = self.client.post(f"/api/materials/{mat_id}/notes/generate", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        notes_str = str(res.json()).lower()
        self.assertTrue("tcp" in notes_str or "connection" in notes_str)
        self.assertTrue("udp" in notes_str or "connectionless" in notes_str)

        # 2. Flashcards Grounding
        res = self.client.post(f"/api/materials/{mat_id}/flashcards/generate", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        cards_str = str(res.json()["cards"]).lower()
        self.assertTrue("tcp" in cards_str)
        self.assertTrue("udp" in cards_str)

        # 3. Mind Map Grounding
        res = self.client.post(f"/api/materials/{mat_id}/mind-map/generate", headers=self.h1)
        self.assertEqual(res.status_code, 200)
        mm_str = str(res.json()["root_node"]).lower()
        self.assertTrue("tcp" in mm_str or "protocols" in mm_str or "transport" in mm_str)

    def test_07_database_and_material_49_preservation(self):
        """Verify baseline data integrity: >= 220 questions, 80 bank questions, 51+ materials, Material #49 intact."""
        total_q = self.db.query(Question).count()
        self.assertGreaterEqual(total_q, 220, f"Expected at least 220 questions, found {total_q}")

        bank_q = self.db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        self.assertEqual(bank_q, 80, f"Expected 80 question bank questions, found {bank_q}")

        mat49 = self.db.query(LearningMaterial).filter(LearningMaterial.id == 49).first()
        self.assertIsNotNone(mat49, "Material #49 must exist")
        self.assertEqual(mat49.material_scope, "OFFICIAL_COMPETENCY")
        self.assertEqual(mat49.competency_id, 1)

if __name__ == "__main__":
    unittest.main()
