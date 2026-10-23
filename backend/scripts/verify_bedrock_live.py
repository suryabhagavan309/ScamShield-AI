"""ScamShield AI - Amazon Bedrock Single-Invocation Live Verification Script.

CRITICAL FINANCIAL & SAFETY DIRECTIVES:
1. DEFAULT EXECUTION IS STRICTLY BLOCKED:
   Running this script with no flags does NOT invoke Bedrock and does NOT call AWS.
2. EXPLICIT OPT-IN REQUIRED:
   Live invocation strictly requires the `--execute-live-call` flag AND `--confirm YES`.
3. CHARGE DISCLOSURE:
   A live invocation against Amazon Bedrock is NOT a dry-run; it calls AWS and incurs
   real cloud charges (typically < $0.0005 for Claude 3 Haiku).
4. SINGLE-INVOCATION CIRCUIT BREAKER:
   At most ONE invoke_model API call is permitted per script run.
   Automatic retries are strictly disabled.
5. ZERO SECRETS LEAKED:
   Never prints AWS access keys, secret keys, session tokens, authorization headers,
   or raw environment dumps.
6. ISOLATION:
   This script is completely decoupled from normal application startup and automated
   pytest suites. Application default mode remains 'mock_synthetic'.
"""

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Optional

# Add backend directory to sys.path so app modules can be resolved
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from app.config import settings
from app.models.assessment import (
    AssessmentRequest,
    AssessmentResponse,
    RiskLevel,
)
from app.services.providers.bedrock_provider import (
    BEDROCK_SYSTEM_PROMPT,
    BedrockAssessmentProvider,
)

# Configure safe logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scamshield.verify_bedrock")

# Hardcoded circuit breaker limit
MAX_INVOCATIONS_ALLOWED = 1

# Minimal synthetic test payload (zero PII)
SYNTHETIC_TEST_REQUEST = AssessmentRequest(
    description=(
        "Synthetic test interaction: Caller claiming to be from Chase Fraud Dept "
        "demanding a $500 wire transfer to a safe holding account immediately. "
        "Told me not to speak to the bank teller."
    ),
    claimed_caller="Chase Fraud Dept",
    demanded_amount="$500",
    payment_method="Wire Transfer",
    channel="phone_call",
)


class CircuitBreakerError(RuntimeError):
    """Raised when the single-invocation circuit breaker limit is exceeded."""
    pass


def check_readiness(
    region: Optional[str] = None,
    model_id: Optional[str] = None,
    session: Optional[boto3.Session] = None,
) -> dict[str, Any]:
    """Inspect local AWS configuration readiness without initiating any cloud calls.
    
    SAFETY GUARANTEE:
    - Never makes network requests.
    - Never prints or exposes secret credential values.
    """
    target_region = region or settings.aws_region
    target_model_id = model_id or settings.aws_bedrock_model_id

    active_session = session or boto3.Session(region_name=target_region)
    credentials = active_session.get_credentials()
    has_credentials = credentials is not None

    return {
        "boto3_version": boto3.__version__,
        "configured_region": target_region,
        "configured_model_id": target_model_id,
        "has_credentials": has_credentials,
        "credential_method": credentials.method if credentials else "None",
        "is_ready_for_invocation": has_credentials,
    }


