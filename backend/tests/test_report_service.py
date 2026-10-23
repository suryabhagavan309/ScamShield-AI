"""Tests for official fraud report drafting service."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_generate_report_draft_ftc():
    payload = {
        "incident_id": "INC-8921",
        "target_agency": "FTC_REPORT_FRAUD"
    }
    response = client.post("/api/reports/draft", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_agency"] == "FTC_REPORT_FRAUD"
    assert "ReportFraud.ftc.gov" in data["official_reporting_portal_or_phone"]
    assert "SUSPECTED FRAUD INCIDENT REPORT DRAFT" in data["formatted_report_text"]
    assert "ZERO PII RETENTION" in data["sanitized_privacy_statement"]


def test_generate_report_draft_bank():
    payload = {
        "incident_id": "INC-7412",
        "target_agency": "BANK_FRAUD_DEPARTMENT"
    }
    response = client.post("/api/reports/draft", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_agency"] == "BANK_FRAUD_DEPARTMENT"
    assert "back of your physical bank card" in data["official_reporting_portal_or_phone"]


def test_generate_report_nonexistent_incident():
    payload = {
        "incident_id": "INC-UNKNOWN",
        "target_agency": "LOCAL_POLICE"
    }
    response = client.post("/api/reports/draft", json=payload)
    assert response.status_code == 404
