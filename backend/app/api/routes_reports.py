"""API routes for official fraud report drafting."""

from fastapi import APIRouter
from app.models.report import ReportDraftRequest, ReportDraftResponse
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Report Drafting"])


@router.post("/draft", response_model=ReportDraftResponse)
def generate_report_draft(request: ReportDraftRequest) -> ReportDraftResponse:
    """Generate a structured, sanitized fraud incident report ready for submission to authorities."""
    return ReportService.generate_draft(request)
