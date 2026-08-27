import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ai.base import AIProvider
from config import settings
from ai.gemini_provider import GeminiProvider
from ai.openrouter_provider import OpenRouterProvider
from ai.mock_provider import MockProvider
from models.assessment import Question, QuestionOption
from models.competency import Competency, CompetencyTopic

logger = logging.getLogger(__name__)

class AIService:
    """
    Central AI Service abstraction for SmartLearn.
    Handles source-grounded question generation, duplicate prevention,
    question validation, and deterministic gap diagnosis explanation.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self._provider = None
        self._current_provider_type = None

    @property
    def provider(self) -> AIProvider:
        current_provider_name = (settings.AI_PROVIDER or "mock").lower()
        if self._provider is None or self._current_provider_type != current_provider_name:
            self._current_provider_type = current_provider_name
            if current_provider_name == "gemini":
                self._provider = GeminiProvider()
            elif current_provider_name == "openrouter":
                self._provider = OpenRouterProvider()
            else:
                self._provider = MockProvider()
        return self._provider

    def _parse_json(self, text: str) -> Any:
        """Robust JSON extraction from LLM markdown fences and unstructured text."""
        try:
            cleaned = (text or "").strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json", 1)[1]
            elif "```" in cleaned:
                cleaned = cleaned.split("```", 1)[1]
            if "```" in cleaned:
                cleaned = cleaned.split("```", 1)[0]
            cleaned = cleaned.strip()

            start_brace = cleaned.find("{")
            start_bracket = cleaned.find("[")
            if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
                end_brace = cleaned.rfind("}")
                if end_brace != -1:
                    cleaned = cleaned[start_brace:end_brace+1]
            elif start_bracket != -1:
                end_bracket = cleaned.rfind("]")
                if end_bracket != -1:
                    cleaned = cleaned[start_bracket:end_bracket+1]

            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON response: {e}")
            return {}

    def generate_question(
        self,
        competency_name: str,
        topic_name: str,
        difficulty: str = "2",
        source_context: Optional[str] = None,
        avoid_concepts: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generates a single calibrated multiple choice question strictly grounded in source context.
        """
        avoid_clause = f"Avoid repeating these concepts/questions: {', '.join(avoid_concepts)}" if avoid_concepts else ""
        source_clause = f"Grounded strictly in this official learning material / syllabus:\n{source_context[:2000]}" if source_context else "Grounded in official MoSPI government statistical standards."

        system_prompt = (
            "You are an expert psychometrician and statistical educator for India's Official Statistical System. "
            "Generate calibrated, practical multiple choice questions without hallucinations or ungrounded facts. "
            "Return valid JSON only matching the schema."
        )

        prompt = f"""
Generate 1 practical Multiple Choice Question (MCQ) for official statistical officers.
- Competency: {competency_name}
- Subtopic: {topic_name}
- Difficulty: {difficulty} (1=Easy/Foundational, 2=Applied/Intermediate, 3=Hard/Policy Analysis)
- {avoid_clause}
- {source_clause}

Required Output JSON Schema:
{{
  "question_text": "Clear, non-trivial question scenario",
  "options": [
    {{"text": "Correct Option Text", "is_correct": true, "order": 1}},
    {{"text": "Plausible Distractor 1", "is_correct": false, "order": 2}},
    {{"text": "Plausible Distractor 2", "is_correct": false, "order": 3}},
    {{"text": "Plausible Distractor 3", "is_correct": false, "order": 4}}
  ],
  "correct_answer": "Exact text of the correct option",
  "explanation": "Detailed statistical rationale explaining why the correct answer is valid",
  "competency": "{competency_name}",
  "topic": "{topic_name}",
  "difficulty": "{difficulty}",
  "cognitive_level": "understand|apply|analyze",
  "concept": "Specific concept tested",
  "source_reference": "Specific section/chapter citation"
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.3)
        res = self._parse_json(response_text)
        if isinstance(res, list) and len(res) > 0:
            return res[0]
        elif isinstance(res, dict):
            return res
        return {}

    def generate_mcqs_from_material(
        self,
        content_text: str,
        competency_name: str,
        topic_name: Optional[str] = None,
        count: int = 3,
        difficulty: str = "2"
    ) -> List[Dict[str, Any]]:
        """
        Generates multiple MCQs grounded in an uploaded training PDF or document.
        """
        system_prompt = (
            "You are an AI assessment generator for India's Official Statistical System. "
            "Extract concepts from the provided text and formulate valid MCQs. "
            "Return a JSON array of questions only."
        )

        prompt = f"""
