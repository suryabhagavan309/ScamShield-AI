"""Service for simulated trusted-contact alerts with mandatory explicit consent."""

import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from app.models.alert import AlertRequest, AlertResponse
from app.services.incident_store import incident_store


class AlertService:
    @staticmethod
    def simulate_trusted_contact_alert(request: AlertRequest) -> AlertResponse:
        # 1. Enforce Mandatory Explicit Consent
        if not request.explicit_consent:
            raise HTTPException(
                status_code=422,
                detail="Explicit user consent is strictly required before simulating a trusted-contact alert."
            )

        # 2. Look up the associated incident
        incident = incident_store.get_incident(request.incident_id)
        if not incident:
            raise HTTPException(
                status_code=404,
                detail=f"Incident with ID '{request.incident_id}' not found."
            )

        # 3. Mask contact identifier to guarantee zero PII retention in prototype
        raw_contact = request.contact_phone_or_email.strip()
        if "@" in raw_contact:
            parts = raw_contact.split("@")
            user_part = parts[0]
            masked_contact = f"{user_part[:2]}***@{parts[1]}"
        else:
            # Phone number masking
            digits = "".join(filter(str.isdigit, raw_contact))
            last4 = digits[-4:] if len(digits) >= 4 else "0000"
            masked_contact = f"(***) ***-{last4}"

        # 4. Construct high-clarity notification message for the trusted family member
        risk_label = incident.risk_level.value
        note_snippet = f"\nUser Note: \"{request.custom_message_note}\"" if request.custom_message_note else ""
        
        simulated_message = (
            f"[ScamShield AI Family Alert]\n"
            f"Hello {request.contact_name} ({request.contact_relationship}),\n\n"
            f"Your family member evaluated a suspicious contact claiming to be: '{incident.claimed_caller}'.\n"
            f"• Risk Assessment: {risk_label} RISK (Score: {incident.risk_score}/100)\n"
            f"• Recommended Action: STOP PAYMENT & INDEPENDENTLY VERIFY.\n"
            f"• Incident ID: {incident.id}\n"
            f"{note_snippet}\n"
            f"Please check in with them calmly by calling their personal phone number."
        )

        # 5. Mark the incident record
        incident_store.mark_trusted_contact_alerted(request.incident_id)

        return AlertResponse(
            alert_id=f"ALERT-SIM-{uuid.uuid4().hex[:8].upper()}",
            incident_id=request.incident_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            simulated_delivery_status="SIMULATED_DELIVERY_SUCCESS",
            explicit_consent_verified=True,
            recipient_summary=f"{request.contact_name} ({request.contact_relationship}) via {masked_contact}",
            generated_message_preview=simulated_message
        )
