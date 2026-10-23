"""Integration tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["mock_mode"] is True
    assert data["is_external_ai_connected"] is False
    assert data["safety_guardrails"]["store_sensitive_pii"] is False
    assert data["safety_guardrails"]["call_interception"] is False


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "ScamShield" in data["message"]
    assert "disclaimer" in data


def test_assess_endpoint():
    payload = {
        "description": "Caller from IRS threatened to issue a warrant if I don't send Bitcoin immediately.",
        "claimed_caller": "IRS Agent",
        "demanded_amount": "$2,500",
        "payment_method": "Bitcoin",
        "channel": "phone_call"
    }
    response = client.post("/api/assess", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "HIGH"
    assert data["risk_score"] > 50
    assert len(data["detected_warning_signs"]) > 0
    assert data["is_mock"] is True


def test_scenarios_endpoint():
    response = client.get("/api/assess/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "scenarios" in data
    assert len(data["scenarios"]) >= 5


def test_incidents_crud():
    # 1. List existing seeded incidents
    list_res = client.get("/api/incidents")
    assert list_res.status_code == 200
    incidents = list_res.json()
    assert len(incidents) >= 3

    # 2. Create new incident from assessment
    assess_res = client.post("/api/assess", json={
        "description": "Electric utility company threatening shut off within 45 minutes unless paid via gift cards.",
        "claimed_caller": "Utility Co",
        "demanded_amount": "$350",
        "payment_method": "Gift Cards"
    })
    assessment_data = assess_res.json()

    create_res = client.post("/api/incidents", json={
        "assessment": assessment_data,
        "claimed_caller": "Utility Co",
        "description": "Electric utility company threatening shut off within 45 minutes unless paid via gift cards."
    })
    assert create_res.status_code == 201
    created_incident = create_res.json()
    incident_id = created_incident["id"]
    assert incident_id.startswith("INC-")

    # 3. Update cooling-off status
    patch_res = client.patch(f"/api/incidents/{incident_id}", json={
        "cooling_off_active": False,
        "status": "RESOLVED"
    })
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["cooling_off_active"] is False
    assert updated["status"] == "RESOLVED"
