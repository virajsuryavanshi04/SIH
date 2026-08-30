from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from database import get_db
from auth.dependencies import get_current_user
from models.user import User
from services.recommendation_service import RecommendationService
from schemas.recommendation import NextActionResponse, CourseRecommendationResponse

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.get("/next-action", response_model=NextActionResponse)
def get_next_action(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the single most useful personalized next learning action for the authenticated learner.
    Evaluates:
    - Competency gaps & performance (70% standard target)
    - In-progress learning path milestones (CONTINUE_LEARNING)
    - Available learner-owned completed learning materials & study content (Notes, Flashcards, Mind Map, Quiz)
    - Official / iGOT course recommendations
    - Baseline diagnostic assessment needs
    """
    return RecommendationService.get_next_learning_action(db, current_user)

@router.get("/", response_model=List[CourseRecommendationResponse])
def get_recommendations(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns explainable course recommendations ranked by gap relevance, role benchmarks, and subtopic matching.
    """
    return RecommendationService.get_personalized_recommendations(db, current_user, limit=limit)
