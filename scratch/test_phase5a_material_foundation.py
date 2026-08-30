import os
import sys
import io
import unittest

# Add backend to path
sys.path.insert(0, os.path.abspath("d:/Affan/Hackathons/SIH/SmartLearn/backend"))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from main import app
from database import get_db, SessionLocal
from config import settings
from models.user import User
from models.material import LearningMaterial, GeneratedQuestion
from models.assessment import Question, QuestionOption
from models.competency import Competency, CompetencyTopic
from auth.security import create_access_token

client = TestClient(app)

class TestPhase5AMaterialFoundation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orig_provider = settings.AI_PROVIDER
        settings.AI_PROVIDER = "mock"
        db = SessionLocal()

        # Ensure Learner A
        cls.learner_a = db.query(User).filter(User.email == "learner_a_p5a@smartlearn.gov.in").first()
        if not cls.learner_a:
            cls.learner_a = User(
                email="learner_a_p5a@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Learner A Officer",
                role="learner",
                designation="Statistical Officer",
                role_id=1
            )
            db.add(cls.learner_a)
            db.commit()
            db.refresh(cls.learner_a)

        # Ensure Learner B
        cls.learner_b = db.query(User).filter(User.email == "learner_b_p5a@smartlearn.gov.in").first()
        if not cls.learner_b:
            cls.learner_b = User(
                email="learner_b_p5a@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Learner B Officer",
                role="learner",
                designation="Survey Officer",
                role_id=2
            )
            db.add(cls.learner_b)
            db.commit()
            db.refresh(cls.learner_b)

        # Ensure Admin
        cls.admin = db.query(User).filter(User.role == "admin").first()
        if not cls.admin:
            cls.admin = User(
                email="admin_p5a@smartlearn.gov.in",
                password_hash="mock_hash",
                full_name="Admin Officer",
                role="admin",
                designation="System Admin"
            )
            db.add(cls.admin)
            db.commit()
            db.refresh(cls.admin)

        cls.token_a = create_access_token({"sub": cls.learner_a.email, "role": "learner"})
        cls.headers_a = {"Authorization": f"Bearer {cls.token_a}"}

        cls.token_b = create_access_token({"sub": cls.learner_b.email, "role": "learner"})
        cls.headers_b = {"Authorization": f"Bearer {cls.token_b}"}

        cls.token_admin = create_access_token({"sub": cls.admin.email, "role": "admin"})
        cls.headers_admin = {"Authorization": f"Bearer {cls.token_admin}"}
        db.close()

    def test_01_explicit_material_scope_required(self):
        """New uploads must explicitly provide material_scope."""
        file_data = io.BytesIO(b"Sample curriculum text for statistical testing.")
        res = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("test_doc.txt", file_data, "text/plain")},
            data={"title": "Test Without Scope"}
        )
        self.assertEqual(res.status_code, 422, "Missing material_scope must return 422")

        # Invalid scope string
        file_data.seek(0)
        res_invalid = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("test_doc.txt", file_data, "text/plain")},
            data={"title": "Test Invalid Scope", "material_scope": "RANDOM_SCOPE"}
        )
        self.assertEqual(res_invalid.status_code, 422, "Invalid material_scope must return 422")

    def test_02_official_competency_upload_and_validation(self):
        """OFFICIAL_COMPETENCY requires valid competency_id and validates optional topic_id."""
        # 1. Missing competency_id
        file_data = io.BytesIO(b"Sample curriculum notes on stratified sampling.")
        res_missing = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("sampling_guide.txt", file_data, "text/plain")},
            data={"title": "Sampling Guide", "material_scope": "OFFICIAL_COMPETENCY"}
        )
        self.assertEqual(res_missing.status_code, 422, "OFFICIAL_COMPETENCY without competency_id must return 422")

        # 2. Valid competency_id
        db = SessionLocal()
        comp = db.query(Competency).first()
        comp_id = comp.id
        topic_matching = db.query(CompetencyTopic).filter(CompetencyTopic.competency_id == comp_id).first()
        topic_id = topic_matching.id if topic_matching else None
        other_topic = db.query(CompetencyTopic).filter(CompetencyTopic.competency_id != comp_id).first()
        other_topic_id = other_topic.id if other_topic else None
        db.close()

        file_data.seek(0)
        res_valid = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("sampling_guide.txt", file_data, "text/plain")},
            data={
                "title": "Official Sampling Standard Guide",
                "material_scope": "OFFICIAL_COMPETENCY",
                "competency_id": comp_id
            }
        )
        self.assertEqual(res_valid.status_code, 200)
        data = res_valid.json()
        self.assertEqual(data["material_scope"], "OFFICIAL_COMPETENCY")
        self.assertEqual(data["competency_id"], comp_id)
        self.assertEqual(data["processing_status"], "completed")

        # 3. Topic validation: Valid topic matching competency
        if topic_id:
            file_data.seek(0)
            res_topic = client.post(
                "/api/materials/upload",
                headers=self.headers_a,
                files={"file": ("topic_guide.txt", file_data, "text/plain")},
                data={
                    "title": "Topic Guide",
                    "material_scope": "OFFICIAL_COMPETENCY",
                    "competency_id": comp_id,
                    "topic_id": topic_id
                }
            )
            self.assertEqual(res_topic.status_code, 200)
            self.assertEqual(res_topic.json()["topic_id"], topic_id)

        # 4. Topic validation: Topic from a DIFFERENT competency -> must fail 422
        if other_topic_id:
            file_data.seek(0)
            res_mismatch = client.post(
                "/api/materials/upload",
                headers=self.headers_a,
                files={"file": ("mismatch_guide.txt", file_data, "text/plain")},
                data={
                    "title": "Mismatch Topic Guide",
                    "material_scope": "OFFICIAL_COMPETENCY",
                    "competency_id": comp_id,
                    "topic_id": other_topic_id
                }
            )
            self.assertEqual(res_mismatch.status_code, 422, "Topic belonging to different competency must return 422")

    def test_03_other_learning_material_upload(self):
        """OTHER_LEARNING allows unmapped study material with null competency and topic."""
        file_data = io.BytesIO(b"General programming notes on python and data structures.")
        res = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("python_notes.txt", file_data, "text/plain")},
            data={
                "title": "Python Data Structures Notes",
                "material_scope": "OTHER_LEARNING"
            }
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["material_scope"], "OTHER_LEARNING")
        self.assertIsNone(data["competency_id"])
        self.assertIsNone(data["topic_id"])
        self.assertEqual(data["processing_status"], "completed")

    def test_04_file_type_and_security_validation(self):
        """Prohibited executable formats are rejected with 400."""
        # Executable .exe file
        exe_data = io.BytesIO(b"MZ\x90\x00executable binary code")
        res_exe = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("malicious.exe", exe_data, "application/octet-stream")},
            data={"title": "Malicious File", "material_scope": "OTHER_LEARNING"}
        )
        self.assertEqual(res_exe.status_code, 400, "Executable file must return 400")

        # Shell script .sh
        sh_data = io.BytesIO(b"#!/bin/bash\necho hello")
        res_sh = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("script.sh", sh_data, "text/plain")},
            data={"title": "Script File", "material_scope": "OTHER_LEARNING"}
        )
        self.assertEqual(res_sh.status_code, 400, "Shell script must return 400")

    def test_05_role_aware_listing_and_ownership(self):
        """
        Learner A sees only Learner A's materials.
        Admin sees all materials.
        Learner B cannot view, edit, or delete Learner A's material.
        """
        # Upload material as Learner A
        file_data = io.BytesIO(b"Private study material of Learner A.")
        res_upload = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("private_notes_a.txt", file_data, "text/plain")},
            data={"title": "Private Notes of Learner A", "material_scope": "OTHER_LEARNING"}
        )
        self.assertEqual(res_upload.status_code, 200)
        mat_id = res_upload.json()["id"]

        # Learner A views own material
        res_a_view = client.get(f"/api/materials/{mat_id}", headers=self.headers_a)
        self.assertEqual(res_a_view.status_code, 200)
        self.assertEqual(res_a_view.json()["title"], "Private Notes of Learner A")

        # Learner B attempts to view Learner A's material -> 403 Forbidden
        res_b_view = client.get(f"/api/materials/{mat_id}", headers=self.headers_b)
        self.assertEqual(res_b_view.status_code, 403, "Learner B viewing Learner A material must return 403")

        # Learner B attempts to edit Learner A's material -> 403 Forbidden
        res_b_edit = client.patch(
            f"/api/materials/{mat_id}",
            headers=self.headers_b,
            json={"title": "Hacked Title"}
        )
        self.assertEqual(res_b_edit.status_code, 403, "Learner B editing Learner A material must return 403")

        # Learner B attempts to delete Learner A's material -> 403 Forbidden
        res_b_del = client.delete(f"/api/materials/{mat_id}", headers=self.headers_b)
        self.assertEqual(res_b_del.status_code, 403, "Learner B deleting Learner A material must return 403")

        # Admin views Learner A's material -> 200 OK
        res_admin_view = client.get(f"/api/materials/{mat_id}", headers=self.headers_admin)
        self.assertEqual(res_admin_view.status_code, 200)

        # Admin list vs Learner list
        admin_list = client.get("/api/materials", headers=self.headers_admin).json()
        learner_a_list = client.get("/api/materials", headers=self.headers_a).json()
        self.assertGreater(len(admin_list), len(learner_a_list))
        self.assertTrue(all(m["uploaded_by"] == self.learner_a.id for m in learner_a_list))

    def test_06_metadata_update_and_scope_transition(self):
        """Editing metadata and changing scopes enforces required invariants."""
        # Create as OTHER_LEARNING
        file_data = io.BytesIO(b"Notes to be reclassified.")
        res_upload = client.post(
            "/api/materials/upload",
            headers=self.headers_a,
            files={"file": ("reclassify.txt", file_data, "text/plain")},
            data={"title": "Unclassified Notes", "material_scope": "OTHER_LEARNING"}
        )
        mat_id = res_upload.json()["id"]

        db = SessionLocal()
        comp = db.query(Competency).first()
        comp_id = comp.id
        db.close()

        # Update to OFFICIAL_COMPETENCY without competency -> 422
        res_bad_update = client.patch(
            f"/api/materials/{mat_id}",
            headers=self.headers_a,
            json={"material_scope": "OFFICIAL_COMPETENCY"}
        )
        self.assertEqual(res_bad_update.status_code, 422)

        # Update to OFFICIAL_COMPETENCY with valid competency -> 200
        res_good_update = client.patch(
            f"/api/materials/{mat_id}",
            headers=self.headers_a,
            json={
                "title": "Reclassified Official Standard",
                "material_scope": "OFFICIAL_COMPETENCY",
                "competency_id": comp_id
            }
        )
        self.assertEqual(res_good_update.status_code, 200)
        self.assertEqual(res_good_update.json()["material_scope"], "OFFICIAL_COMPETENCY")
        self.assertEqual(res_good_update.json()["competency_id"], comp_id)

        # Update back to OTHER_LEARNING -> clears competency_id
        res_back_update = client.patch(
            f"/api/materials/{mat_id}",
            headers=self.headers_a,
            json={"material_scope": "OTHER_LEARNING"}
        )
        self.assertEqual(res_back_update.status_code, 200)
        self.assertEqual(res_back_update.json()["material_scope"], "OTHER_LEARNING")
        self.assertIsNone(res_back_update.json()["competency_id"])
        self.assertIsNone(res_back_update.json()["topic_id"])

    def test_07_database_and_material_49_preservation(self):
        """Verify 220 questions, 80 bank questions, Material #49, and 0 null scopes."""
        db = SessionLocal()
        # 1. 220 questions intact
        q_count = db.query(Question).count()
        self.assertGreaterEqual(q_count, 220)

        # 2. 80 bank questions intact
        bank_count = db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        self.assertEqual(bank_count, 80)

        # 3. 0 NULL material_scope values in DB
        null_scope_count = db.query(LearningMaterial).filter(LearningMaterial.material_scope.is_(None)).count()
        self.assertEqual(null_scope_count, 0)

        # 4. Material #49 preserved intact
        mat49 = db.query(LearningMaterial).filter(LearningMaterial.id == 49).first()
        self.assertIsNotNone(mat49)
        self.assertEqual(mat49.material_scope, "OFFICIAL_COMPETENCY")
        self.assertEqual(mat49.competency_id, 1)
        db.close()

if __name__ == "__main__":
    unittest.main()
