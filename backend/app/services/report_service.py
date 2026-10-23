"""Service for generating structured, sanitized scam incident report drafts."""

import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from app.models.report import (
    ReportDraftRequest,
    ReportDraftResponse,
    TargetAgency,
)
from app.services.incident_store import incident_store


AGENCY_METADATA = {
    TargetAgency.FTC_REPORT_FRAUD: {
        "title": "Federal Trade Commission (FTC) - Fraud Reporting Division",
        "contact": "Website: https://ReportFraud.ftc.gov | Helpline: 1-877-FTC-HELP (1-877-382-4357)",
    },
    TargetAgency.LOCAL_POLICE: {
        "title": "Local Law Enforcement Non-Emergency Dispatch",
        "contact": "Local Police Non-Emergency Line (Check your town/county directory - Do not dial 911 for past non-violent fraud reports)",
    },
    TargetAgency.BANK_FRAUD_DEPARTMENT: {
        "title": "Financial Institution Fraud & Dispute Division",
        "contact": "Phone: Dial the official 1-800 phone number printed directly on the back of your physical bank card",
    },
    TargetAgency.NATIONAL_ELDER_FRAUD_HOTLINE: {
        "title": "U.S. Department of Justice - National Elder Fraud Hotline",
        "contact": "Toll-Free Helpline: 1-833-FRAUD-11 (1-833-372-8311) | Mon-Fri 10am-6pm ET",
    },
}


class ReportService:
    @staticmethod
    def generate_draft(request: ReportDraftRequest) -> ReportDraftResponse:
        incident = incident_store.get_incident(request.incident_id)
        if not incident:
            raise HTTPException(
                status_code=404,
                detail=f"Incident with ID '{request.incident_id}' not found."
            )

        agency_info = AGENCY_METADATA.get(
            request.target_agency,
            AGENCY_METADATA[TargetAgency.FTC_REPORT_FRAUD]
        )

        # Build structured, clear report body
        warning_signs_list = "\n".join(
            f"   - {flag.title}: {flag.description}"
            for flag in incident.assessment.detected_warning_signs
        ) or "   - (No severe red flags detected; routine inquiry review)"

        actions_taken = []
        if incident.cooling_off_active or incident.status.value in ["PAUSED_COOLING_OFF", "RESOLVED"]:
            actions_taken.append("Initiated voluntary 15-minute cooling-off pause to prevent rushed financial decisions.")
        actions_taken.append("Suspended communication with the caller; payments/transfers held pending independent verification.")
        if incident.trusted_contact_alerted:
            actions_taken.append("Notified designated trusted family contact for secondary verification.")

        actions_text = "\n".join(f"   ✓ {action}" for action in actions_taken)

        report_body = (
            f"========================================================================\n"
            f"            OFFICIAL SUSPECTED FRAUD INCIDENT REPORT DRAFT              \n"
            f"========================================================================\n\n"
            f"REPORTING AGENCY TARGET: {agency_info['title']}\n"
            f"DATE OF REPORT GENERATION: {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}\n"
            f"INCIDENT TRACKING REFERENCE: {incident.id}\n"
            f"ASSESSMENT ENGINE: ScamShield AI Mock Assessment Engine v1.0 (Synthetic Heuristics)\n\n"
            f"1. INCIDENT OVERVIEW & CALLER CLAIMS:\n"
            f"   - Claimed Identity of Caller: {incident.claimed_caller}\n"
            f"   - Description of Occurrence: {incident.description_snippet}\n"
            f"   - Evaluated Scam Risk Tier: {incident.risk_level.value} (Risk Score: {incident.risk_score}/100)\n\n"
            f"2. IDENTIFIED SCAM WARNING SIGNS:\n"
            f"{warning_signs_list}\n\n"
            f"3. PROTECTIVE ACTIONS TAKEN BY CONSUMER:\n"
            f"{actions_text}\n\n"
            f"4. VERIFICATION STATUS:\n"
            f"   - Funds Transfer Status: HALTED / NOT TRANSFERRED\n"
            f"   - Independent Verification: Recommended via official customer service phone\n\n"
            f"------------------------------------------------------------------------\n"
            f"NEXT STEPS FOR CONSUMER:\n"
            f"Copy this draft and submit it directly at: {agency_info['contact']}\n"
            f"========================================================================"
        )

        incident_store.mark_report_drafted(request.incident_id)

        return ReportDraftResponse(
            report_id=f"REP-DRAFT-{uuid.uuid4().hex[:8].upper()}",
            incident_id=incident.id,
            created_at=datetime.now(timezone.utc).isoformat(),
            target_agency=request.target_agency,
            target_agency_title=agency_info["title"],
            official_reporting_portal_or_phone=agency_info["contact"],
            formatted_report_text=report_body,
            sanitized_privacy_statement=(
                "ZERO PII RETENTION GUARANTEE: This draft does not contain social security numbers, "
                "banking account numbers, or login credentials. It is generated locally for your safe reporting."
            )
        )
