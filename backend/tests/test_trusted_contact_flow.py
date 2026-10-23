"""Tests for trusted contact alert simulation and explicit consent requirement."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_trusted_contact_rejects_without_explicit_consent():
    """Safety verification: simulating an alert MUST fail if explicit consent is not provided."""
    payload = {
        "incident_id": "INC-8921",
        "contact_name": "Sarah Miller",
        "contact_relationship": "Daughter",
        "contact_phone_or_email": "sarah.m@example.com",
        "explicit_consent": False,  # Missing consent!
        "custom_message_note": "Please call mom."
    }
    response = client.post("/api/alerts/simulate", json=payload)
    assert response.status_code == 422
    assert "Explicit user consent is strictly required" in response.text


def test_trusted_contact_succeeds_with_explicit_consent():
    """Verify that alert succeeds with explicit consent and masks contact PII."""
    payload = {
        "incident_id": "INC-8921",
        "contact_name": "David Miller",
        "contact_relationship": "Son",
        "contact_phone_or_email": "555-019-8833",
        "explicit_consent": True,
        "custom_message_note": "Just checking in to make sure everything is okay."
    }
    response = client.post("/api/alerts/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["explicit_consent_verified"] is True
    assert data["simulated_delivery_status"] == "SIMULATED_DELIVERY_SUCCESS"
    assert "PROTOTYPE SIMULATION ONLY" in data["mock_disclaimer"]
    # PII masking verification
    assert "555-019-8833" not in data["recipient_summary"]
    assert "8833" in data["recipient_summary"]
    assert "David Miller" in data["generated_message_preview"]


def test_trusted_contact_nonexistent_incident():
    payload = {
        "incident_id": "INC-NONEXISTENT",
        "contact_name": "Test Contact",
        "contact_relationship": "Friend",
        "contact_phone_or_email": "friend@example.com",
        "explicit_consent": True
    }
    response = client.post("/api/alerts/simulate", json=payload)
    assert response.status_code == 404
