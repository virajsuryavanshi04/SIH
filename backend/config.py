from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = "smartlearn-secret-key-change-in-production"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    AI_PROVIDER: str = "mock"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct"
    DATABASE_URL: str = "sqlite:///./smartlearn.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    MAX_UPLOAD_SIZE_MB: int = 20
    UPLOAD_DIR: str = "uploads"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["http://localhost:5173", "http://localhost:3000"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    def validate_production_secrets(self) -> None:
        if self.ENVIRONMENT.lower() == "production":
            insecure_keys = ["", "smartlearn-secret-key-change-in-production", "secret", "changeme"]
            if not self.SECRET_KEY or self.SECRET_KEY.strip() in insecure_keys or len(self.SECRET_KEY) < 16:
                raise RuntimeError(
                    "FATAL: Production deployment requires an explicit, secure SECRET_KEY (minimum 16 characters)."
                )

settings = Settings()

