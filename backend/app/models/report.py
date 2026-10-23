"""Pydantic models for scam report drafting."""

from enum import Enum
from pydantic import BaseModel, Field


class TargetAgency(str, Enum):
    FTC_REPORT_FRAUD = "FTC_REPORT_FRAUD"
    LOCAL_POLICE = "LOCAL_POLICE"
    BANK_FRAUD_DEPARTMENT = "BANK_FRAUD_DEPARTMENT"
    NATIONAL_ELDER_FRAUD_HOTLINE = "NATIONAL_ELDER_FRAUD_HOTLINE"


class ReportDraftRequest(BaseModel):
    incident_id: str
    target_agency: TargetAgency = TargetAgency.FTC_REPORT_FRAUD


class ReportDraftResponse(BaseModel):
    report_id: str
    incident_id: str
    created_at: str
    target_agency: TargetAgency
    target_agency_title: str
    official_reporting_portal_or_phone: str
    formatted_report_text: str
    sanitized_privacy_statement: str
