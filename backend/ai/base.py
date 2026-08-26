class AIProvider:
    def generate(self, prompt: str, system_prompt: str = '', temperature: float = 0.7, max_tokens: int = 2000) -> str:
        raise NotImplementedError
