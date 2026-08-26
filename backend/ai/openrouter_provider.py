from ai.base import AIProvider
import httpx
from config import settings

class OpenRouterProvider(AIProvider):
    def generate(self, prompt: str, system_prompt: str = '', temperature: float = 0.7, max_tokens: int = 2000) -> str:
        if not settings.OPENROUTER_API_KEY:
            return "{}"
        try:
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            }
            data = {
                "model": settings.OPENROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            response = httpx.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data, timeout=30.0)
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            return "{}"
        except Exception:
            return "{}"