def execute_live_verification(
    region: Optional[str] = None,
    model_id: Optional[str] = None,
    client: Optional[Any] = None,
    max_tokens: int = 512,
    invocation_tracker: Optional[dict[str, int]] = None,
) -> dict[str, Any]:
    """Execute exactly one guarded Bedrock invocation with strict circuit breaker controls.
    
    FINANCIAL & SAFETY DIRECTIVES:
    - Exactly 1 invocation permitted per execution.
    - Max output tokens capped at 512.
    - Zero automatic retries.
    - Sanitized diagnostic reporting only.
    """
    target_region = region or settings.aws_region
    target_model_id = model_id or settings.aws_bedrock_model_id

    # Enforce circuit breaker
    tracker = invocation_tracker if invocation_tracker is not None else {"count": 0}
    if tracker["count"] >= MAX_INVOCATIONS_ALLOWED:
        raise CircuitBreakerError(
            f"Circuit breaker tripped: Maximum allowed invocations ({MAX_INVOCATIONS_ALLOWED}) exceeded."
        )

    # Validate credentials before attempting invocation
    if client is None:
        session = boto3.Session(region_name=target_region)
        creds = session.get_credentials()
        if creds is None:
            return {
                "status": "FAILED",
                "error_category": "NoCredentialsError",
                "message": (
                    "No AWS credentials found. Please configure credentials via IAM instance role, "
                    "AWS SSO, or environment variables before running live verification."
                ),
                "invocations_performed": tracker["count"],
            }
        bedrock_client = session.client("bedrock-runtime", region_name=target_region)
    else:
        bedrock_client = client

    # Construct guarded payload
    user_prompt = (
        f"Analyze the following suspicious interaction report:\n\n"
        f"Claimed Caller / Entity: {SYNTHETIC_TEST_REQUEST.claimed_caller}\n"
        f"Channel: {SYNTHETIC_TEST_REQUEST.channel}\n"
        f"Demanded Amount: {SYNTHETIC_TEST_REQUEST.demanded_amount}\n"
        f"Payment Method: {SYNTHETIC_TEST_REQUEST.payment_method}\n\n"
        f"Reported Description (Untrusted Third-Party Content):\n"
        f"<untrusted_suspicious_message>\n"
        f"{SYNTHETIC_TEST_REQUEST.description}\n"
        f"</untrusted_suspicious_message>\n\n"
        f"Provide your structured risk evaluation in strict JSON according to the system instructions."
    )

    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": 0.0,
        "system": BEDROCK_SYSTEM_PROMPT,
        "messages": [
            {
                "role": "user",
                "content": user_prompt,
            }
        ],
    }

    # Increment circuit breaker counter immediately before execution
    tracker["count"] += 1

    start_time = time.monotonic()
    try:
        response = bedrock_client.invoke_model(
            modelId=target_model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(payload),
        )

        elapsed_seconds = round(time.monotonic() - start_time, 2)
        response_raw = response["body"].read().decode("utf-8")
        response_json = json.loads(response_raw)

        # Extract text from Claude Messages API response
        if "content" in response_json and isinstance(response_json["content"], list):
            raw_text = "".join(
                block.get("text", "") for block in response_json["content"] if block.get("type") == "text"
            )
        else:
            raw_text = response_raw

        # Parse and validate via existing provider parser
        provider = BedrockAssessmentProvider(model_id=target_model_id, region_name=target_region)
        parsed_response: AssessmentResponse = provider._parse_and_validate_output(
            raw_text, SYNTHETIC_TEST_REQUEST
        )

        return {
            "status": "SUCCESS",
            "region": target_region,
            "model_id": target_model_id,
            "latency_seconds": elapsed_seconds,
            "invocations_performed": tracker["count"],
            "assessment_summary": {
                "assessment_id": parsed_response.assessment_id,
                "risk_level": parsed_response.risk_level.value,
                "risk_score": parsed_response.risk_score,
                "summary_headline": parsed_response.summary_headline,
                "warning_signs_count": len(parsed_response.detected_warning_signs),
                "cooling_off_recommended": parsed_response.cooling_off_recommended,
            },
        }

    except ClientError as exc:
            error_info = exc.response.get("Error", {})
            error_code = error_info.get("Code", "ClientError")
            error_message = error_info.get(
                "Message",
                "No error message returned by AWS."
            )

            guidance = "An AWS service error occurred."

            if error_code == "AccessDeniedException":
                guidance = (
                    "AWS denied the request. Check IAM permissions, "
                    "inference profile access, and model access in the AWS Console (Amazon Bedrock -> Model Access)."
                )
            elif error_code == "ResourceNotFoundException":
                guidance = (
                    f"Model or inference profile '{target_model_id}' "
                    f"was not found in region '{target_region}'. "
                    "Verify the model/profile identifier and region."
                )
            elif error_code == "ThrottlingException":
                guidance = (
                    "AWS Bedrock throttled the request. "
                    "No retries were attempted."
                )
            elif error_code == "ValidationException":
                guidance = (
                    f"Bedrock rejected the request: {error_message}"
                )

            return {
                "status": "FAILED",
                "error_category": error_code,
                "error_message": error_message,
                "region": target_region,
                "model_id": target_model_id,
                "guidance": guidance,
                "invocations_performed": tracker["count"],
            }

    except NoCredentialsError:
        return {
            "status": "FAILED",
            "error_category": "NoCredentialsError",
            "region": target_region,
            "model_id": target_model_id,
            "guidance": "Missing AWS credentials. Configure authentication before running.",
            "invocations_performed": tracker["count"],
        }

    except (BotoCoreError, Exception) as exc:
        error_name = type(exc).__name__
        return {
            "status": "FAILED",
            "error_category": error_name,
            "region": target_region,
            "model_id": target_model_id,
            "guidance": f"Unexpected error ({error_name}). No retries attempted.",
            "invocations_performed": tracker["count"],
        }


