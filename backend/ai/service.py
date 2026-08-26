import json
from ai.base import AIProvider
from config import settings
from ai.gemini_provider import GeminiProvider
from ai.openrouter_provider import OpenRouterProvider
from ai.mock_provider import MockProvider

class AIService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        if settings.AI_PROVIDER == "gemini":
            self.provider = GeminiProvider()
        elif settings.AI_PROVIDER == "openrouter":
            self.provider = OpenRouterProvider()
        else:
            self.provider = MockProvider()

    def _parse_json(self, text: str):
        try:
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception:
            return {}

    def analyze_competency(self, user_scores, role_requirements) -> dict:
        prompt = f"Analyze these scores: {user_scores} vs requirements: {role_requirements}"
        response = self.provider.generate(prompt)
        return self._parse_json(response)

    def generate_questions(self, text, count, difficulty, question_type, cognitive_level) -> list:
        prompt = f"Generate {count} {difficulty} {question_type} questions at {cognitive_level} level for: {text}"
        response = self.provider.generate(prompt)
        res = self._parse_json(response)
        if isinstance(res, list): return res
        return []

    def explain_gap(self, competency_name, user_data) -> str:
        prompt = f"Explain gap for {competency_name} based on {user_data}"
        response = self.provider.generate(prompt)
        res = self._parse_json(response)
        return res.get("explanation", "Review the basics.")

    def recommend_learning_path(self, gaps, available_courses) -> list:
        prompt = f"Recommend learning path for gaps {gaps} using courses {available_courses}"
        response = self.provider.generate(prompt)
        res = self._parse_json(response)
        if isinstance(res, list): return res
        return []

    def summarize_material(self, text) -> dict:
        prompt = f"Summarize this material: {text[:1000]}"
        response = self.provider.generate(prompt)
        return self._parse_json(response)
