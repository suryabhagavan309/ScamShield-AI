"""Unit tests for verify_bedrock_live.py verification script.

STRICT SAFETY DIRECTIVES:
- These tests are 100% offline.
- Every test uses MagicMock clients or mocked sessions.
- Zero network calls, zero AWS invocations, zero cloud charges.
"""

import io
import json
import pytest
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError, NoCredentialsError

from scripts.verify_bedrock_live import (
    check_readiness,
    execute_live_verification,
    main,
    CircuitBreakerError,
    MAX_INVOCATIONS_ALLOWED,
)


def _create_mock_streaming_body(content: dict) -> MagicMock:
    """Simulate boto3 invoke_model response stream body."""
    raw_json = json.dumps(content).encode("utf-8")
    body_mock = MagicMock()
    body_mock.read.return_value = raw_json
    return body_mock


def test_default_execution_is_blocked(capsys):
    """Running without flags must block execution and exit with status 1."""
    exit_code = main([])
    assert exit_code == 1

    captured = capsys.readouterr()
    assert "[BLOCKED] Default execution is blocked for safety." in captured.out
    assert "--check-readiness" in captured.out
    assert "--execute-live-call" in captured.out


def test_execute_live_call_requires_confirmation_token(capsys):
    """Calling --execute-live-call without --confirm YES must be blocked with status 1."""
    exit_code = main(["--execute-live-call"])
    assert exit_code == 1

    captured = capsys.readouterr()
    assert "[BLOCKED] Execution blocked: Missing explicit confirmation." in captured.out
    assert "--confirm YES" in captured.out


def test_check_readiness_reports_credentials_presence_without_network():
    """Readiness check must report credential state without making cloud calls."""
    # 1. Unauthenticated session
    mock_session_unauth = MagicMock()
    mock_session_unauth.get_credentials.return_value = None

    readiness_unauth = check_readiness(
        region="us-east-1",
        model_id="anthropic.claude-3-haiku-20240307-v1:0",
        session=mock_session_unauth,
    )
    assert readiness_unauth["has_credentials"] is False
    assert readiness_unauth["is_ready_for_invocation"] is False
    assert readiness_unauth["configured_region"] == "us-east-1"

    # 2. Authenticated mock session
    mock_creds = MagicMock()
    mock_creds.method = "env"
    mock_session_auth = MagicMock()
    mock_session_auth.get_credentials.return_value = mock_creds

    readiness_auth = check_readiness(
        region="us-east-1",
        model_id="anthropic.claude-3-haiku-20240307-v1:0",
        session=mock_session_auth,
    )
    assert readiness_auth["has_credentials"] is True
    assert readiness_auth["is_ready_for_invocation"] is True
    assert readiness_auth["credential_method"] == "env"


def test_check_readiness_cli_flag_returns_zero(capsys):
    """CLI flag --check-readiness must exit with 0 and print diagnostics."""
    mock_creds = MagicMock()
    mock_creds.method = "config-file"
    mock_session = MagicMock()
    mock_session.get_credentials.return_value = mock_creds

    with patch("scripts.verify_bedrock_live.boto3.Session", return_value=mock_session):
        exit_code = main(["--check-readiness"])
        assert exit_code == 0

    captured = capsys.readouterr()
    assert "Amazon Bedrock Local Readiness Check" in captured.out
    assert "Credentials Configured:   True" in captured.out


def test_execute_live_verification_single_call_limit():
    """Circuit breaker must strictly disallow more than MAX_INVOCATIONS_ALLOWED calls."""
    mock_client = MagicMock()
    mock_client.invoke_model.return_value = {
        "body": _create_mock_streaming_body({
            "content": [{"type": "text", "text": json.dumps({
                "risk_level": "HIGH",
                "risk_score": 90,
                "summary_headline": "Wire Fraud Alert",
                "detailed_explanation": "Impersonation and urgency detected.",
                "detected_warning_signs": [],
                "verification_guidance": {
                    "immediate_action": "Pause and verify.",
                    "pause_recommendation": "Call official branch.",
                    "independent_verification_steps": [],
                    "safe_helplines": [],
                    "cooling_off_advice": "",
                },
                "cooling_off_recommended": True,
                "cooling_off_minutes": 15,
            })}]
        })
    }

    tracker = {"count": 0}

    # First invocation succeeds
    res1 = execute_live_verification(client=mock_client, invocation_tracker=tracker)
    assert res1["status"] == "SUCCESS"
    assert res1["invocations_performed"] == 1
    assert mock_client.invoke_model.call_count == 1

    # Second invocation with same tracker MUST trip circuit breaker
    with pytest.raises(CircuitBreakerError) as exc_info:
        execute_live_verification(client=mock_client, invocation_tracker=tracker)

    assert "Circuit breaker tripped" in str(exc_info.value)
    # The client must NOT have been called a second time
    assert mock_client.invoke_model.call_count == 1


