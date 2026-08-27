from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models.course import Course, CourseCompetency
from models.competency import Competency, CompetencyTopic

class LearningResourceProvider(ABC):
    """
    Abstract interface for accredited learning content providers.
    Decouples SmartLearn core logic from iGOT or external LMS platforms.
    """

    @abstractmethod
    def get_courses(self, db: Session, limit: int = 50, offset: int = 0, resource_type: Optional[str] = None) -> List[Course]:
        pass

    @abstractmethod
    def get_course(self, db: Session, course_id: int) -> Optional[Course]:
        pass

    @abstractmethod
    def search_courses(
        self, 
        db: Session, 
        query: Optional[str] = None, 
        competency_id: Optional[int] = None, 
        topic_id: Optional[int] = None,
        difficulty: Optional[str] = None
    ) -> List[Course]:
        pass

    @abstractmethod
    def get_competency_resources(self, db: Session, competency_id: int, topic_id: Optional[int] = None) -> List[Course]:
        pass


class MockIGOTService(LearningResourceProvider):
    """
    Mock / Local implementation of the iGOT Karmayogi Learning Resource Provider.
    Queries curated accredited resources from the relational database.
    """

    def get_courses(self, db: Session, limit: int = 50, offset: int = 0, resource_type: Optional[str] = None) -> List[Course]:
        q = db.query(Course).filter(Course.is_active == True)
        if resource_type:
            q = q.filter(Course.resource_type == resource_type)
        return q.offset(offset).limit(limit).all()

    def get_course(self, db: Session, course_id: int) -> Optional[Course]:
        return db.query(Course).filter(Course.id == course_id, Course.is_active == True).first()

    def search_courses(
        self, 
        db: Session, 
        query: Optional[str] = None, 
        competency_id: Optional[int] = None, 
        topic_id: Optional[int] = None,
        difficulty: Optional[str] = None
    ) -> List[Course]:
        q = db.query(Course).filter(Course.is_active == True)
        if query:
            q = q.filter(Course.title.ilike(f"%{query}%") | Course.description.ilike(f"%{query}%"))
        if competency_id:
            q = q.filter(Course.competency_id == competency_id)
        if topic_id:
            q = q.filter(Course.topic_id == topic_id)
        if difficulty:
            q = q.filter(Course.difficulty == difficulty)
        return q.all()

    def get_competency_resources(self, db: Session, competency_id: int, topic_id: Optional[int] = None) -> List[Course]:
        q = db.query(Course).filter(
            Course.is_active == True,
            Course.competency_id == competency_id
        )
        if topic_id:
            q = q.filter(Course.topic_id == topic_id)
        return q.all()


class RealIGOTService(LearningResourceProvider):
    """
    Production iGOT Karmayogi REST API integration provider.
    Can be configured when live credentials/endpoints become available.
    """
    def __init__(self, api_base_url: str = "https://igot-api.gov.in", client_id: Optional[str] = None):
        self.api_base_url = api_base_url
        self.client_id = client_id

    def get_courses(self, db: Session, limit: int = 50, offset: int = 0, resource_type: Optional[str] = None) -> List[Course]:
        # In mock fallback during testing
        return MockIGOTService().get_courses(db, limit, offset, resource_type)

    def get_course(self, db: Session, course_id: int) -> Optional[Course]:
        return MockIGOTService().get_course(db, course_id)

    def search_courses(
        self, 
        db: Session, 
        query: Optional[str] = None, 
        competency_id: Optional[int] = None, 
        topic_id: Optional[int] = None,
        difficulty: Optional[str] = None
    ) -> List[Course]:
        return MockIGOTService().search_courses(db, query, competency_id, topic_id, difficulty)

    def get_competency_resources(self, db: Session, competency_id: int, topic_id: Optional[int] = None) -> List[Course]:
        return MockIGOTService().get_competency_resources(db, competency_id, topic_id)


def get_learning_resource_provider() -> LearningResourceProvider:
    """Factory returning the active learning resource provider."""
    return MockIGOTService()
