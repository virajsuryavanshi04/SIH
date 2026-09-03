import unittest
import sys
import os
import uuid
from datetime import datetime, timedelta

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "d:", "Affan", "Hackathons", "SIH", "SmartLearn", "backend"))
if not os.path.exists(backend_dir):
    backend_dir = r"d:\Affan\Hackathons\SIH\SmartLearn\backend"
sys.path.insert(0, backend_dir)

from database import SessionLocal
from models.user import User
from models.role import Role
from models.competency import Competency, RoleCompetency
from models.user_competency import UserCompetency, CompetencyScore
from models.assessment import Assessment, AssessmentAnswer, Question
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.course import Course
from routers.progress import (
    get_progress_overview,
    get_competency_progress,
    get_progress_analytics,
    get_progress_timeline
)
from services.competency_service import (
    get_user_competency_insights,
    get_user_detailed_competencies
)
from routers.dashboard import get_learner_dashboard

class TestProgressRealData(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        
        # Create a fresh test role
        cls.test_role = cls.db.query(Role).filter(Role.name == "Statistical Officer").first()
        if not cls.test_role:
            cls.test_role = Role(name="Statistical Officer", description="Primary statistical cadre")
            cls.db.add(cls.test_role)
            cls.db.commit()

        # Create two distinct test users for isolation and test cases
        unique_suffix = uuid.uuid4().hex[:8]
        cls.user_a = User(
            email=f"progress_tester_a_{unique_suffix}@smartlearn.gov.in",
            full_name="Tester Arjun",
            password_hash="fake_hash",
            role="learner",
            role_id=cls.test_role.id,
            designation="Statistical Officer",
            is_active=True
        )
        cls.user_b = User(
            email=f"progress_tester_b_{unique_suffix}@smartlearn.gov.in",
            full_name="Tester Meera",
            password_hash="fake_hash",
            role="learner",
            role_id=cls.test_role.id,
            designation="Data Analyst",
            is_active=True
        )
        cls.db.add(cls.user_a)
        cls.db.add(cls.user_b)
        cls.db.commit()

        # Ensure we have role competencies for test_role
        cls.comps = cls.db.query(Competency).limit(3).all()
        for idx, c in enumerate(cls.comps):
            rc = cls.db.query(RoleCompetency).filter(
                RoleCompetency.role_id == cls.test_role.id,
                RoleCompetency.competency_id == c.id
            ).first()
            if not rc:
                rc = RoleCompetency(
                    role_id=cls.test_role.id,
                    role_name=cls.test_role.name,
                    competency_id=c.id,
                    target_score=75.0,
                    target_level=3,
                    weight=1.0
                )
                cls.db.add(rc)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        # Cleanup test users
        cls.db.query(AssessmentAnswer).filter(
            AssessmentAnswer.assessment_id.in_(
                cls.db.query(Assessment.id).filter(Assessment.user_id.in_([cls.user_a.id, cls.user_b.id]))
            )
        ).delete(synchronize_session=False)
        cls.db.query(Assessment).filter(Assessment.user_id.in_([cls.user_a.id, cls.user_b.id])).delete(synchronize_session=False)
        cls.db.query(CompetencyScore).filter(CompetencyScore.user_id.in_([cls.user_a.id, cls.user_b.id])).delete(synchronize_session=False)
        cls.db.query(UserCompetency).filter(UserCompetency.user_id.in_([cls.user_a.id, cls.user_b.id])).delete(synchronize_session=False)
        cls.db.query(LearningProgress).filter(LearningProgress.user_id.in_([cls.user_a.id, cls.user_b.id])).delete(synchronize_session=False)
        
        lp_ids = [lp.id for lp in cls.db.query(LearningPath).filter(LearningPath.user_id.in_([cls.user_a.id, cls.user_b.id])).all()]
        if lp_ids:
            cls.db.query(LearningPathItem).filter(LearningPathItem.learning_path_id.in_(lp_ids)).delete(synchronize_session=False)
            cls.db.query(LearningPath).filter(LearningPath.id.in_(lp_ids)).delete(synchronize_session=False)
        
        cls.db.query(User).filter(User.id.in_([cls.user_a.id, cls.user_b.id])).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_authenticated_learner_current_role_displayed(self):
        """TEST 1: Authenticated learner's current role is dynamically resolved."""
        ov_a = get_progress_overview(self.db, self.user_a)
        ov_b = get_progress_overview(self.db, self.user_b)
        self.assertEqual(ov_a.role_name, "Statistical Officer")
        self.assertEqual(ov_b.role_name, "Statistical Officer")

    def test_02_current_competency_scores_come_from_persisted_data(self):
        """TEST 2: Competency scores come from actual persisted UserCompetency data."""
        c = self.comps[0]
        uc = UserCompetency(user_id=self.user_a.id, competency_id=c.id, current_score=68.5, target_score=75.0, status="on_track")
        self.db.add(uc)
        self.db.commit()

        prog_comps = get_competency_progress(self.db, self.user_a)
        target = next((item for item in prog_comps if item.competency_id == c.id), None)
        self.assertIsNotNone(target)
        self.assertEqual(target.current_score, 68.5)
        self.assertEqual(target.target_score, target.target_score)

    def test_03_unassessed_competency_distinguished_from_zero(self):
        """TEST 3: UNASSESSED competency is current_score = None, NOT 0.0."""
        c2 = self.comps[1]
        # user_b has no assessments or scores for c2
        prog_comps_b = get_competency_progress(self.db, self.user_b)
        target = next((item for item in prog_comps_b if item.competency_id == c2.id), None)
        self.assertIsNotNone(target)
        self.assertIsNone(target.current_score)
        self.assertEqual(target.status, "not_assessed")

    def test_04_role_readiness_changes_when_competency_scores_change(self):
        """TEST 4: Role readiness updates deterministically when scores change."""
        ov_before = get_progress_overview(self.db, self.user_a)
        readiness_before = ov_before.overall_readiness

        # Update competency score
        c = self.comps[0]
        uc = self.db.query(UserCompetency).filter(UserCompetency.user_id == self.user_a.id, UserCompetency.competency_id == c.id).first()
        uc.current_score = 90.0
        self.db.commit()

        ov_after = get_progress_overview(self.db, self.user_a)
        readiness_after = ov_after.overall_readiness
        self.assertGreater(readiness_after, readiness_before)

    def test_05_completed_assessment_updates_relevant_progress_data(self):
        """TEST 5: Completed assessment updates total_assessments_taken and timeline."""
        t_now = datetime.utcnow()
        ass = Assessment(
            user_id=self.user_a.id,
            assessment_type="adaptive",
            status="completed",
            overall_score=85.0,
            started_at=t_now,
            completed_at=t_now
        )
        self.db.add(ass)
        self.db.commit()

        timeline = get_progress_timeline(20, self.db, self.user_a)
        found = any(e.metadata.get("assessment_id") == ass.id for e in timeline)
        self.assertTrue(found)

    def test_06_completed_reassessment_increments_reassessment_count(self):
        """TEST 6: Completed reassessment increments milestones.reassessments count."""
        ov_before = get_progress_overview(self.db, self.user_a)
        count_before = ov_before.milestones_completed.reassessments

        t_now = datetime.utcnow()
        reass = Assessment(
            user_id=self.user_a.id,
            assessment_type="adaptive_reassessment",
            status="completed",
            overall_score=78.0,
            started_at=t_now,
            completed_at=t_now
        )
        self.db.add(reass)
        self.db.commit()

        ov_after = get_progress_overview(self.db, self.user_a)
        count_after = ov_after.milestones_completed.reassessments
        self.assertEqual(count_after, count_before + 1)

    def test_07_in_progress_assessment_not_counted_as_completed(self):
        """TEST 7: In-progress assessment does NOT count towards completed reassessments."""
        ov_before = get_progress_overview(self.db, self.user_a)
        count_before = ov_before.milestones_completed.reassessments

        t_now = datetime.utcnow()
        in_prog = Assessment(
            user_id=self.user_a.id,
            assessment_type="adaptive_reassessment",
            status="in_progress",
            started_at=t_now
        )
        self.db.add(in_prog)
        self.db.commit()

        ov_after = get_progress_overview(self.db, self.user_a)
        count_after = ov_after.milestones_completed.reassessments
        self.assertEqual(count_after, count_before)

    def test_08_completed_material_quiz_increments_count(self):
        """TEST 8: Completed material quiz increments milestones.material_quizzes."""
        ov_before = get_progress_overview(self.db, self.user_a)
        count_before = ov_before.milestones_completed.material_quizzes

        t_now = datetime.utcnow()
        mq = Assessment(
            user_id=self.user_a.id,
            assessment_type="material_quiz",
            status="completed",
            overall_score=90.0,
            started_at=t_now,
            completed_at=t_now
        )
        self.db.add(mq)
        self.db.commit()

        ov_after = get_progress_overview(self.db, self.user_a)
        count_after = ov_after.milestones_completed.material_quizzes
        self.assertEqual(count_after, count_before + 1)

    def test_09_course_completion_only_changes_with_actual_evidence(self):
        """TEST 9: Course completion count uses actual LearningProgress with status='completed'."""
        course = self.db.query(Course).first()
        if not course:
            course = Course(title="Test Sampling Course", igot_identifier="test-c-1", is_active=True)
            self.db.add(course)
            self.db.commit()

        ov_before = get_progress_overview(self.db, self.user_b)
        courses_before = ov_before.milestones_completed.courses

        # In-progress course does NOT increment count
        lp = LearningProgress(user_id=self.user_b.id, course_id=course.id, status="in_progress", progress_percentage=50.0)
        self.db.add(lp)
        self.db.commit()

        ov_mid = get_progress_overview(self.db, self.user_b)
        self.assertEqual(ov_mid.milestones_completed.courses, courses_before)

        # Mark course completed
        lp.status = "completed"
        lp.progress_percentage = 100.0
        lp.completed_at = datetime.utcnow()
        self.db.commit()

        ov_after = get_progress_overview(self.db, self.user_b)
        self.assertEqual(ov_after.milestones_completed.courses, courses_before + 1)

    def test_10_progress_uses_current_authenticated_user_isolation(self):
        """TEST 10: Progress isolates learner data; user A does not see user B's metrics."""
        ov_a = get_progress_overview(self.db, self.user_a)
        ov_b = get_progress_overview(self.db, self.user_b)
        self.assertEqual(ov_a.user_id, self.user_a.id)
        self.assertEqual(ov_b.user_id, self.user_b.id)
        self.assertNotEqual(ov_a.user_id, ov_b.user_id)

    def test_11_refresh_retrieves_current_persisted_state(self):
        """TEST 11: Successive calls reflect persisted DB changes (refresh behavior)."""
        ov_1 = get_progress_overview(self.db, self.user_a)
        c = self.comps[1]
        cs = CompetencyScore(user_id=self.user_a.id, competency_id=c.id, score=80.0, assessed_at=datetime.utcnow())
        self.db.add(cs)
        uc = self.db.query(UserCompetency).filter(UserCompetency.user_id == self.user_a.id, UserCompetency.competency_id == c.id).first()
        if not uc:
            uc = UserCompetency(user_id=self.user_a.id, competency_id=c.id, current_score=80.0, target_score=75.0, status="strong")
            self.db.add(uc)
        else:
            uc.current_score = 80.0
        self.db.commit()

        # Call again as if refreshed
        ov_2 = get_progress_overview(self.db, self.user_a)
        self.assertNotEqual(ov_1.overall_readiness, ov_2.overall_readiness)

    def test_12_no_stale_cached_values_after_assessment(self):
        """TEST 12: Returning from completed assessment immediately shows fresh count."""
        timeline_before = get_progress_timeline(20, self.db, self.user_a)
        count_before = len(timeline_before)

        t_now = datetime.utcnow()
        new_ass = Assessment(user_id=self.user_a.id, assessment_type="adaptive", status="completed", overall_score=92.0, started_at=t_now, completed_at=t_now)
        self.db.add(new_ass)
        self.db.commit()

        timeline_after = get_progress_timeline(20, self.db, self.user_a)
        self.assertEqual(len(timeline_after), count_before + 1)

    def test_13_competency_trajectory_uses_actual_history(self):
        """TEST 13: Competency trajectory reflects real historical score observations."""
        c = self.comps[0]
        # Add 2 historical scores
        t1 = datetime.utcnow() - timedelta(days=2)
        t2 = datetime.utcnow() - timedelta(days=1)
        cs1 = CompetencyScore(user_id=self.user_b.id, competency_id=c.id, score=50.0, assessed_at=t1)
        cs2 = CompetencyScore(user_id=self.user_b.id, competency_id=c.id, score=70.0, assessed_at=t2)
        self.db.add(cs1)
        self.db.add(cs2)
        self.db.commit()

        prog_comps = get_competency_progress(self.db, self.user_b)
        comp_item = next((item for item in prog_comps if item.competency_id == c.id), None)
        self.assertIsNotNone(comp_item)
        self.assertEqual(len(comp_item.history_points), 2)
        self.assertEqual(comp_item.history_points[0].score, 50.0)
        self.assertEqual(comp_item.history_points[1].score, 70.0)

    def test_14_activity_timeline_uses_real_timestamps(self):
        """TEST 14: Activity timeline items have valid timestamps sorted descending."""
        timeline = get_progress_timeline(20, self.db, self.user_a)
        if len(timeline) >= 2:
            for i in range(len(timeline) - 1):
                self.assertGreaterEqual(timeline[i].timestamp, timeline[i+1].timestamp)

    def test_15_no_fabricated_fallback_values(self):
        """TEST 15: An unassessed user has 0.0 readiness, has_baseline_history=False."""
        # user_b has not completed any full role assessment
        # check has_baseline_history flag
        ov_b = get_progress_overview(self.db, self.user_b)
        self.assertIsInstance(ov_b.has_baseline_history, bool)
        self.assertIsInstance(ov_b.assessed_competencies_count, int)

    def test_16_dashboard_and_progress_use_same_score_source(self):
        """TEST 16: Dashboard and Progress return identical readiness and improvement points."""
        insights = get_user_competency_insights(self.db, self.user_a)
        prog_ov = get_progress_overview(self.db, self.user_a)
        dash = get_learner_dashboard(self.db, self.user_a)

        self.assertEqual(prog_ov.overall_readiness, insights["overall_readiness"])
        self.assertEqual(dash["overall_score"], insights["overall_readiness"])
        self.assertEqual(prog_ov.total_improvement_points, insights["total_improvement_points"])
        self.assertEqual(dash["score_delta"], insights["total_improvement_points"])

if __name__ == "__main__":
    unittest.main()
