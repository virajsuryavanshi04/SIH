from models.role import Role
from models.department import Department
from models.user import User
from models.competency import Competency, CompetencyTopic, CompetencyDependency, RoleCompetency
from models.user_competency import UserCompetency, CompetencyScore
from models.assessment import Assessment, Question, QuestionOption, AssessmentAnswer, UserQuestionHistory
from models.course import Course, CourseCompetency
from models.learning_path import LearningPath, LearningPathItem, LearningProgress
from models.recommendation import AIRecommendation, AIDiagnosis
from models.material import LearningMaterial, GeneratedQuestion

__all__ = [
    "Role",
    "Department",
    "User",
    "Competency",
    "CompetencyTopic",
    "CompetencyDependency",
    "RoleCompetency",
    "UserCompetency",
    "CompetencyScore",
    "Assessment",
    "Question",
    "QuestionOption",
    "AssessmentAnswer",
    "UserQuestionHistory",
    "Course",
    "CourseCompetency",
    "LearningPath",
    "LearningPathItem",
    "LearningProgress",
    "AIRecommendation",
    "AIDiagnosis",
    "LearningMaterial",
    "GeneratedQuestion"
]
