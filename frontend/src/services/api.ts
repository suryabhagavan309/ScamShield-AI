import type {
  AssessmentRequest,
  AssessmentResponse,
  Incident,
  SyntheticScenario,
  AlertRequest,
  AlertResponse,
  ReportDraftRequest,
  ReportDraftResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class ApiService {
  static async checkHealth(): Promise<{ status: string; mock_mode: boolean; service: string }> {
    const res = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with HTTP ${res.status}`);
    }
    return res.json();
  }

  static async assessInteraction(data: AssessmentRequest): Promise<AssessmentResponse> {
    const res = await fetch(`${API_BASE_URL}/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network request failed' }));
      throw new Error(err.detail || `Assessment request failed with HTTP ${res.status}`);
    }
    return res.json();
  }

  static async getScenarios(): Promise<SyntheticScenario[]> {
    const res = await fetch(`${API_BASE_URL}/assess/scenarios`);
    if (!res.ok) {
      throw new Error(`Failed to load synthetic scenarios (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.scenarios;
  }

  static async listIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE_URL}/incidents`);
    if (!res.ok) {
      throw new Error(`Failed to load incident history (HTTP ${res.status})`);
    }
    return res.json();
  }

  static async createIncident(data: {
    assessment: AssessmentResponse;
    claimed_caller: string;
    description: string;
  }): Promise<Incident> {
    const res = await fetch(`${API_BASE_URL}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Failed to record incident (HTTP ${res.status})`);
    }
    return res.json();
  }

  static async updateIncidentCoolingOff(
    incidentId: string,
    coolingActive: boolean,
    durationMinutes: number = 15
  ): Promise<Incident> {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cooling_off_active: coolingActive,
        cooling_off_duration_minutes: durationMinutes,
        status: coolingActive ? 'PAUSED_COOLING_OFF' : 'RESOLVED',
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update cooling-off state (HTTP ${res.status})`);
    }
    return res.json();
  }

  static async simulateTrustedContactAlert(data: AlertRequest): Promise<AlertResponse> {
    const res = await fetch(`${API_BASE_URL}/alerts/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Alert simulation failed' }));
      throw new Error(err.detail || `Alert simulation failed with HTTP ${res.status}`);
    }
    return res.json();
  }

  static async generateReportDraft(data: ReportDraftRequest): Promise<ReportDraftResponse> {
    const res = await fetch(`${API_BASE_URL}/reports/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Report generation failed' }));
      throw new Error(err.detail || `Report draft failed with HTTP ${res.status}`);
    }
    return res.json();
  }
}
