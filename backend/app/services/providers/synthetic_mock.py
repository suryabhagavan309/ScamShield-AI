"""Synthetic Heuristics Mock Assessment Provider.
Runs local, transparent rule-based heuristics without requiring cloud credentials.
"""

from app.models.assessment import AssessmentRequest, AssessmentResponse
from app.services.providers.base import BaseAssessmentProvider
from app.services.assessment_engine import MockAssessmentEngine


class SyntheticMockProvider(BaseAssessmentProvider):
    """Local rule-based heuristic provider for baseline prototype and fallback operation."""

    @property
    def provider_name(self) -> str:
        return MockAssessmentEngine.ENGINE_VERSION

    @property
    def is_mock(self) -> bool:
        return True

    def assess(self, request: AssessmentRequest) -> AssessmentResponse:
        return MockAssessmentEngine.assess(request)
