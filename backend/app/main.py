"""ScamShield AI - FastAPI Backend Application.

Scam-Intervention Assistant for Older Adults.
Prototype MVP using a clearly labelled mock assessment engine with synthetic heuristics.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.routes_assessment import router as assessment_router
from app.api.routes_incidents import router as incidents_router
from app.api.routes_alerts import router as alerts_router
from app.api.routes_reports import router as reports_router

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "ScamShield AI is an elder-focused scam-intervention assistant. "
        "This initial prototype uses a clearly labelled offline mock assessment engine "
        "with synthetic scenarios. No external AI services, automatic payment blocking, "
        "or call interception features are implemented."
    )
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(assessment_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/health", tags=["Health"])
def health_check():
    """Health status and provider configuration."""
    provider_mode = settings.assessment_provider_mode
    is_mock = provider_mode in ("mock_synthetic", "mock")
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.version,
        "environment": settings.environment,
        "assessment_provider": provider_mode,
        "assessment_engine": settings.engine_label,
        "is_external_ai_connected": not is_mock and settings.is_external_ai_connected,
        "mock_mode": is_mock,
        "bedrock_configuration": {
            "configured_region": settings.aws_region,
            "configured_model_id": settings.aws_bedrock_model_id,
            "fallback_to_mock_enabled": settings.aws_bedrock_fallback_to_mock,
        },
        "safety_guardrails": {
            "automated_banking_actions": False,
            "call_interception": False,
            "store_sensitive_pii": False,
            "real_notifications_dispatched": False,
            "explicit_consent_enforced": True
        }
    }


@app.get("/", tags=["Root"])
def root_overview():
    """Welcome overview and safety disclaimer."""
    return {
        "message": "Welcome to ScamShield AI API (Prototype MVP)",
        "disclaimer": (
            "This application provides educational and intervention guidance. "
            "It does NOT block payments automatically or intercept telephone calls. "
            "If in immediate physical danger, call 911 or local emergency services."
        ),
        "docs_url": "/docs",
        "health_url": "/health"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Fallback error handler to ensure predictable JSON responses."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error occurred.",
            "detail": str(exc),
            "prototype_notice": "Reported by ScamShield AI prototype backend."
        }
    )
