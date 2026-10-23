import React, { useState } from 'react';
import {
  Search,
  BarChart3,
  AlertTriangle,
  Timer,
  FileText,
  CheckCircle2,
  Users,
  ClipboardList,
  X,
  OctagonAlert,
} from 'lucide-react';
import type { Incident } from '../types';

interface IncidentDashboardProps {
  incidents: Incident[];
  onSelectIncidentForCoolingOff: (incident: Incident) => void;
  onSelectIncidentForAlert: (incident: Incident) => void;
  onSelectIncidentForReport: (incident: Incident) => void;
  onResolveIncident: (incidentId: string) => void;
  onSwitchToAssess: () => void;
}

export const IncidentDashboard: React.FC<IncidentDashboardProps> = ({
  incidents,
  onSelectIncidentForCoolingOff,
  onSelectIncidentForAlert,
  onSelectIncidentForReport,
  onResolveIncident,
  onSwitchToAssess,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'COOLING_OFF' | 'RESOLVED'>('ALL');
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<Incident | null>(null);

  const totalScreened = incidents.length;
  const highRiskCount = incidents.filter((i) => i.risk_level === 'HIGH').length;
  const activeCoolingOffCount = incidents.filter((i) => i.cooling_off_active || i.status === 'PAUSED_COOLING_OFF').length;
  const reportsDraftedCount = incidents.filter((i) => i.report_drafted || i.status === 'REPORT_DRAFTED').length;

  const filteredIncidents = incidents.filter((incident) => {
    if (filter === 'HIGH') return incident.risk_level === 'HIGH';
    if (filter === 'COOLING_OFF') return incident.cooling_off_active || incident.status === 'PAUSED_COOLING_OFF';
    if (filter === 'RESOLVED') return incident.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="incident-dashboard-container">
      {/* Top Header & Overview */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Incident History & Intervention Log</h2>
          <p className="dashboard-subtitle">
            Review past suspicious inquiries, active cooling-off timers, and drafted reports.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onSwitchToAssess}>
          <Search size={15} aria-hidden="true" />
          <span>Check New Suspicious Request</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-icon" aria-hidden="true">
            <BarChart3 size={24} className="ui-icon-navy" strokeWidth={2} />
          </span>
          <div>
            <div className="metric-value">{totalScreened}</div>
            <div className="metric-label">Total Assessed</div>
          </div>
        </div>

        <div className="metric-card metric-card-danger">
          <span className="metric-icon" aria-hidden="true">
            <AlertTriangle size={24} className="ui-icon-danger" strokeWidth={2} />
          </span>
          <div>
            <div className="metric-value">{highRiskCount}</div>
            <div className="metric-label">High-Risk Interventions</div>
          </div>
        </div>

        <div className="metric-card metric-card-calm">
          <span className="metric-icon" aria-hidden="true">
            <Timer size={24} className="ui-icon-calm" strokeWidth={2} />
          </span>
          <div>
            <div className="metric-value">{activeCoolingOffCount}</div>
            <div className="metric-label">Active Cooling-Off</div>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon" aria-hidden="true">
            <FileText size={24} className="ui-icon-navy" strokeWidth={2} />
          </span>
          <div>
            <div className="metric-value">{reportsDraftedCount}</div>
            <div className="metric-label">Reports Prepared</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="dashboard-filters" role="tablist">
        <span className="filter-label">Filter View:</span>
        <button
          type="button"
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All ({totalScreened})
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'HIGH' ? 'active' : ''}`}
          onClick={() => setFilter('HIGH')}
        >
          <AlertTriangle size={13} className="ui-icon-danger" aria-hidden="true" />
          <span>High Risk ({highRiskCount})</span>
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'COOLING_OFF' ? 'active' : ''}`}
          onClick={() => setFilter('COOLING_OFF')}
        >
          <Timer size={13} className="ui-icon-calm" aria-hidden="true" />
          <span>Paused / Cooling-Off ({activeCoolingOffCount})</span>
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'RESOLVED' ? 'active' : ''}`}
          onClick={() => setFilter('RESOLVED')}
        >
          <CheckCircle2 size={13} className="ui-icon-success" aria-hidden="true" />
          <span>Resolved</span>
        </button>
      </div>

      {/* Incident List */}
      <div className="incidents-list">
        {filteredIncidents.length === 0 ? (
          <div className="empty-state">
            <p>No incidents match the selected filter.</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isHigh = incident.risk_level === 'HIGH';
            const isCooling = incident.cooling_off_active || incident.status === 'PAUSED_COOLING_OFF';

            return (
              <div
                key={incident.id}
                className={`incident-card ${isHigh ? 'border-danger' : ''} ${isCooling ? 'border-calm' : ''}`}
              >
                <div className="incident-card-top">
                  <div className="incident-tags">
                    <span className={`risk-pill risk-${incident.risk_level.toLowerCase()}`}>
                      {incident.risk_level} RISK ({incident.risk_score}/100)
                    </span>
                    <span className={`status-pill status-${incident.status.toLowerCase()}`}>
                      {incident.status.replace('_', ' ')}
                    </span>
                    <span className="id-pill">{incident.id}</span>
                  </div>
                  <span className="incident-time">
                    {new Date(incident.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="incident-caller-row">
                  <strong>Claimed Caller:</strong> {incident.claimed_caller}
                </div>

                <p className="incident-snippet">"{incident.description_snippet}"</p>

                {incident.assessment?.detected_warning_signs?.length > 0 && (
                  <div className="incident-flags-summary">
                    <span className="flags-label">Warning Signs:</span>
                    {incident.assessment.detected_warning_signs.map((flag, idx) => (
                      <span key={idx} className="warning-chip">
                        <AlertTriangle size={12} className="ui-icon-danger" aria-hidden="true" />
                        <span>{flag.title}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="incident-card-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedIncidentDetail(incident)}
                  >
                    <Search size={13} className="ui-icon-navy" aria-hidden="true" />
                    <span>View Full Assessment</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectIncidentForCoolingOff(incident)}
                  >
                    <Timer size={13} className="ui-icon-calm" aria-hidden="true" />
                    <span>Cooling-Off Pause</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectIncidentForAlert(incident)}
                  >
                    <Users size={13} className="ui-icon-navy" aria-hidden="true" />
                    <span>Alert Trusted Contact</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectIncidentForReport(incident)}
                  >
                    <FileText size={13} className="ui-icon-navy" aria-hidden="true" />
                    <span>Draft Report</span>
                  </button>

                  {incident.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onResolveIncident(incident.id)}
                    >
                      <CheckCircle2 size={13} className="ui-icon-success" aria-hidden="true" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incident Detail Drawer / Modal */}
      {selectedIncidentDetail && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container detail-modal">
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon" aria-hidden="true">
                  <ClipboardList size={22} className="ui-icon-navy" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="modal-title">Incident Details: {selectedIncidentDetail.id}</h2>
                  <p className="modal-subtitle">Claimed Caller: {selectedIncidentDetail.claimed_caller}</p>
                </div>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedIncidentDetail(null)}
                aria-label="Close details"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="modal-body">
              <div className="assessment-card-headline">
                <h3>{selectedIncidentDetail.assessment.summary_headline}</h3>
                <p>{selectedIncidentDetail.assessment.detailed_explanation}</p>
              </div>

              <div className="detail-section">
                <h4>
                  <OctagonAlert size={16} className="ui-icon-danger" aria-hidden="true" />
                  <span> Immediate Safety Guidance</span>
                </h4>
                <div className="safety-callout">
                  {selectedIncidentDetail.assessment.verification_guidance.immediate_action}
                </div>
              </div>

              <div className="detail-section">
                <h4>Independent Verification Steps:</h4>
                <ul className="guidance-steps-list">
                  {selectedIncidentDetail.assessment.verification_guidance.independent_verification_steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h4>Warning Signs Identified:</h4>
                <div className="flags-detail-list">
                  {selectedIncidentDetail.assessment.detected_warning_signs.map((f, i) => (
                    <div key={i} className="flag-item-card">
                      <strong>
                        <AlertTriangle size={13} className="ui-icon-warning" aria-hidden="true" />
                        <span> {f.title} ({f.severity.toUpperCase()})</span>
                      </strong>
                      <p>{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedIncidentDetail(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const inc = selectedIncidentDetail;
                  setSelectedIncidentDetail(null);
                  onSelectIncidentForReport(inc);
                }}
              >
                <FileText size={15} aria-hidden="true" />
                <span>Prepare Report Draft</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
