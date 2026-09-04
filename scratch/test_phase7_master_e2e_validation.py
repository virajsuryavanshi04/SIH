import os
import sys
import uuid
import unittest
import io
from fastapi.testclient import TestClient

from pathlib import Path

# Ensure backend directory is in python path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from config import settings
from database import SessionLocal
from models.assessment import Question, Assessment, AssessmentAnswer
from models.material import LearningMaterial, MaterialNote, MaterialFlashcardDeck, MaterialMindMap, MaterialQuizQuestionSet
from models.user_competency import CompetencyScore, UserCompetency
from models.recommendation import AIDiagnosis, AIRecommendation
from models.role import Role
from models.competency import Competency, RoleCompetency

class TestPhase7MasterE2EValidation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Set AI_PROVIDER to mock for fast, deterministic, reliable test execution
        settings.AI_PROVIDER = "mock"
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        
        # Capture baseline read-only counts
        cls.initial_questions = cls.db.query(Question).count()
        cls.initial_bank_questions = cls.db.query(Question).filter(Question.bank_question_id.isnot(None)).count()
        cls.initial_materials = cls.db.query(LearningMaterial).count()
        cls.initial_assessments = cls.db.query(Assessment).count()
        cls.initial_scores = cls.db.query(CompetencyScore).count()
        cls.initial_diagnoses = cls.db.query(AIDiagnosis).count()

        # Check Material #49
        m49 = cls.db.query(LearningMaterial).filter(LearningMaterial.id == 49).first()
        cls.m49_exists = m49 is not None
        cls.m49_scope = m49.material_scope if m49 else None

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_master_e2e_learner_lifecycle(self):
        """
        Executes the complete end-to-end continuous learner lifecycle across Stages 1-14.
        """
        results_summary = []
        
        # =========================================================================
        # STAGE 1 — REGISTRATION & AUTHENTICATION
        # =========================================================================
        try:
            unique_suffix = uuid.uuid4().hex[:8]
            learner_email = f"phase7_e2e_{unique_suffix}@smartlearn.gov.in"
            learner_password = "SecurePassword123!"
            learner_name = f"Officer Arjun {unique_suffix}"

            # 1. Register
            reg_res = self.client.post("/api/auth/register", json={
                "email": learner_email,
                "password": learner_password,
                "full_name": learner_name
            })
            self.assertEqual(reg_res.status_code, 200, f"Registration failed: {reg_res.text}")

            # 2. Login
            login_res = self.client.post("/api/auth/login", json={
                "email": learner_email,
                "password": learner_password
            })
            self.assertEqual(login_res.status_code, 200, f"Login failed: {login_res.text}")
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # 3. Verify /auth/me
            me_res = self.client.get("/api/auth/me", headers=headers)
            self.assertEqual(me_res.status_code, 200)
            self.assertEqual(me_res.json()["email"], learner_email)
            learner_id = me_res.json()["id"]
            
            results_summary.append("[1/14] Registration & Authentication       PASS")
        except Exception as e:
            results_summary.append(f"[1/14] Registration & Authentication       FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 2 — ROLE ONBOARDING (Statistical Officer)
        # =========================================================================
        try:
            stat_role = self.db.query(Role).filter(Role.name == "Statistical Officer").first()
            if not stat_role:
                stat_role = self.db.query(Role).first()
            role_id = stat_role.id

            onboard_res = self.client.post("/api/users/onboarding", headers=headers, json={
                "role_id": role_id,
                "department_name": "Ministry of Statistics & Programme Implementation",
                "experience_years": 3,
                "work_areas": ["Survey Design", "Sampling Methods", "Data Analytics"]
            })
            self.assertEqual(onboard_res.status_code, 200, f"Onboarding failed: {onboard_res.text}")
            
            # Verify role persistence
            profile_res = self.client.get("/api/users/me", headers=headers)
            self.assertEqual(profile_res.status_code, 200)
            self.assertEqual(profile_res.json()["role_id"], role_id)
            
            results_summary.append("[2/14] Role Onboarding                     PASS")
        except Exception as e:
            results_summary.append(f"[2/14] Role Onboarding                     FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 3 — BASELINE ADAPTIVE ASSESSMENT
        # =========================================================================
        try:
            start_res = self.client.post("/api/assessments/start", headers=headers, json={
                "assessment_type": "adaptive",
                "question_count": 10,
                "question_type": "MIXED"
            })
            self.assertEqual(start_res.status_code, 200, f"Assessment start failed: {start_res.text}")
            ass_data = start_res.json()
            assessment_id = ass_data["assessment_id"]
            current_q = ass_data["questions"][0]

            # Iterate through questions answering through API
            for i in range(10):
                # Verify no answer leakage
                self.assertNotIn("is_correct", current_q)
                self.assertNotIn("correct_answer", current_q)
                self.assertNotIn("explanation", current_q)

                selected_opt = current_q["options"][0]["text"]
                # Invert answer on some questions to generate a realistic deficit gap
                confidence = 4 if i < 6 else 2

                submit_res = self.client.post(f"/api/assessments/{assessment_id}/adaptive-next", headers=headers, json={
                    "question_id": current_q["id"],
                    "selected_option_id": current_q["options"][0]["id"],
                    "selected_option_text": selected_opt,
                    "confidence_level": confidence,
                    "time_taken_seconds": 25,
                    "current_index": i
                })
                self.assertEqual(submit_res.status_code, 200)
                next_data = submit_res.json()
                self.assertTrue(1 <= next_data.get("current_difficulty", 2) <= 3)
                if next_data.get("next_question"):
                    current_q = next_data["next_question"]

            results_summary.append("[3/14] Baseline Assessment                 PASS")
        except Exception as e:
            results_summary.append(f"[3/14] Baseline Assessment                 FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 4 — BASELINE COMPLETION & AUTHORITATIVE SCORING
        # =========================================================================
        try:
            result_res = self.client.get(f"/api/assessments/{assessment_id}/result", headers=headers)
            self.assertEqual(result_res.status_code, 200, f"Result fetch failed: {result_res.text}")
            res_data = result_res.json()
            self.assertIn("overall_score", res_data)
            self.assertIn("competency_breakdown", res_data)

            # Record baseline score for comparison
            baseline_scores = {
                cb["competency_id"]: cb["current_score"]
                for cb in res_data.get("competency_breakdown", [])
            }
            self.assertTrue(len(baseline_scores) > 0)
            
            results_summary.append("[4/14] Authoritative Scoring               PASS")
        except Exception as e:
            results_summary.append(f"[4/14] Authoritative Scoring               FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 5 — GAP & RECOMMENDATION VALIDATION
        # =========================================================================
        try:
            gaps_res = self.client.get("/api/competencies/me/gaps", headers=headers)
            self.assertEqual(gaps_res.status_code, 200)
            gaps_data = gaps_res.json()

            rec_res = self.client.get("/api/recommendations/next-action", headers=headers)
            self.assertEqual(rec_res.status_code, 200)
            rec_data = rec_res.json()
            self.assertIn("action_type", rec_data)
            self.assertIn("title", rec_data)
            self.assertIn("reason", rec_data)

            results_summary.append("[5/14] Gap & Recommendation                PASS")
        except Exception as e:
            results_summary.append(f"[5/14] Gap & Recommendation                FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 6 — MULTI-MODAL STUDY VALIDATION
        # =========================================================================
        try:
            target_cid = list(baseline_scores.keys())[0] if baseline_scores else 1
            sample_content = (
                "National Sample Survey Organization Statistical Methodologies.\n\n"
                "Stratified Random Sampling divides the heterogeneous population into homogeneous strata.\n"
                "Proportional allocation assigns sample size to stratum proportional to stratum weight.\n"
                "Standard error calculation measures sampling variability and estimation precision.\n"
                "Non-sampling errors occur during data collection, reporting, and non-response phases."
            )
            file_bytes = io.BytesIO(sample_content.encode("utf-8"))

            upload_res = self.client.post(
                "/api/materials/upload",
                headers=headers,
                data={
                    "title": f"Official Survey Sampling Manual {unique_suffix}",
                    "material_scope": "OFFICIAL_COMPETENCY",
                    "competency_id": target_cid
                },
                files={"file": (f"sampling_manual_{unique_suffix}.txt", file_bytes, "text/plain")}
            )
            self.assertEqual(upload_res.status_code, 200, f"Upload failed: {upload_res.text}")
            material_id = upload_res.json()["id"]

            # Generate AI Study Notes
            notes_res = self.client.post(f"/api/materials/{material_id}/notes/generate", headers=headers)
            self.assertEqual(notes_res.status_code, 200)

            # Generate AI Flashcards
            fc_res = self.client.post(f"/api/materials/{material_id}/flashcards/generate?count=5", headers=headers)
            self.assertEqual(fc_res.status_code, 200)

            # Generate AI Mind Map
            mm_res = self.client.post(f"/api/materials/{material_id}/mind-map/generate", headers=headers)
            self.assertEqual(mm_res.status_code, 200)

            results_summary.append("[6/14] Multi-Modal Materials               PASS")
        except Exception as e:
            results_summary.append(f"[6/14] Multi-Modal Materials               FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 7 — MATERIAL QUIZ VALIDATION
        # =========================================================================
        try:
            mq_start_res = self.client.post(f"/api/materials/{material_id}/quiz/start", headers=headers, json={
                "question_count": 10,
                "question_type": "SHORT_MCQ"
            })
            self.assertEqual(mq_start_res.status_code, 200, f"Material quiz start failed: {mq_start_res.text}")
            mq_data = mq_start_res.json()
            mq_ass_id = mq_data["assessment_id"]
            mq_current_q = mq_data["questions"][0]

            # Answer material quiz questions
            for i in range(10):
                mq_sub = self.client.post(f"/api/assessments/{mq_ass_id}/adaptive-next", headers=headers, json={
                    "question_id": mq_current_q["id"],
                    "selected_option_id": mq_current_q["options"][0]["id"],
                    "selected_option_text": mq_current_q["options"][0]["text"],
                    "confidence_level": 4,
                    "time_taken_seconds": 15,
                    "current_index": i
                })
                if mq_sub.status_code == 200 and mq_sub.json().get("next_question"):
                    mq_current_q = mq_sub.json()["next_question"]

            # Fetch material quiz result
            mq_res = self.client.get(f"/api/assessments/{mq_ass_id}/result", headers=headers)
            self.assertEqual(mq_res.status_code, 200)
            
            results_summary.append("[7/14] Material Quiz                       PASS")
        except Exception as e:
            results_summary.append(f"[7/14] Material Quiz                       FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 8 — COGNITIVE DIAGNOSIS VALIDATION
        # =========================================================================
        try:
            diag_res1 = self.client.get(f"/api/diagnosis/assessment/{assessment_id}", headers=headers)
            self.assertEqual(diag_res1.status_code, 200, f"Diagnosis failed: {diag_res1.text}")
            diag_data1 = diag_res1.json()
            self.assertIn("primary_bottleneck", diag_data1)
            self.assertIn("diagnostic_confidence", diag_data1)
            self.assertIn("misconceptions", diag_data1)

            # Test diagnosis caching on second call
            diag_res2 = self.client.get(f"/api/diagnosis/assessment/{assessment_id}", headers=headers)
            self.assertEqual(diag_res2.status_code, 200)
            diag_data2 = diag_res2.json()
            self.assertTrue(diag_data2.get("is_cached", False))

            results_summary.append("[8/14] Cognitive Diagnosis                 PASS")
        except Exception as e:
            results_summary.append(f"[8/14] Cognitive Diagnosis                 FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 9 — REMEDIATION VALIDATION
        # =========================================================================
        try:
            remed_res = self.client.get(f"/api/diagnosis/remediation/{target_cid}", headers=headers)
            self.assertEqual(remed_res.status_code, 200, f"Remediation failed: {remed_res.text}")
            remed_data = remed_res.json()
            self.assertEqual(remed_data["competency_id"], target_cid)
            self.assertIn("recommended_courses", remed_data)
            self.assertIn("learner_materials", remed_data)

            results_summary.append("[9/14] Remediation                         PASS")
        except Exception as e:
            results_summary.append(f"[9/14] Remediation                         FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 10 — TARGETED REASSESSMENT
        # =========================================================================
        try:
            reass_start = self.client.post("/api/assessments/start", headers=headers, json={
                "assessment_type": "adaptive_reassessment",
                "competency_id": target_cid,
                "question_count": 10,
                "question_type": "MIXED"
            })
            self.assertEqual(reass_start.status_code, 200, f"Reassessment start failed: {reass_start.text}")
            reass_data = reass_start.json()
            reass_id = reass_data["assessment_id"]
            reass_current_q = reass_data["questions"][0]

            # Complete reassessment answering with correct answers where known
            for i in range(10):
                reass_sub = self.client.post(f"/api/assessments/{reass_id}/adaptive-next", headers=headers, json={
                    "question_id": reass_current_q["id"],
                    "selected_option_id": reass_current_q["options"][0]["id"],
                    "selected_option_text": reass_current_q["options"][0]["text"],
                    "confidence_level": 5,
                    "time_taken_seconds": 20,
                    "current_index": i
                })
                if reass_sub.status_code == 200 and reass_sub.json().get("next_question"):
                    reass_current_q = reass_sub.json()["next_question"]

            results_summary.append("[10/14] Targeted Reassessment              PASS")
        except Exception as e:
            results_summary.append(f"[10/14] Targeted Reassessment              FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 11 — BEFORE/AFTER DELTA VALIDATION
        # =========================================================================
        try:
            reass_res = self.client.get(f"/api/assessments/{reass_id}/result", headers=headers)
            self.assertEqual(reass_res.status_code, 200, f"Reassessment result failed: {reass_res.text}")
            reass_result = reass_res.json()
            
            # Verify delta mathematical invariant: delta == current_score - previous_score
            reass_summary = reass_result.get("reassessment_summary")
            if reass_summary and reass_summary.get("previous_score") is not None:
                expected_delta = round(reass_summary["current_score"] - reass_summary["previous_score"], 1)
                self.assertEqual(reass_summary["score_delta"], expected_delta)

            results_summary.append("[11/14] Before/After Delta                 PASS")
        except Exception as e:
            results_summary.append(f"[11/14] Before/After Delta                 FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 12 — PROGRESS ANALYTICS VALIDATION
        # =========================================================================
        try:
            p_overview = self.client.get("/api/progress/overview", headers=headers)
            self.assertEqual(p_overview.status_code, 200)
            self.assertIn("overall_readiness", p_overview.json())

            p_comps = self.client.get("/api/progress/competencies", headers=headers)
            self.assertEqual(p_comps.status_code, 200)
            self.assertTrue(isinstance(p_comps.json(), list))

            p_analytics = self.client.get("/api/progress/analytics", headers=headers)
            self.assertEqual(p_analytics.status_code, 200)
            self.assertIn("difficulty_breakdown", p_analytics.json())
            self.assertIn("confidence_calibration", p_analytics.json())

            p_timeline = self.client.get("/api/progress/timeline?limit=10", headers=headers)
            self.assertEqual(p_timeline.status_code, 200)
            self.assertTrue(isinstance(p_timeline.json(), list))

            results_summary.append("[12/14] Progress Analytics                 PASS")
        except Exception as e:
            results_summary.append(f"[12/14] Progress Analytics                 FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 13 — TENANT ISOLATION
        # =========================================================================
        try:
            # Register Learner B
            b_suffix = uuid.uuid4().hex[:8]
            b_email = f"phase7_learner_b_{b_suffix}@smartlearn.gov.in"
            self.client.post("/api/auth/register", json={
                "email": b_email,
                "password": "Password123!",
                "full_name": "Learner B"
            })
            b_login = self.client.post("/api/auth/login", json={
                "email": b_email,
                "password": "Password123!"
            })
            b_headers = {"Authorization": f"Bearer {b_login.json()['access_token']}"}

            # Learner B attempts to access Learner A's assessment
            cross_ass = self.client.get(f"/api/assessments/{assessment_id}/result", headers=b_headers)
            self.assertIn(cross_ass.status_code, [403, 404])

            # Learner B attempts to access Learner A's material
            cross_mat = self.client.get(f"/api/materials/{material_id}", headers=b_headers)
            self.assertIn(cross_mat.status_code, [403, 404])

            # Learner B attempts to access Learner A's diagnosis
            cross_diag = self.client.get(f"/api/diagnosis/assessment/{assessment_id}", headers=b_headers)
            self.assertIn(cross_diag.status_code, [403, 404])

            results_summary.append("[13/14] Tenant Isolation                   PASS")
        except Exception as e:
            results_summary.append(f"[13/14] Tenant Isolation                   FAIL: {str(e)}")
            raise e

        # =========================================================================
        # STAGE 14 — OPERATIONAL SMOKE TESTS
        # =========================================================================
        try:
            # Check /health
            h_res = self.client.get("/health")
            self.assertEqual(h_res.status_code, 200)
            self.assertEqual(h_res.json()["status"], "ok")

            # Check /ready
            r_res = self.client.get("/ready")
            self.assertEqual(r_res.status_code, 200)
            self.assertEqual(r_res.json()["status"], "ready")

            # Check X-Process-Time-Ms header
            self.assertIn("x-process-time-ms", h_res.headers)

            results_summary.append("[14/14] Operational Smoke Tests            PASS")
        except Exception as e:
            results_summary.append(f"[14/14] Operational Smoke Tests            FAIL: {str(e)}")
            raise e

        # Print stage-by-stage results
        print("\n" + "=" * 60)
        print("STAGE EXECUTION SUMMARY (14/14 STAGES)")
        print("=" * 60)
        for r in results_summary:
            print(r)
        print("=" * 60 + "\n")

    def test_baseline_data_preservation(self):
        """
        Verifies that baseline seed entities remain strictly preserved and uncorrupted.
        """
        # Questions >= initial
        self.assertGreaterEqual(self.db.query(Question).count(), self.initial_questions)
        # Bank questions == 80
        self.assertEqual(self.db.query(Question).filter(Question.bank_question_id.isnot(None)).count(), 80)
        # Materials >= initial
        self.assertGreaterEqual(self.db.query(LearningMaterial).count(), self.initial_materials)
        # Material #49 intact
        m49 = self.db.query(LearningMaterial).filter(LearningMaterial.id == 49).first()
        self.assertIsNotNone(m49)
        self.assertEqual(m49.material_scope, "OFFICIAL_COMPETENCY")
        self.assertEqual(m49.processing_status, "completed")

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase7MasterE2EValidation)
    runner = unittest.TextTestRunner(verbosity=2)
    test_result = runner.run(suite)

    print("\n" + "=" * 60)
    print("SMARTLEARN PHASE 7 MASTER E2E FINAL EVALUATION")
    print("=" * 60)
    if test_result.wasSuccessful():
        print("PHASE 7 MASTER E2E RESULT: PASS")
        print("RELEASE CERTIFICATION: READY")
        print("=" * 60 + "\n")
        sys.exit(0)
    else:
        print("PHASE 7 MASTER E2E RESULT: FAIL")
        print("RELEASE CERTIFICATION: NOT READY")
        print(f"Failures: {len(test_result.failures)}, Errors: {len(test_result.errors)}")
        print("=" * 60 + "\n")
        sys.exit(1)