def test_execute_live_verification_success_with_mock_client():
    """Verify structured assessment response parsing from mock client."""
    mock_model_output = {
        "risk_level": "HIGH",
        "risk_score": 95,
        "summary_headline": "CRITICAL RISK: Bank Fraud Safe Account Wire",
        "detailed_explanation": "Impersonation combined with artificial urgency and wire transfer.",
        "detected_warning_signs": [
            {
                "category": "impersonation",
                "severity": "critical",
                "title": "Bank Security Claim",
                "description": "Caller claimed to be Chase Fraud Security.",
                "detected_indicators": ["Chase Fraud Dept"],
            }
        ],
        "verification_guidance": {
            "immediate_action": "STOP AND PAUSE: Do not wire funds.",
            "pause_recommendation": "Call number on your debit card.",
            "independent_verification_steps": ["Verify in branch."],
            "safe_helplines": ["1-833-FRAUD-11"],
            "cooling_off_advice": "Take 15 minutes.",
        },
        "cooling_off_recommended": True,
        "cooling_off_minutes": 15,
    }

    mock_client = MagicMock()
    mock_client.invoke_model.return_value = {
        "body": _create_mock_streaming_body({
            "content": [{"type": "text", "text": json.dumps(mock_model_output)}]
        })
    }

    result = execute_live_verification(
        region="us-east-1",
        model_id="anthropic.claude-3-haiku-20240307-v1:0",
        client=mock_client,
        max_tokens=512,
    )

    assert result["status"] == "SUCCESS"
    assert result["region"] == "us-east-1"
    assert result["model_id"] == "anthropic.claude-3-haiku-20240307-v1:0"
    assert result["invocations_performed"] == 1

    summary = result["assessment_summary"]
    assert summary["risk_level"] == "HIGH"
    assert summary["risk_score"] == 95
    assert summary["summary_headline"] == "CRITICAL RISK: Bank Fraud Safe Account Wire"
    assert summary["warning_signs_count"] == 1
    assert summary["cooling_off_recommended"] is True

    # Verify input untrusted isolation framing and max_tokens=512
    call_kwargs = mock_client.invoke_model.call_args[1]
    payload = json.loads(call_kwargs["body"])
    assert payload["max_tokens"] == 512
    assert "<untrusted_suspicious_message>" in payload["messages"][0]["content"]


def test_execute_live_verification_access_denied_guidance():
    """Verify clean guidance when AWS returns AccessDeniedException."""
    mock_client = MagicMock()
    error_response = {
        "Error": {
            "Code": "AccessDeniedException",
            "Message": "User is not authorized to perform: bedrock:InvokeModel",
        }
    }
    mock_client.invoke_model.side_effect = ClientError(error_response, "InvokeModel")

    result = execute_live_verification(
        region="us-east-1",
        model_id="anthropic.claude-3-haiku-20240307-v1:0",
        client=mock_client,
    )

    assert result["status"] == "FAILED"
    assert result["error_category"] == "AccessDeniedException"
    assert "Amazon Bedrock -> Model Access" in result["guidance"]
    assert result["invocations_performed"] == 1


def test_execute_live_verification_no_credentials_safe_failure():
    """Verify safe handling when session has no credentials."""
    mock_session = MagicMock()
    mock_session.get_credentials.return_value = None

    with patch("scripts.verify_bedrock_live.boto3.Session", return_value=mock_session):
        result = execute_live_verification(client=None)

    assert result["status"] == "FAILED"
    assert result["error_category"] == "NoCredentialsError"
    assert result["invocations_performed"] == 0
    assert "No AWS credentials found" in result["message"]


def test_execute_live_verification_never_exposes_secrets():
    """Ensure returned diagnostics and outputs never contain sensitive tokens or keys."""
    mock_client = MagicMock()
    mock_client.invoke_model.return_value = {
        "body": _create_mock_streaming_body({
            "content": [{"type": "text", "text": json.dumps({
                "risk_level": "LOW",
                "risk_score": 10,
                "summary_headline": "Low Risk Notice",
                "detailed_explanation": "No credentials requested.",
                "detected_warning_signs": [],
                "verification_guidance": {
                    "immediate_action": "Routine notice.",
                    "pause_recommendation": "",
                    "independent_verification_steps": [],
                    "safe_helplines": [],
                    "cooling_off_advice": "",
                },
                "cooling_off_recommended": False,
                "cooling_off_minutes": 0,
            })}]
        })
    }

    result = execute_live_verification(client=mock_client)
    serialized = json.dumps(result)

    # Ensure no common secret tokens or credential patterns appear in serialized output
    assert "aws_secret_access_key" not in serialized.lower()
    assert "aws_session_token" not in serialized.lower()
    assert "authorization" not in serialized.lower()
    assert "x-amz-security-token" not in serialized.lower()
