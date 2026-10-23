"""Unit and regression tests for the Mock Assessment Engine."""

import pytest
from app.models.assessment import AssessmentRequest, RiskLevel, RedFlagCategory
from app.services.assessment_engine import MockAssessmentEngine, SYNTHETIC_SCENARIOS


def test_grandchild_bail_scam_assessment():
    request = AssessmentRequest(
        description="Caller says he is my grandson in jail after a car crash and needs $4000 in Target gift cards right now. Don't tell his mom.",
        claimed_caller="Grandson",
        demanded_amount="$4000",
        payment_method="Target gift cards",
        channel="phone_call"
    )
    response = MockAssessmentEngine.assess(request)
    
    assert response.risk_level == RiskLevel.HIGH
    assert response.risk_score >= 70
    assert response.cooling_off_recommended is True
    assert response.cooling_off_minutes == 15
    assert response.is_mock is True
    assert "PROTOTYPE" in response.mock_engine_notice
    
    # Verify warning sign categories
    flag_categories = [f.category for f in response.detected_warning_signs]
    assert RedFlagCategory.IMPERSONATION in flag_categories
    assert RedFlagCategory.URGENCY in flag_categories
    assert RedFlagCategory.SECRECY in flag_categories
    assert RedFlagCategory.UNCONVENTIONAL_PAYMENT in flag_categories


def test_bank_safe_account_scam_assessment():
    request = AssessmentRequest(
        description="Call from Chase Fraud Dept saying employee is stealing money. Told to wire transfer $10000 to safe holding account immediately.",
        claimed_caller="Chase Fraud Dept",
        demanded_amount="$10000",
        payment_method="Wire transfer",
        channel="phone_call"
    )
    response = MockAssessmentEngine.assess(request)
    
    assert response.risk_level == RiskLevel.HIGH
    assert response.risk_score >= 60
    assert "STOP AND PAUSE" in response.verification_guidance.immediate_action
    assert any("back of your physical" in step for step in response.verification_guidance.independent_verification_steps)


def test_tech_support_anydesk_scam():
    request = AssessmentRequest(
        description="Popup says computer has virus. Called number and technician asked me to install AnyDesk remote access right now.",
        claimed_caller="Tech Support",
        payment_method="Remote Access",
        channel="phone_call"
    )
    response = MockAssessmentEngine.assess(request)
    
    assert response.risk_level in [RiskLevel.HIGH, RiskLevel.MODERATE]
    flag_categories = [f.category for f in response.detected_warning_signs]
    assert RedFlagCategory.REMOTE_ACCESS in flag_categories


def test_synthetic_scenario_routine_notice_regression():
    """Regression test 1: 'Legitimate Routine Notice (Low Risk Control)' must classify as LOW RISK."""
    scenario = next(s for s in SYNTHETIC_SCENARIOS if s["id"] == "scenario-routine-check")
    request = AssessmentRequest(
        description=scenario["prompt_text"],
        claimed_caller=scenario["claimed_caller"],
        demanded_amount=scenario["demanded_amount"],
        payment_method=scenario["payment_method"],
        channel=scenario["channel"]
    )
    response = MockAssessmentEngine.assess(request)

    # 1. Assert Risk Tier and Score
    assert response.risk_level == RiskLevel.LOW
    assert 0 <= response.risk_score <= 15

    # 2. Assert No Unsupported Warning Signs
    flag_categories = [f.category for f in response.detected_warning_signs]
    assert RedFlagCategory.IMPERSONATION not in flag_categories
    assert RedFlagCategory.URGENCY not in flag_categories
    assert RedFlagCategory.SECRECY not in flag_categories
    assert RedFlagCategory.UNCONVENTIONAL_PAYMENT not in flag_categories
    assert len(response.detected_warning_signs) == 0

    # 3. Assert Recommendation Consistency (No "STOP PAYMENT")
    immediate = response.verification_guidance.immediate_action
    assert "STOP PAYMENT" not in immediate
    assert "STOP AND PAUSE" not in immediate
    assert "No immediate danger detected" in immediate
    assert response.cooling_off_recommended is False
    assert response.cooling_off_minutes == 0

    # 4. Assert Neutral Verification Advice
    pause_rec = response.verification_guidance.pause_recommendation
    assert "official phone number" in pause_rec or "verify" in pause_rec


def test_synthetic_scenario_grandchild_bail_regression():
    """Regression test 2: 'Grandchild in Distress (Bail Scam)' must remain HIGH RISK with all 4 hallmarks."""
    scenario = next(s for s in SYNTHETIC_SCENARIOS if s["id"] == "scenario-grandchild")
    request = AssessmentRequest(
        description=scenario["prompt_text"],
        claimed_caller=scenario["claimed_caller"],
        demanded_amount=scenario["demanded_amount"],
        payment_method=scenario["payment_method"],
        channel=scenario["channel"]
    )
    response = MockAssessmentEngine.assess(request)

    assert response.risk_level == RiskLevel.HIGH
    assert response.risk_score >= 80

    flag_categories = [f.category for f in response.detected_warning_signs]
    assert RedFlagCategory.IMPERSONATION in flag_categories
    assert RedFlagCategory.URGENCY in flag_categories
    assert RedFlagCategory.SECRECY in flag_categories
    assert RedFlagCategory.UNCONVENTIONAL_PAYMENT in flag_categories

    assert "STOP AND PAUSE" in response.verification_guidance.immediate_action
    assert response.cooling_off_recommended is True
    assert response.cooling_off_minutes == 15


def test_neutral_bank_appointment_description_regression():
    """Regression test 3: Neutral bank appointment must not trigger false positive impersonation or urgency."""
    request = AssessmentRequest(
        description=(
            "A representative from my bank called to ask if I wanted to schedule an appointment next week "
            "to discuss certificate of deposit interest rates. They did not ask for my account number or password."
        ),
        claimed_caller="Local Bank Branch",
        demanded_amount="None",
        payment_method="None",
        channel="phone_call"
    )
    response = MockAssessmentEngine.assess(request)

    assert response.risk_level == RiskLevel.LOW
    assert 0 <= response.risk_score <= 15
    assert len(response.detected_warning_signs) == 0

    immediate = response.verification_guidance.immediate_action
    assert "STOP PAYMENT" not in immediate
    assert "STOP AND PAUSE" not in immediate
    assert "No immediate danger detected" in immediate
    assert response.cooling_off_recommended is False


def test_no_payment_requested_does_not_infer_payment_threat():
    """Regression test 4: Do not infer payment threat when no payment is requested."""
    request = AssessmentRequest(
        description="The library called to say my reserved book is available for pickup. No payment was requested.",
        claimed_caller="Public Library",
        demanded_amount="0",
        payment_method="None"
    )
    response = MockAssessmentEngine.assess(request)
    flag_categories = [f.category for f in response.detected_warning_signs]
    assert RedFlagCategory.UNCONVENTIONAL_PAYMENT not in flag_categories
    assert response.risk_level == RiskLevel.LOW


def test_synthetic_scenarios_exist():
    assert len(SYNTHETIC_SCENARIOS) >= 5
    for s in SYNTHETIC_SCENARIOS:
        assert "id" in s
        assert "title" in s
        assert "prompt_text" in s
