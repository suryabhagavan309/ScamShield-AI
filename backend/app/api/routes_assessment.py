"""API routes for scam assessment and synthetic scenarios."""

from fastapi import APIRouter
from app.models.assessment import AssessmentRequest, AssessmentResponse
from app.services.assessment_engine import SYNTHETIC_SCENARIOS
from app.services.providers.factory import get_assessment_provider

router = APIRouter(prefix="/assess", tags=["Assessment"])


@router.post("", response_model=AssessmentResponse)
def assess_suspicious_interaction(request: AssessmentRequest) -> AssessmentResponse:
    """Analyze a suspicious interaction using the configured assessment provider (Mock or Bedrock)."""
    provider = get_assessment_provider()
    return provider.assess(request)


@router.get("/scenarios")
def get_synthetic_scenarios():
    """Retrieve pre-built synthetic scam scenarios for demonstration and testing."""
    provider = get_assessment_provider()
    return {
        "engine_label": provider.provider_name,
        "is_mock": provider.is_mock,
        "scenarios": SYNTHETIC_SCENARIOS,
    }
