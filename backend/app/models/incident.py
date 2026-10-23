"""Pydantic models for incident records, status tracking, and cooling-off state."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from app.models.assessment import AssessmentResponse, RiskLevel


class IncidentStatus(str, Enum):
    NEW = "NEW"
    PAUSED_COOLING_OFF = "PAUSED_COOLING_OFF"
    CONTACT_ALERTED = "CONTACT_ALERTED"
    REPORT_DRAFTED = "REPORT_DRAFTED"
    RESOLVED = "RESOLVED"


class Incident(BaseModel):
    id: str
    created_at: str
    description_snippet: str
    claimed_caller: str
    risk_level: RiskLevel
    risk_score: int
    status: IncidentStatus
    cooling_off_active: bool = False
    cooling_off_end_time: Optional[str] = None
    cooling_off_duration_minutes: int = 15
    assessment: AssessmentResponse
    trusted_contact_alerted: bool = False
    report_drafted: bool = False


class IncidentUpdateRequest(BaseModel):
    status: Optional[IncidentStatus] = None
    cooling_off_active: Optional[bool] = None
    cooling_off_duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
