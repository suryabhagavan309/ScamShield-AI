"""API routes for trusted-contact alert simulation requiring explicit consent."""

from fastapi import APIRouter
from app.models.alert import AlertRequest, AlertResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Trusted Contact Alerts"])


@router.post("/simulate", response_model=AlertResponse)
def simulate_trusted_contact_alert(request: AlertRequest) -> AlertResponse:
    """Simulate sending an alert to a trusted contact.
    
    CRITICAL SAFETY REQUIREMENT:
    Requires explicit user consent (explicit_consent=True).
    No actual SMS or email is sent, and zero PII is persisted externally.
    """
    return AlertService.simulate_trusted_contact_alert(request)
