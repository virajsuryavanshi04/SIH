import unittest
import sys
import os
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

from database import SessionLocal
from models.user import User
from models.role import Role
from models.competency import Competency, RoleCompetency
from models.course import Course, CourseCompetency
from models.assessment import Assessment, Question, AssessmentAnswer
from models.user_competency import CompetencyScore, UserCompetency
from models.recommendation import AIDiagnosis
from models.material import LearningMaterial
from services.recommendation_service import RecommendationService
from services.igot_service import MockIGOTService

class TestIGOTCatalogueIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.test_user = cls.db.query(User).filter(User.email == 'statistical.officer@mospi.gov.in').first()
        if not cls.test_user:
            cls.test_user = cls.db.query(User).first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_total_and_active_courses_count(self):
        active_igot = self.db.query(Course).filter(Course.is_active == True, Course.is_igot == True).count()
        self.assertEqual(active_igot, 60, f'Expected 60 active iGOT courses, got {active_igot}')
        archived = self.db.query(Course).filter(Course.is_active == False).count()
        self.assertGreaterEqual(archived, 8, f'Expected at least 8 archived demo courses, got {archived}')

    def test_02_igot_identifiers_and_uniqueness(self):
        courses = self.db.query(Course).filter(Course.is_active == True, Course.is_igot == True).all()
        identifiers = [c.igot_identifier for c in courses]
        self.assertEqual(len(identifiers), 60)
        self.assertEqual(len(set(identifiers)), 60, 'iGOT identifiers must be strictly unique')
        for ident in identifiers:
            self.assertTrue(ident and ident.startswith('do_'), f'Identifier {ident} must start with do_')

    def test_03_roles_count_and_names(self):
        roles = self.db.query(Role).all()
        self.assertGreaterEqual(len(roles), 12, f'Expected at least 12 roles, got {len(roles)}')
        role_names = {r.name for r in roles}
        expected_sample = [
            'Statistical Officer', 'Data Analyst', 'Data Management Officer',
            'Field & Geospatial Data Officer', 'Research Officer', 'Policy & Planning Officer',
            'Monitoring & Evaluation Officer', 'Programme & Project Officer',
            'Data Quality & Process Improvement Officer', 'Statistical Reporting & Communication Officer',
            'Digital Systems & Data Protection Officer', 'Finance, Accounts & Procurement Officer'
        ]
        for name in expected_sample:
            self.assertIn(name, role_names, f'Role {name} must exist in the database')

    def test_04_competencies_count_and_domains(self):
        comps = self.db.query(Competency).all()
        self.assertGreaterEqual(len(comps), 20, f'Expected at least 20 competencies, got {len(comps)}')
        comp_names = {c.name for c in comps}
        expected_sample = [
            'Statistical Literacy & Reasoning', 'Statistical & Data Analysis', 'Data Visualization',
            'R Programming', 'Spreadsheet Analytics', 'Survey Operations & Data Collection',
            'Research Methods', 'Policy Analytics & Evidence Use', 'Database Management',
            'Geospatial Analysis (GIS)', 'Monitoring & Evaluation', 'Project & Programme Management',
            'Data Quality & Continuous Improvement', 'Public Governance, Service Design & Change',
            'Government Financial Management', 'National Accounts & Official Statistics',
            'Public Procurement & Digital Marketplace', 'Technical & Report Writing',
            'Stakeholder Communication & Presentation', 'Digital Government, Cybersecurity & Data Protection'
        ]
        for name in expected_sample:
            self.assertIn(name, comp_names, f'Competency {name} must exist in database')

    def test_05_mapping_provenance_and_confidence(self):
        course_comps = self.db.query(CourseCompetency).join(Course, CourseCompetency.course_id == Course.id).filter(Course.is_active == True).all()
        self.assertGreaterEqual(len(course_comps), 60)
        for cc in course_comps:
            self.assertEqual(cc.mapping_source, 'smartlearn_inferred')
            self.assertIn(cc.confidence, ['High', 'Medium', 'Low'])
            self.assertTrue(cc.is_primary)

    def test_06_verified_external_urls(self):
        courses = self.db.query(Course).filter(Course.is_active == True, Course.is_igot == True).all()
        for c in courses:
            self.assertEqual(c.external_url, 'https://igotkarmayogi.gov.in/')
            self.assertFalse('/app/toc/do_' in (c.external_url or ''), 'Must not use fabricated URL paths')

    def test_07_duration_telemetry(self):
        courses = self.db.query(Course).filter(Course.is_active == True, Course.is_igot == True).all()
        for c in courses:
            self.assertIsNotNone(c.duration_seconds)
            self.assertIsNotNone(c.duration_display)
            self.assertTrue(c.duration_hours > 0)

    def test_08_recommendation_service_ranking(self):
        self.assertIsNotNone(self.test_user, 'Test user required')
        recs = RecommendationService.get_personalized_recommendations(self.db, self.test_user, limit=10)
        self.assertTrue(len(recs) > 0, 'Must return recommendations')
        self.assertLessEqual(len(recs), 10)
        top = recs[0]
        self.assertIn('match_percent', top)
        self.assertIn('explanation', top)
        self.assertIn('igot_identifier', top)
        self.assertIn('external_url', top)
        self.assertEqual(top['external_url'], 'https://igotkarmayogi.gov.in/')

    def test_09_next_learning_action_compatibility(self):
        action = RecommendationService.get_next_learning_action(self.db, self.test_user)
        self.assertIsNotNone(action)
        self.assertIn('action_type', action)
        self.assertIn('priority', action)
        self.assertIn('resource', action)

    def test_10_historical_data_preservation(self):
        self.assertGreaterEqual(self.db.query(User).count(), 170)
        self.assertGreaterEqual(self.db.query(Question).count(), 200)
        self.assertGreaterEqual(self.db.query(Assessment).count(), 700)
        self.assertGreaterEqual(self.db.query(AssessmentAnswer).count(), 3000)
        self.assertGreaterEqual(self.db.query(CompetencyScore).count(), 800)
        self.assertGreaterEqual(self.db.query(UserCompetency).count(), 800)
        self.assertGreaterEqual(self.db.query(AIDiagnosis).count(), 100)
        self.assertGreaterEqual(self.db.query(LearningMaterial).count(), 400)

    def test_11_role_competency_cardinality_and_limit(self):
        """Verify all 12 roles have <= 8 essential competencies for dashboard clarity."""
        roles = self.db.query(Role).all()
        for r in roles:
            rcs = self.db.query(RoleCompetency).filter(RoleCompetency.role_id == r.id).all()
            self.assertGreater(len(rcs), 0, f"Role {r.name} must have at least 1 competency")
            self.assertLessEqual(len(rcs), 8, f"Role {r.name} must have at most 8 competencies, found {len(rcs)}")

    def test_12_learning_path_igot_catalogue_unification(self):
        """Verify generated and retrieved Learning Path items are 100% active iGOT courses."""
        self.assertIsNotNone(self.test_user, 'Test user required')
        path = RecommendationService.generate_learning_path(self.db, self.test_user)
        self.assertIsNotNone(path)
        self.assertTrue(path.is_active)
        self.assertTrue(len(path.items) > 0)

        master_comps = {c.id: c.name for c in self.db.query(Competency).all()}

        for item in path.items:
            # 1. Course exists and is active iGOT
            course = self.db.query(Course).filter(Course.id == item.reference_id).first()
            self.assertIsNotNone(course, f"Course ID {item.reference_id} must exist")
            self.assertTrue(course.is_active, f"Course {course.title} must be active")
            self.assertTrue(course.is_igot, f"Course {course.title} must have is_igot=True")
            self.assertTrue(course.igot_identifier and course.igot_identifier.startswith('do_'), 
                            f"Course {course.title} must have valid do_ iGOT identifier")
            self.assertEqual(course.external_url, 'https://igotkarmayogi.gov.in/')
            
            # 2. Competency is within 20 master competencies
            if item.competency_id:
                self.assertIn(item.competency_id, master_comps)

    def test_13_no_stale_competencies_or_demo_courses_in_path(self):
        """Verify stale demo course names and obsolete competency names are absent."""
        self.assertIsNotNone(self.test_user)
        path = RecommendationService.generate_learning_path(self.db, self.test_user)
        
        stale_course_titles = {
            'NSS Stratification Lab',
            'Survey Sampling Fundamentals & Design',
            'Variance Estimation Basics',
            'Field Validation Protocols'
        }
        stale_competency_names = {'Data Interpretation', 'Sampling Techniques'}

        for item in path.items:
            self.assertNotIn(item.title, stale_course_titles, f"Learning path contains obsolete demo title: {item.title}")
            if item.competency:
                self.assertNotIn(item.competency.name, stale_competency_names)

if __name__ == '__main__':
    unittest.main()
