from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class AISettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Provider & Model Options
    AI_PROVIDER: str = "baseline" # baseline, openai, ollama, lmstudio
    AI_FALLBACK_PROVIDER: str = "baseline"
    AI_MODEL_NAME: str = "gpt-4o-mini"
    EMBEDDING_PROVIDER: str = "lightweight" # lightweight, openai, sentence-transformers
    
    OPENAI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LMSTUDIO_BASE_URL: str = "http://localhost:1234/v1"

    TEMPERATURE: float = 0.2
    MAX_TOKENS: int = 2048
    REQUEST_TIMEOUT_SECONDS: int = 30
    MAX_RETRIES: int = 3

    # Feature Flags
    AI_CHAT_ENABLED: bool = True
    OCR_ENABLED: bool = True
    RAG_ENABLED: bool = True
    SEMANTIC_SEARCH_ENABLED: bool = True
    RECOMMENDATION_ENABLED: bool = True
    HOTSPOT_ENABLED: bool = True

    # Logging Options
    LOG_AI_PROMPTS: bool = True
    LOG_AI_LATENCY: bool = True

ai_settings = AISettings()
