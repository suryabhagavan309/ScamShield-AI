"""Pydantic models for trusted-contact alert simulation requiring explicit consent."""

from typing import Optional
from pydantic import BaseModel, Field


class AlertRequest(BaseModel):
    incident_id: str
    contact_name: str = Field(..., min_length=2, max_length=100)
    contact_relationship: str = Field(..., min_length=2, max_length=50)
    contact_phone_or_email: str = Field(..., min_length=3, max_length=100)
    explicit_consent: bool = Field(
        ...,
        description="Explicit user consent must be True to simulate an alert dispatch."
    )
    custom_message_note: Optional[str] = Field(None, max_length=300)


class AlertResponse(BaseModel):
    alert_id: str
    incident_id: str
    timestamp: str
    simulated_delivery_status: str
    explicit_consent_verified: bool
    recipient_summary: str
    generated_message_preview: str
    mock_disclaimer: str = (
        "PROTOTYPE SIMULATION ONLY: No actual SMS, phone call, or email has been transmitted. "
        "No personal sensitive contact details are stored externally."
    )
