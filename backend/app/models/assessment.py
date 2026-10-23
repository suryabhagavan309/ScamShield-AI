"""Pydantic models for scam assessment requests, responses, and red flag indicators."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class RedFlagCategory(str, Enum):
    IMPERSONATION = "impersonation"
    URGENCY = "urgency"
    SECRECY = "secrecy"
    UNCONVENTIONAL_PAYMENT = "unconventional_payment"
    REMOTE_ACCESS = "remote_access"
    THREAT_OR_COERCION = "threat_or_coercion"


class RiskLevel(str, Enum):
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


class RedFlag(BaseModel):
    category: RedFlagCategory
    severity: str = Field(description="Severity: critical, high, or medium")
    title: str
    description: str
    detected_indicators: list[str] = Field(default_factory=list)


class VerificationGuidance(BaseModel):
    immediate_action: str
    pause_recommendation: str
    independent_verification_steps: list[str]
    safe_helplines: list[str]
    cooling_off_advice: str


class AssessmentRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=5,
        max_length=5000,
        description="User description of suspicious call, message, or financial request"
    )
    claimed_caller: Optional[str] = Field(
        None,
        max_length=150,
        description="Who the caller claimed to be (e.g. Bank, Grandson, Police, Tech Support)"
    )
    demanded_amount: Optional[str] = Field(
        None,
        max_length=100,
        description="Amount of money requested or claimed"
    )
    payment_method: Optional[str] = Field(
        None,
        max_length=100,
        description="Requested payment method (e.g. Gift cards, Wire, Crypto, Cash)"
    )
    channel: Optional[str] = Field(
        "phone_call",
        description="Communication channel: phone_call, sms, email, or in_person"
    )


class AssessmentResponse(BaseModel):
    assessment_id: str
    timestamp: str
    risk_level: RiskLevel
    risk_score: int = Field(ge=0, le=100, description="Risk score from 0 (safe) to 100 (extreme danger)")
    summary_headline: str
    detailed_explanation: str
    detected_warning_signs: list[RedFlag]
    verification_guidance: VerificationGuidance
    cooling_off_recommended: bool
    cooling_off_minutes: int
    mock_engine_notice: str
    is_mock: bool = True
