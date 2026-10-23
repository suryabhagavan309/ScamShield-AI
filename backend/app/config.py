"""Application configuration settings for ScamShield AI prototype and Bedrock integration."""

import os
from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "ScamShield AI"
    version: str = "0.2.0-bedrock-ready"
    environment: str = os.getenv("ENVIRONMENT", "prototype")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Provider Configuration
    # Options: "mock_synthetic" (default) or "aws_bedrock"
    assessment_provider_mode: str = os.getenv(
        "ASSESSMENT_PROVIDER_MODE",
        os.getenv("ASSESSMENT_ENGINE_MODE", "mock_synthetic")
    )
    engine_label: str = "ScamShield Mock Assessment Engine v1.0 (Local Synthetic Heuristics)"
    is_external_ai_connected: bool = False  # Set dynamically or kept False unless authenticated
    
    # AWS Bedrock Configuration
    aws_region: str = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
    aws_bedrock_model_id: str = os.getenv(
        "AWS_BEDROCK_MODEL_ID",
        "anthropic.claude-3-haiku-20240307-v1:0"
    )
    aws_bedrock_fallback_to_mock: bool = os.getenv("AWS_BEDROCK_FALLBACK_TO_MOCK", "true").lower() in ("true", "1", "yes")
    aws_bedrock_temperature: float = float(os.getenv("AWS_BEDROCK_TEMPERATURE", "0.0"))
    aws_bedrock_max_tokens: int = int(os.getenv("AWS_BEDROCK_MAX_TOKENS", "1024"))
    
    # Safety and Privacy Guardrails
    store_sensitive_pii: bool = False
    mock_alert_dispatch: bool = True
    allow_automated_financial_actions: bool = False  # Strictly forbidden by project requirements


settings = Settings()
