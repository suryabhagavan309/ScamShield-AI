"""API routes for incident history and cooling-off state management."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.models.incident import Incident, IncidentStatus, IncidentUpdateRequest
from app.models.assessment import AssessmentResponse
from app.services.incident_store import incident_store

router = APIRouter(prefix="/incidents", tags=["Incidents"])


class CreateIncidentRequest(BaseModel):
    assessment: AssessmentResponse
    claimed_caller: str
    description: str


@router.get("", response_model=list[Incident])
def list_incidents(
    status: Optional[IncidentStatus] = Query(None, description="Filter by status")
) -> list[Incident]:
    """List incident history, newest first."""
    all_incidents = incident_store.list_incidents()
    if status:
        return [inc for inc in all_incidents if inc.status == status]
    return all_incidents


@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: str) -> Incident:
    """Retrieve details for a single incident."""
    incident = incident_store.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return incident


@router.post("", response_model=Incident, status_code=201)
def create_incident(payload: CreateIncidentRequest) -> Incident:
    """Save an assessed interaction into the incident log."""
    return incident_store.create_incident(
        assessment=payload.assessment,
        claimed_caller=payload.claimed_caller,
        raw_description=payload.description
    )


@router.patch("/{incident_id}", response_model=Incident)
def update_incident(incident_id: str, payload: IncidentUpdateRequest) -> Incident:
    """Update incident status or cooling-off workflow state."""
    updated = incident_store.update_incident(incident_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return updated
