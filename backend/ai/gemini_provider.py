from ai.base import AIProvider
from google import genai
from config import settings

class GeminiProvider(AIProvider):
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
    def generate(self, prompt: str, system_prompt: str = '', temperature: float = 0.7, max_tokens: int = 2000) -> str:
        if not settings.GEMINI_API_KEY:
            return "{}"
        try:
            full_prompt = f"System: {system_prompt}\nUser: {prompt}"
            response = self.client.models.generate_content(
                model='gemini-2.0-flash-001',
                contents=full_prompt,
            )
            return response.text
        except Exception:
            return "{}"