Generate {count} multiple choice questions strictly based on the following text:
---
{content_text[:3500]}
---
Target Competency: {competency_name}
Target Topic: {topic_name or 'General Topic'}
Difficulty: {difficulty}

Return a JSON array of questions where each object has:
- question_text: string
- options: array of 4 items with text, is_correct (boolean), order (integer 1-4)
- correct_answer: string matching the text of the single correct option
- explanation: string
- cognitive_level: 'understand' | 'apply' | 'analyze'
- source_reference: excerpt or citation
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.3)
        res = self._parse_json(response_text)
        if isinstance(res, list):
            return res
        elif isinstance(res, dict) and "questions" in res:
            return res["questions"]
        elif isinstance(res, dict) and "question_text" in res:
            return [res]
        return []

    def diagnose_gap(self, evidence_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Explains diagnostic evidence and root causes without modifying numerical scores.
        """
        system_prompt = (
            "You are an AI Competency Intelligence Diagnostician for India's Statistical Cadre. "
            "Analyze assessment telemetry and explain the root cause of competency gaps. "
            "Do NOT invent new numerical scores. Return structured JSON only."
        )

        prompt = f"""
Analyze this structured assessment evidence:
- Role: {evidence_data.get('role', 'Statistical Officer')}
- Competency: {evidence_data.get('competency_name', 'Sampling Techniques')}
- Current Evidence Score: {evidence_data.get('current_score', 48.0)}%
- Required Benchmark Target: {evidence_data.get('target_score', 70.0)}%
- Deficit Gap: -{evidence_data.get('gap', 22.0)}%
- Weak Subtopics: {evidence_data.get('weak_topics', ['Stratified Sampling'])}
- Missed Concepts: {evidence_data.get('missed_concepts', [])}

Return JSON matching:
{{
  "primary_gap": "Brief name of the primary bottleneck",
  "root_cause": "Specific conceptual reason why the officer struggled",
  "explanation": "2-3 sentence transparent diagnostic summary for the officer",
  "recommended_focus": "Specific topic/module recommended to close the gap",
  "confidence": 88.0
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.2)
        res = self._parse_json(response_text)
        if not isinstance(res, dict) or "primary_gap" not in res:
            return {
                "primary_gap": f"{evidence_data.get('competency_name', 'Competency')} Gap",
                "root_cause": f"Needs further practice on {', '.join(evidence_data.get('weak_topics', ['key concepts']))}",
                "explanation": f"Your verified score of {evidence_data.get('current_score')}% is below the {evidence_data.get('target_score')}% role benchmark.",
                "recommended_focus": f"Review accredited iGOT modules on {evidence_data.get('competency_name')}.",
                "confidence": 85.0
            }
        return res

    def summarize_material(self, text: str) -> Dict[str, Any]:
        """Summarizes uploaded document and identifies mapped competency domains."""
        system_prompt = (
            "You are an AI curriculum analyzer for India's Official Statistical System. "
            "Analyze training material and extract key topics and competency mappings. "
            "Return valid JSON only matching the schema."
        )
        prompt = f"""
Summarize this government statistical training material and extract key topics and competency domain mappings:
---
{text[:3000]}
---

Required JSON Output Schema:
{{
  "title": "Document title or main subject",
  "topics": ["Topic 1", "Topic 2", "Topic 3"],
  "competency_mappings": {{
    "Statistical Methods": 0.85,
    "Sampling Techniques": 0.70
  }},
  "summary": "2-3 sentence executive summary of the content"
}}
"""
        response_text = self.provider.generate(prompt, system_prompt=system_prompt, temperature=0.2)
        res = self._parse_json(response_text)
        if not isinstance(res, dict) or not res.get("topics"):
            return {
                "title": "Statistical Training Material",
                "topics": ["Statistical Analysis", "Data Collection"],
                "competency_mappings": {"Statistical Methods": 0.8},
                "summary": text[:200] if text else "Statistical training documentation."
            }
        return res

    @staticmethod
    def validate_question(q_data: Dict[str, Any]) -> Tuple_Validation:
        """
        Validates question schema:
        - Exactly 4 options
        - Exactly 1 option with is_correct=True
        - correct_answer matches one of the options
        - Question text is at least 15 characters
        """
        if not q_data or not isinstance(q_data, dict):
            return False, "Empty or invalid question object"

        q_text = q_data.get("question_text") or q_data.get("text")
        if not q_text or len(str(q_text).strip()) < 15:
            return False, "Question text is too short or missing"

        options = q_data.get("options")
        if not options or not isinstance(options, list) or len(options) != 4:
            return False, f"Question must have exactly 4 options, found {len(options) if isinstance(options, list) else 0}"

        correct_count = sum(1 for o in options if o.get("is_correct") is True)
        if correct_count != 1:
            return False, f"Question must have exactly 1 correct option, found {correct_count}"

        correct_texts = [o.get("text") for o in options if o.get("is_correct") is True]
        correct_answer = q_data.get("correct_answer")
        if correct_answer and correct_answer not in [o.get("text") for o in options]:
            return False, "correct_answer field does not match any of the 4 option texts"

        return True, "Valid"

    @classmethod
    def validate_and_store_question(
        cls, 
        db: Session, 
        q_data: Dict[str, Any], 
        competency_id: int, 
        topic_id: Optional[int] = None,
        source_material_id: Optional[int] = None,
        created_by_user_id: Optional[int] = None
    ) -> Optional[Question]:
        """
        Validates question schema, checks for duplicates, and saves to database.
        Returns stored Question instance or None if invalid/duplicate.
        """
        is_valid, reason = cls.validate_question(q_data)
        if not is_valid:
            logger.warning(f"Question rejected by validator: {reason}")
            return None

        q_text = (q_data.get("question_text") or q_data.get("text", "")).strip()

        # 1. Duplicate Prevention: Check exact or near match in Question table
        existing = db.query(Question).filter(
            Question.competency_id == competency_id,
            Question.question_text.ilike(f"%{q_text[:40]}%")
        ).first()

        if existing:
            logger.info(f"Duplicate question prevented: matches #{existing.id}")
            return existing

        # 2. Store Question
        diff_str = str(q_data.get("difficulty", "2"))
        cog_level = q_data.get("cognitive_level", "understand")
        explanation = q_data.get("explanation", "Verified statistical solution.")
        correct_ans = q_data.get("correct_answer") or next((o["text"] for o in q_data["options"] if o.get("is_correct")), "")

        question = Question(
            competency_id=competency_id,
            topic_id=topic_id,
            difficulty=diff_str,
            question_text=q_text,
            text=q_text,
            correct_answer=correct_ans,
            explanation=explanation,
            cognitive_level=cog_level,
            source_material_id=source_material_id,
            is_ai_generated=True,
            source="ai_generated",
            status="approved",
            created_by=created_by_user_id
        )
        db.add(question)
        db.flush()

        # Store 4 options
        for idx, opt_item in enumerate(q_data["options"]):
            opt = QuestionOption(
                question_id=question.id,
                text=opt_item["text"],
                is_correct=bool(opt_item.get("is_correct", False)),
                order=opt_item.get("order", idx + 1)
            )
            db.add(opt)

        db.commit()
        db.refresh(question)
        return question

# Type alias helper
Tuple_Validation = tuple[bool, str]
