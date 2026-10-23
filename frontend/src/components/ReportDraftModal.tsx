import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Landmark,
  Building2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Lock,
  Download,
  Check,
  Copy,
} from 'lucide-react';
import type { Incident, TargetAgency, ReportDraftResponse } from '../types';
import { ApiService } from '../services/api';

interface ReportDraftModalProps {
  isOpen: boolean;
  incident: Incident | null;
  onClose: () => void;
  onReportDrafted?: (response: ReportDraftResponse) => void;
}

export const ReportDraftModal: React.FC<ReportDraftModalProps> = ({
  isOpen,
  incident,
  onClose,
  onReportDrafted,
}) => {
  const [selectedAgency, setSelectedAgency] = useState<TargetAgency>('FTC_REPORT_FRAUD');
  const [reportData, setReportData] = useState<ReportDraftResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !incident) return;
    let isMounted = true;
    ApiService.generateReportDraft({
      incident_id: incident.id,
      target_agency: selectedAgency,
    })
      .then((res) => {
        if (!isMounted) return;
        setReportData(res);
        setIsLoading(false);
        if (onReportDrafted) onReportDrafted(res);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Failed to generate report draft.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, incident, selectedAgency, onReportDrafted]);

  if (!isOpen || !incident) return null;

  const handleCopy = () => {
    if (reportData?.formatted_report_text) {
      navigator.clipboard.writeText(reportData.formatted_report_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownload = () => {
    if (!reportData) return;
    const blob = new Blob([reportData.formatted_report_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScamShield-Report-${incident.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="modal-container report-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon" aria-hidden="true">
              <FileText size={22} className="ui-icon-navy" strokeWidth={2} />
            </span>
            <div>
              <h2 id="report-modal-title" className="modal-title">Draft Fraud Report for Authorities</h2>
              <p className="modal-subtitle">Pre-formatted structured report ready to submit to fraud investigators.</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {/* Agency Selector Tabs */}
          <div className="agency-tabs">
            <span className="tabs-label">Select Agency:</span>
            <button
              type="button"
              className={`agency-tab-btn ${selectedAgency === 'FTC_REPORT_FRAUD' ? 'active' : ''}`}
              onClick={() => setSelectedAgency('FTC_REPORT_FRAUD')}
            >
              <Landmark size={15} className="ui-icon-navy" aria-hidden="true" />
              <span>FTC Fraud Division</span>
            </button>
            <button
              type="button"
              className={`agency-tab-btn ${selectedAgency === 'BANK_FRAUD_DEPARTMENT' ? 'active' : ''}`}
              onClick={() => setSelectedAgency('BANK_FRAUD_DEPARTMENT')}
            >
              <Building2 size={15} className="ui-icon-navy" aria-hidden="true" />
              <span>Your Bank's Fraud Dept</span>
            </button>
            <button
              type="button"
              className={`agency-tab-btn ${selectedAgency === 'NATIONAL_ELDER_FRAUD_HOTLINE' ? 'active' : ''}`}
              onClick={() => setSelectedAgency('NATIONAL_ELDER_FRAUD_HOTLINE')}
            >
              <ShieldCheck size={15} className="ui-icon-navy" aria-hidden="true" />
              <span>Elder Fraud Hotline</span>
            </button>
            <button
              type="button"
              className={`agency-tab-btn ${selectedAgency === 'LOCAL_POLICE' ? 'active' : ''}`}
              onClick={() => setSelectedAgency('LOCAL_POLICE')}
            >
              <ShieldAlert size={15} className="ui-icon-navy" aria-hidden="true" />
              <span>Local Police Dept</span>
            </button>
          </div>

          {errorMessage && (
            <div className="error-banner" role="alert">
              <AlertTriangle size={15} className="ui-icon-danger" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-state">
              <Loader2 size={20} className="ui-icon-navy animate-spin" aria-hidden="true" />
              <p>Formatting sanitized incident report...</p>
            </div>
          ) : reportData ? (
            <div className="report-content-wrapper">
              <div className="agency-meta-card">
                <h3>{reportData.target_agency_title}</h3>
                <p><strong>Official Submission Channel:</strong> {reportData.official_reporting_portal_or_phone}</p>
                <div className="sanitized-badge">
                  <Lock size={13} className="ui-icon-navy" aria-hidden="true" />
                  <span> {reportData.sanitized_privacy_statement}</span>
                </div>
              </div>

              <div className="report-text-card">
                <div className="report-text-header">
                  <span>Formatted Draft Content:</span>
                  <div className="action-buttons-row">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownload}>
                      <Download size={14} aria-hidden="true" />
                      <span>Download .txt</span>
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check size={14} aria-hidden="true" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} aria-hidden="true" />
                          <span>Copy Report Draft</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <pre className="report-pre">{reportData.formatted_report_text}</pre>
              </div>

              <div className="report-help-card">
                <h4>How to submit this report:</h4>
                <ol>
                  <li>Click <strong>Copy Report Draft</strong> above.</li>
                  <li>Visit or dial <strong>{reportData.official_reporting_portal_or_phone}</strong>.</li>
                  <li>Paste this summary into their description box or read key bullet points over the phone.</li>
                  <li>Keep reference tracking ID <strong>{incident.id}</strong> for your personal records.</li>
                </ol>
              </div>
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
