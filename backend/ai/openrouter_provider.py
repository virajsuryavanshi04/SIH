from ai.base import AIProvider
import httpx
import logging
from config import settings

logger = logging.getLogger(__name__)

class OpenRouterProvider(AIProvider):
    def generate(self, prompt: str, system_prompt: str = '', temperature: float = 0.7, max_tokens: int = 2000) -> str:
        if not settings.OPENROUTER_API_KEY:
            from ai.mock_provider import MockProvider
            return MockProvider().generate(prompt, system_prompt, temperature, max_tokens)
        try:
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://smartlearn.gov.in",
                "X-Title": "SmartLearn",
            }
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            data = {
                "model": settings.OPENROUTER_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            timeout_cfg = httpx.Timeout(60.0, connect=15.0)
            response = httpx.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data, timeout=timeout_cfg)
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            else:
                logger.warning(f"OpenRouter API returned status {response.status_code}, falling back to offline provider.")
                from ai.mock_provider import MockProvider
                return MockProvider().generate(prompt, system_prompt, temperature, max_tokens)
        except Exception as e:
            logger.warning(f"OpenRouter API error ({str(e)}), falling back to offline provider.")
            from ai.mock_provider import MockProvider
            return MockProvider().generate(prompt, system_prompt, temperature, max_tokens)