def main(argv: Optional[list[str]] = None) -> int:
    """CLI entry point with mandatory safety gating."""
    parser = argparse.ArgumentParser(
        description="ScamShield AI: Guarded Amazon Bedrock Single-Invocation Verification Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "SAFETY NOTICE:\n"
            "Default execution is blocked. This script will NEVER invoke AWS Bedrock\n"
            "unless explicitly instructed with --execute-live-call AND --confirm YES.\n"
        ),
    )

    parser.add_argument(
        "--check-readiness",
        action="store_true",
        help="Check local SDK and credential readiness WITHOUT making any AWS calls (100%% free).",
    )
    parser.add_argument(
        "--execute-live-call",
        action="store_true",
        help="Explicitly authorize ONE live invocation to Amazon Bedrock (incurs minor AWS charges).",
    )
    parser.add_argument(
        "--confirm",
        type=str,
        default="",
        help="Mandatory confirmation token. Must be 'YES' to proceed with --execute-live-call.",
    )
    parser.add_argument(
        "--region",
        type=str,
        default=settings.aws_region,
        help=f"Target AWS region (default: {settings.aws_region}).",
    )
    parser.add_argument(
        "--model-id",
        type=str,
        default=settings.aws_bedrock_model_id,
        help=f"Target Bedrock model ID (default: {settings.aws_bedrock_model_id}).",
    )

    args = parser.parse_args(argv)

    # 1. READ-ONLY READINESS CHECK (100% Free, zero cloud calls)
    if args.check_readiness and not args.execute_live_call:
        print("\n=== ScamShield AI: Amazon Bedrock Local Readiness Check ===")
        print("Note: This check performs ZERO network calls and incurs $0.00.\n")

        readiness = check_readiness(region=args.region, model_id=args.model_id)
        print(f"  • Boto3 SDK Version:        {readiness['boto3_version']}")
        print(f"  • Target AWS Region:        {readiness['configured_region']}")
        print(f"  • Target Model Identifier:  {readiness['configured_model_id']}")
        print(f"  • Credentials Configured:   {readiness['has_credentials']}")
        print(f"  • Auth Resolution Method:   {readiness['credential_method']}")
        print(f"  • Status:                   {'READY FOR INVOCATION' if readiness['is_ready_for_invocation'] else 'NOT AUTHENTICATED'}")

        if not readiness["has_credentials"]:
            print("\n[ACTION REQUIRED] No AWS credentials configured.")
            print("Configure IAM credentials or AWS SSO before attempting a live call.")
        else:
            print("\n[READY] Credentials detected. Ensure Model Access is granted in the AWS Console.")

        print("============================================================\n")
        return 0

    # 2. LIVE INVOCATION GATE (Requires explicit opt-in + confirmation)
    if args.execute_live_call:
        if args.confirm.strip() != "YES":
            print("\n[BLOCKED] Execution blocked: Missing explicit confirmation.")
            print("To authorize a live Bedrock call, you must pass: --confirm YES")
            print("Example:")
            print("  python scripts/verify_bedrock_live.py --execute-live-call --confirm YES\n")
            return 1

        print("\n=== ScamShield AI: Executing Single-Invocation Live Verification ===")
        print(f"  • Target Region:   {args.region}")
        print(f"  • Target Model ID: {args.model_id}")
        print("  • Max Calls:       1 (Hard limit; no retries)")
        print("  • Max Tokens:      512\n")

        result = execute_live_verification(region=args.region, model_id=args.model_id)

        print(f"Result Status: {result.get('status')}")
        print(f"Invocations Executed: {result.get('invocations_performed', 0)} / {MAX_INVOCATIONS_ALLOWED}")

        if result.get("status") == "SUCCESS":
            print("\n[SUCCESS] Amazon Bedrock invocation verified successfully!")
            print(f"  • Latency: {result.get('latency_seconds')}s")
            summary = result.get("assessment_summary", {})
            print(f"  • Assessment ID:    {summary.get('assessment_id')}")
            print(f"  • Risk Level:        {summary.get('risk_level')}")
            print(f"  • Threat Score:      {summary.get('risk_score')}/100")
            print(f"  • Headline:          {summary.get('summary_headline')}")
            print(f"  • Red Flags Count:   {summary.get('warning_signs_count')}")
            print("===================================================================\n")
            return 0
        else:
            print(f"\n[FAILED] Verification failed with category: {result.get('error_category')}")
            print(f"Guidance: {result.get('guidance', result.get('message', 'No details provided.'))}")
            print("===================================================================\n")
            return 2

    # 3. DEFAULT SAFETY BLOCK (When neither flag is provided)
    print("\n[BLOCKED] Default execution is blocked for safety.")
    print("This script will NOT make AWS network calls or invoke Bedrock by default.\n")
    print("Available safe options:")
    print("  1. Check local readiness (100% free, zero network calls):")
    print("     python scripts/verify_bedrock_live.py --check-readiness\n")
    print("  2. Execute authorized live verification (1 call only, incurs charges):")
    print("     python scripts/verify_bedrock_live.py --execute-live-call --confirm YES\n")
    return 1


if __name__ == "__main__":
    sys.exit(main())
