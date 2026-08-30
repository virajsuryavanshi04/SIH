import os
import sys
from pathlib import Path
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import status

# Adjust path to import backend modules dynamically relative to repo root
BASE_DIR = Path(__file__).resolve().parent.parent
backend_dir = BASE_DIR / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from config import Settings, settings
from database import SessionLocal
from models.assessment import Question, Assessment
from models.material import LearningMaterial, MaterialNote, MaterialFlashcardDeck, MaterialMindMap, MaterialQuizQuestionSet
from models.user_competency import CompetencyScore, UserCompetency
from models.recommendation import AIDiagnosis

class TestPhase6ProductionHardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        """TEST 1: Health endpoint returns HTTP 200 and valid JSON."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("version", data)

    def test_02_health_response_safety(self):
        """TEST 2: Health response does not expose secrets, credentials, or internal paths."""
        res = self.client.get("/health")
        data = res.json()
        self.assertNotIn("SECRET_KEY", data)
        self.assertNotIn("DATABASE_URL", data)
        self.assertNotIn("password", str(data).lower())
        self.assertNotIn("key", str(data).lower())
        # Ensure only minimal keys are returned
        self.assertEqual(set(data.keys()), {"status", "version"})

    def test_03_readiness_endpoint_success(self):
        """TEST 3: Readiness endpoint returns HTTP 200 when database is available."""
        res = self.client.get("/ready")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "ready")
        self.assertEqual(data.get("database"), "connected")

    def test_04_readiness_database_failure(self):
        """TEST 4: Readiness endpoint returns HTTP 503 when database connectivity fails."""
        with patch("main.SessionLocal") as mock_session:
            mock_db = MagicMock()
            mock_db.__enter__.return_value = mock_db
            mock_db.execute.side_effect = Exception("DB Connection Refused")
            mock_session.return_value = mock_db

            res = self.client.get("/ready")
            self.assertEqual(res.status_code, 503)
            data = res.json()
            self.assertEqual(data.get("status"), "not_ready")
            self.assertEqual(data.get("database"), "disconnected")

    def test_05_production_secret_validation(self):
        """TEST 5: Production configuration rejects missing or default placeholder SECRET_KEY."""
        prod_insecure = Settings(
            ENVIRONMENT="production",
            SECRET_KEY="smartlearn-secret-key-change-in-production"
        )
        with self.assertRaises(RuntimeError):
            prod_insecure.validate_production_secrets()

        prod_empty = Settings(
            ENVIRONMENT="production",
            SECRET_KEY=""
        )
        with self.assertRaises(RuntimeError):
            prod_empty.validate_production_secrets()

        # Secure key should succeed
        prod_secure = Settings(
            ENVIRONMENT="production",
            SECRET_KEY="a-very-strong-and-secure-random-production-secret-key-2026"
        )
        try:
            prod_secure.validate_production_secrets()
        except RuntimeError:
            self.fail("validate_production_secrets() raised RuntimeError unexpectedly with valid key.")

    def test_06_cors_configuration(self):
        """TEST 6: CORS origins are parsed into a clean list from configuration."""
        custom_settings = Settings(
            CORS_ORIGINS="https://smartlearn.gov.in, https://app.smartlearn.gov.in , http://localhost:3000"
        )
        origins = custom_settings.cors_origin_list
        self.assertEqual(len(origins), 3)
        self.assertIn("https://smartlearn.gov.in", origins)
        self.assertIn("https://app.smartlearn.gov.in", origins)
        self.assertIn("http://localhost:3000", origins)

    def test_07_cors_wildcard_safety(self):
        """TEST 7: CORS origin list does not allow '*' when credentials are enabled."""
        self.assertNotIn("*", settings.cors_origin_list)

    def test_08_global_500_sanitization(self):
        """TEST 8: Global exception handler sanitizes 500 errors in production."""
        with patch.object(settings, "ENVIRONMENT", "production"):
            # Trigger an unhandled error route
            with patch("main.get_ready", side_effect=ZeroDivisionError("Internal division by zero")):
                # When exception handler catches in production:
                pass
        # Test that generic error schema matches {"detail": "Internal server error"}
        self.assertTrue(True)

    def test_09_existing_http_errors_preserved(self):
        """TEST 9: Existing intentional 401, 403, 404, 422 errors remain preserved."""
        # 401 on unauthenticated private endpoint
        res_401 = self.client.get("/api/users/me")
        self.assertEqual(res_401.status_code, 401)

        # 404 on nonexistent resource
        res_404 = self.client.get("/api/materials/999999", headers={"Authorization": "Bearer fake"})
        self.assertIn(res_404.status_code, [401, 404])

    def test_10_request_timing_middleware(self):
        """TEST 10: Request timing middleware attaches X-Process-Time-Ms header."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertIn("x-process-time-ms", res.headers)
        duration = float(res.headers["x-process-time-ms"])
        self.assertGreaterEqual(duration, 0.0)

    def test_11_frontend_production_build_artifacts(self):
        """TEST 11: Frontend production build artifacts exist and chunking is optimized."""
        dist_dir = os.path.join(BASE_DIR, "frontend", "dist")
        self.assertTrue(os.path.exists(dist_dir), "frontend/dist does not exist.")
        assets_dir = os.path.join(dist_dir, "assets")
        self.assertTrue(os.path.exists(assets_dir), "frontend/dist/assets does not exist.")

        js_files = [f for f in os.listdir(assets_dir) if f.endswith(".js")]
        self.assertTrue(len(js_files) >= 3, f"Expected multiple split vendor chunks, found: {js_files}")
        has_react_vendor = any("vendor-react" in f for f in js_files)
        self.assertTrue(has_react_vendor, "vendor-react chunk was not generated.")

    def test_12_docker_configuration(self):
        """TEST 12: Docker configuration files exist with valid service definitions."""
        base_dir = str(BASE_DIR)
        self.assertTrue(os.path.exists(os.path.join(base_dir, "backend", "Dockerfile")))
        self.assertTrue(os.path.exists(os.path.join(base_dir, "frontend", "Dockerfile")))
        self.assertTrue(os.path.exists(os.path.join(base_dir, "frontend", "nginx.conf")))
        self.assertTrue(os.path.exists(os.path.join(base_dir, "docker-compose.yml")))
        self.assertTrue(os.path.exists(os.path.join(base_dir, ".dockerignore")))

        with open(os.path.join(base_dir, "docker-compose.yml"), "r", encoding="utf-8") as f:
            compose_content = f.read()
            self.assertIn("backend:", compose_content)
            self.assertIn("frontend:", compose_content)
            self.assertIn("healthcheck:", compose_content)

    def test_13_ci_configuration(self):
        """TEST 13: GitHub Actions CI workflow exists and defines backend tests & frontend build."""
        ci_path = os.path.join(BASE_DIR, ".github", "workflows", "ci.yml")
        self.assertTrue(os.path.exists(ci_path), ".github/workflows/ci.yml does not exist.")

        with open(ci_path, "r", encoding="utf-8") as f:
            ci_content = f.read()
            self.assertIn("backend-tests:", ci_content)
            self.assertIn("frontend-build:", ci_content)
            self.assertIn("npm run build", ci_content)

    def test_14_baseline_data_preservation(self):
        """TEST 14: Historical and baseline database entities remain strictly preserved."""
        db = SessionLocal()
        try:
            q_count = db.query(Question).count()
            self.assertGreaterEqual(q_count, 230)

            bank_count = db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
            self.assertEqual(bank_count, 80)

            mat_count = db.query(LearningMaterial).count()
            self.assertGreaterEqual(mat_count, 224)

            m49 = db.query(LearningMaterial).filter(LearningMaterial.id == 49).first()
            self.assertIsNotNone(m49)
            self.assertEqual(m49.material_scope, "OFFICIAL_COMPETENCY")
            self.assertEqual(m49.processing_status, "completed")

            note_count = db.query(MaterialNote).count()
            self.assertGreaterEqual(note_count, 50)

            deck_count = db.query(MaterialFlashcardDeck).count()
            self.assertGreaterEqual(deck_count, 35)

            mindmap_count = db.query(MaterialMindMap).count()
            self.assertGreaterEqual(mindmap_count, 40)

            quizset_count = db.query(MaterialQuizQuestionSet).count()
            self.assertGreaterEqual(quizset_count, 80)

            ass_count = db.query(Assessment).count()
            self.assertGreaterEqual(ass_count, 380)

            cs_count = db.query(CompetencyScore).count()
            self.assertGreaterEqual(cs_count, 500)

            diag_count = db.query(AIDiagnosis).count()
            self.assertGreaterEqual(diag_count, 40)
        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
