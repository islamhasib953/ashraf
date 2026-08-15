"""
Core application configuration.
All settings are loaded from environment variables (via .env file).
"""
from pydantic_settings import BaseSettings
from typing import List
import secrets


class Settings(BaseSettings):
    # ─── App ────────────────────────────────────────────
    APP_NAME: str = "AgentFlow"
    APP_ENV: str = "development"
    API_V1_STR: str = "/api/v1"

    # ─── Security ────────────────────────────────────────
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # Fernet key for encrypting stored API keys/tokens
    FERNET_KEY: str = ""

    # ─── Database ────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./agent_saas.db"

    # ─── Redis ───────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ─── CORS ────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        defaults = [self.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"]
        configured = [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return list(dict.fromkeys(origin.rstrip("/") for origin in [*defaults, *configured]))

    # ─── Optional LLM Keys (defaults; users override in UI) ──
    OPENAI_API_KEY: str = ""

    # ─── Email ───────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587

    # ─── Local AI (HuggingFace) ───────────────────────────
    HF_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHROMA_DB_PATH: str = "./chroma_db"

    # ─── Rate Limiting ───────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
