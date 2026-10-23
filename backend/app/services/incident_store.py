"""In-memory thread-safe incident store with pre-seeded synthetic sample history."""

import uuid
from datetime import datetime, timezone, timedelta
from threading import Lock
from typing import Optional
from app.models.incident import Incident, IncidentStatus, IncidentUpdateRequest
from app.models.assessment import (
    AssessmentResponse,
    RiskLevel,
    VerificationGuidance,
    RedFlag,
    RedFlagCategory,
)


class IncidentStore:
    def __init__(self):
        self._lock = Lock()
        self._incidents: dict[str, Incident] = {}
        self._seed_sample_incidents()

    def _seed_sample_incidents(self):
        """Seed initial realistic synthetic records for prototype evaluation."""
        now = datetime.now(timezone.utc)
        
        # 1. Seed Grandson bail scam (Paused / Cooling Off)
        inc1_id = "INC-8921"
        inc1_guidance = VerificationGuidance(
            immediate_action="🛑 STOP AND PAUSE: Do not purchase gift cards or send money.",
            pause_recommendation="Hang up the phone immediately. Real bail courts never accept Target gift cards.",
            independent_verification_steps=[
                "Hang up phone immediately.",
                "Call your grandchild's known mobile number directly.",
                "Call their parents to verify their actual whereabouts.",
                "Never send gift card pin codes."
            ],
            safe_helplines=["AARP Fraud Watch: 1-877-908-3360"],
            cooling_off_advice="Voluntary cooling-off timer initiated. Take deep breaths."
        )
        inc1_assessment = AssessmentResponse(
            assessment_id="SCAM-MOCK-SEED-01",
            timestamp=(now - timedelta(hours=3)).isoformat(),
            risk_level=RiskLevel.HIGH,
            risk_score=90,
            summary_headline="🚨 CRITICAL RISK: Family Emergency Bail Scam",
            detailed_explanation="Classic grandparent scam leveraging distress, secrecy, and gift card payment demands.",
            detected_warning_signs=[
                RedFlag(
                    category=RedFlagCategory.IMPERSONATION,
                    severity="critical",
                    title="Family Member in Distress Impersonation",
                    description="Caller claimed to be grandson in jail needing bail money.",
                    detected_indicators=["grandson", "in jail", "attorney"]
                ),
                RedFlag(
                    category=RedFlagCategory.SECRECY,
                    severity="critical",
                    title="Forced Secrecy",
                    description="Caller insisted on not telling the grandchild's parents.",
                    detected_indicators=["don't tell his parents"]
                ),
                RedFlag(
                    category=RedFlagCategory.UNCONVENTIONAL_PAYMENT,
                    severity="critical",
                    title="Demanding Gift Cards for Bail",
                    description="Courts and attorneys never accept gift cards.",
                    detected_indicators=["target gift cards"]
                )
            ],
            verification_guidance=inc1_guidance,
            cooling_off_recommended=True,
            cooling_off_minutes=15,
            mock_engine_notice="Prototype Synthetic Heuristics Mock",
            is_mock=True
        )
        self._incidents[inc1_id] = Incident(
            id=inc1_id,
            created_at=(now - timedelta(hours=3)).isoformat(),
            description_snippet="Caller claimed to be grandson in car crash needing $4,500 Target gift cards for bail.",
            claimed_caller="Alleged Grandson & Bail Attorney",
            risk_level=RiskLevel.HIGH,
            risk_score=90,
            status=IncidentStatus.PAUSED_COOLING_OFF,
            cooling_off_active=True,
            cooling_off_end_time=(now + timedelta(minutes=10)).isoformat(),
            cooling_off_duration_minutes=15,
            assessment=inc1_assessment,
            trusted_contact_alerted=True,
            report_drafted=False
        )

        # 2. Seed Bank Safe Account Scam (Report Drafted)
        inc2_id = "INC-7412"
        inc2_guidance = VerificationGuidance(
            immediate_action="🛑 NEVER transfer funds to a 'safe account'. That account belongs to the criminal.",
            pause_recommendation="Hang up immediately and call the customer service phone on your card.",
            independent_verification_steps=[
                "Hang up immediately.",
                "Locate the official 1-800 number on the back of your debit card.",
                "Ask for the bank fraud department directly."
            ],
            safe_helplines=["National Elder Fraud Hotline: 1-833-372-8311"],
            cooling_off_advice="Call verified bank staff after waiting 10 minutes."
        )
        inc2_assessment = AssessmentResponse(
            assessment_id="SCAM-MOCK-SEED-02",
            timestamp=(now - timedelta(days=1)).isoformat(),
            risk_level=RiskLevel.HIGH,
            risk_score=95,
            summary_headline="🚨 CRITICAL RISK: Bank Impersonation Safe Account Scam",
            detailed_explanation="Attempted wire transfer redirection to criminal safe account.",
            detected_warning_signs=[
                RedFlag(
                    category=RedFlagCategory.IMPERSONATION,
                    severity="critical",
                    title="Bank Security Impersonation",
                    description="Caller claimed to be fraud department investigating teller theft.",
                    detected_indicators=["bank", "fraud department"]
                ),
                RedFlag(
                    category=RedFlagCategory.UNCONVENTIONAL_PAYMENT,
                    severity="critical",
                    title="Safe Account Wire Transfer",
                    description="Banks never ask customers to transfer money out to keep it safe.",
                    detected_indicators=["wire transfer", "safe account"]
                )
            ],
            verification_guidance=inc2_guidance,
            cooling_off_recommended=True,
            cooling_off_minutes=15,
            mock_engine_notice="Prototype Synthetic Heuristics Mock",
            is_mock=True
        )
        self._incidents[inc2_id] = Incident(
            id=inc2_id,
            created_at=(now - timedelta(days=1)).isoformat(),
            description_snippet="Called claiming account compromised; asked to wire $12,000 to safe holding account.",
            claimed_caller="Chase Fraud Security Dept",
            risk_level=RiskLevel.HIGH,
            risk_score=95,
            status=IncidentStatus.REPORT_DRAFTED,
            cooling_off_active=False,
            cooling_off_end_time=None,
            cooling_off_duration_minutes=15,
            assessment=inc2_assessment,
            trusted_contact_alerted=True,
            report_drafted=True
        )

        # 3. Seed Routine Bank Statement Review (Resolved / Low Risk)
        inc3_id = "INC-3210"
        inc3_guidance = VerificationGuidance(
            immediate_action="No immediate danger detected.",
            pause_recommendation="Verify appointments through standard local branch directory if unsure.",
            independent_verification_steps=["Confirm with branch manager during regular banking hours."],
            safe_helplines=["Branch Customer Care"],
            cooling_off_advice="No cooling-off needed."
        )
        inc3_assessment = AssessmentResponse(
            assessment_id="SCAM-MOCK-SEED-03",
            timestamp=(now - timedelta(days=3)).isoformat(),
            risk_level=RiskLevel.LOW,
            risk_score=10,
            summary_headline="ℹ️ LOW RISK: Routine Bank Branch Appointment Letter",
            detailed_explanation="Standard annual review letter with no urgent payment or password requests.",
            detected_warning_signs=[],
            verification_guidance=inc3_guidance,
            cooling_off_recommended=False,
            cooling_off_minutes=0,
            mock_engine_notice="Prototype Synthetic Heuristics Mock",
            is_mock=True
        )
        self._incidents[inc3_id] = Incident(
            id=inc3_id,
            created_at=(now - timedelta(days=3)).isoformat(),
            description_snippet="Letter from local branch inviting customer to schedule annual portfolio review.",
            claimed_caller="Local Bank Branch",
            risk_level=RiskLevel.LOW,
            risk_score=10,
            status=IncidentStatus.RESOLVED,
            cooling_off_active=False,
            cooling_off_end_time=None,
            cooling_off_duration_minutes=0,
            assessment=inc3_assessment,
            trusted_contact_alerted=False,
            report_drafted=False
        )

    def list_incidents(self) -> list[Incident]:
        with self._lock:
            # Sort newest first
            return sorted(self._incidents.values(), key=lambda x: x.created_at, reverse=True)

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        with self._lock:
            return self._incidents.get(incident_id)

    def create_incident(self, assessment: AssessmentResponse, claimed_caller: str, raw_description: str) -> Incident:
        with self._lock:
            new_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
            now = datetime.now(timezone.utc)
            snippet = raw_description[:160] + ("..." if len(raw_description) > 160 else "")
            
            cooling_active = assessment.cooling_off_recommended
            end_time = (now + timedelta(minutes=assessment.cooling_off_minutes)).isoformat() if cooling_active else None

            incident = Incident(
                id=new_id,
                created_at=now.isoformat(),
                description_snippet=snippet,
                claimed_caller=claimed_caller or "Unknown Caller / Contact",
                risk_level=assessment.risk_level,
                risk_score=assessment.risk_score,
                status=IncidentStatus.PAUSED_COOLING_OFF if cooling_active else IncidentStatus.NEW,
                cooling_off_active=cooling_active,
                cooling_off_end_time=end_time,
                cooling_off_duration_minutes=assessment.cooling_off_minutes or 15,
                assessment=assessment,
                trusted_contact_alerted=False,
                report_drafted=False
            )
            self._incidents[new_id] = incident
            return incident

    def update_incident(self, incident_id: str, update: IncidentUpdateRequest) -> Optional[Incident]:
        with self._lock:
            incident = self._incidents.get(incident_id)
            if not incident:
                return None
            
            if update.status is not None:
                incident.status = update.status
            
            if update.cooling_off_active is not None:
                incident.cooling_off_active = update.cooling_off_active
                if update.cooling_off_active:
                    duration = update.cooling_off_duration_minutes or incident.cooling_off_duration_minutes or 15
                    incident.cooling_off_duration_minutes = duration
                    incident.cooling_off_end_time = (datetime.now(timezone.utc) + timedelta(minutes=duration)).isoformat()
                    if incident.status == IncidentStatus.NEW:
                        incident.status = IncidentStatus.PAUSED_COOLING_OFF
                else:
                    incident.cooling_off_end_time = None
                    if incident.status == IncidentStatus.PAUSED_COOLING_OFF:
                        incident.status = IncidentStatus.RESOLVED

            return incident

    def mark_trusted_contact_alerted(self, incident_id: str) -> bool:
        with self._lock:
            incident = self._incidents.get(incident_id)
            if incident:
                incident.trusted_contact_alerted = True
                if incident.status == IncidentStatus.NEW or incident.status == IncidentStatus.PAUSED_COOLING_OFF:
                    incident.status = IncidentStatus.CONTACT_ALERTED
                return True
            return False

    def mark_report_drafted(self, incident_id: str) -> bool:
        with self._lock:
            incident = self._incidents.get(incident_id)
            if incident:
                incident.report_drafted = True
                incident.status = IncidentStatus.REPORT_DRAFTED
                return True
            return False


incident_store = IncidentStore()
