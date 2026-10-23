"""Assessment Provider package for ScamShield AI.
Supports both local synthetic mock evaluation and AWS Bedrock foundation models.
"""

from app.services.providers.base import BaseAssessmentProvider
from app.services.providers.synthetic_mock import SyntheticMockProvider
from app.services.providers.bedrock_provider import BedrockAssessmentProvider
from app.services.providers.factory import get_assessment_provider

__all__ = [
    "BaseAssessmentProvider",
    "SyntheticMockProvider",
    "BedrockAssessmentProvider",
    "get_assessment_provider",
]
