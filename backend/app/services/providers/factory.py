"""Factory for resolving assessment providers."""

from typing import Optional
from app.config import settings
from app.services.providers.base import BaseAssessmentProvider
from app.services.providers.synthetic_mock import SyntheticMockProvider
from app.services.providers.bedrock_provider import BedrockAssessmentProvider


def get_assessment_provider(mode: Optional[str] = None) -> BaseAssessmentProvider:
    """Resolve and return the appropriate assessment provider based on configuration.
    
    Defaults to SyntheticMockProvider unless 'aws_bedrock' is explicitly configured.
    """
    provider_mode = (mode or settings.assessment_provider_mode).lower().strip()
    
    if provider_mode in ("aws_bedrock", "bedrock"):
        return BedrockAssessmentProvider(
            model_id=settings.aws_bedrock_model_id,
            region_name=settings.aws_region,
        )
    
    # Default: Safe offline synthetic mock engine
    return SyntheticMockProvider()
