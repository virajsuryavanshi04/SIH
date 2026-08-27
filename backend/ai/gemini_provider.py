from ai.base import AIProvider
from config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiProvider(AIProvider):
    """
    Google Gemini Provider for SmartLearn AI Service.
    Uses official genai client with fallback to mock provider for offline development.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY

    def generate(self, prompt: str, system_prompt: str = '', temperature: float = 0.7, max_tokens: int = 2000) -> str:
        if not self.api_key:
            from ai.mock_provider import MockProvider
            return MockProvider().generate(prompt, system_prompt, temperature, max_tokens)

        try:
            from google import genai
            client = genai.Client(api_key=self.api_key)
            full_prompt = f"System: {system_prompt}\nUser: {prompt}" if system_prompt else prompt
            model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
            )
            return response.text
        except Exception as e:
            logger.warning(f"Gemini API error ({str(e)}), falling back to offline provider.")
            from ai.mock_provider import MockProvider
            return MockProvider().generate(prompt, system_prompt, temperature, max_tokens)
