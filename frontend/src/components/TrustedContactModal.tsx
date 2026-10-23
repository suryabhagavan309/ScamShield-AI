import React, { useState } from 'react';
import {
  Users,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Info,
} from 'lucide-react';
import type { Incident, AlertResponse } from '../types';
import { ApiService } from '../services/api';

interface TrustedContactModalProps {
  isOpen: boolean;
  incident: Incident | null;
  onClose: () => void;
  onAlertSent?: (response: AlertResponse) => void;
}

export const TrustedContactModal: React.FC<TrustedContactModalProps> = ({
  isOpen,
  incident,
  onClose,
  onAlertSent,
}) => {
  const [contactName, setContactName] = useState('Sarah Miller');
  const [relationship, setRelationship] = useState('Daughter');
  const [phoneOrEmail, setPhoneOrEmail] = useState('(555) 234-5678');
  const [customNote, setCustomNote] = useState('Just checking in to make sure everything is okay.');
  const [explicitConsent, setExplicitConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertResult, setAlertResult] = useState<AlertResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  const handleSimulateSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explicitConsent) {
      setErrorMessage('You must give explicit consent by checking the consent box below.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await ApiService.simulateTrustedContactAlert({
        incident_id: incident.id,
        contact_name: contactName,
        contact_relationship: relationship,
        contact_phone_or_email: phoneOrEmail,
        explicit_consent: explicitConsent,
        custom_message_note: customNote,
      });
      setAlertResult(response);
      if (onAlertSent) {
        onAlertSent(response);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to simulate alert.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setAlertResult(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon" aria-hidden="true">
              <Users size={22} className="ui-icon-navy" strokeWidth={2} />
            </span>
            <div>
              <h2 id="contact-modal-title" className="modal-title">Alert a Trusted Contact</h2>
              <p className="modal-subtitle">Share this suspicious situation with someone you trust for guidance.</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={resetAndClose} aria-label="Close modal">
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {alertResult ? (
            <div className="alert-success-view">
              <div className="success-banner">
                <span className="success-icon" aria-hidden="true">
                  <CheckCircle2 size={24} className="ui-icon-success" strokeWidth={2} />
                </span>
                <div>
                  <h3>Simulated Alert Generated Successfully</h3>
                  <p>In this prototype, no real SMS or email is sent to prevent accidental transmission.</p>
                </div>
              </div>

              <div className="disclaimer-callout">
                <strong>Safety & Privacy Notice:</strong> {alertResult.mock_disclaimer}
              </div>

              <div className="preview-card">
                <h4>Simulated Message Dispatched:</h4>
                <p><strong>Recipient:</strong> {alertResult.recipient_summary}</p>
                <pre className="message-pre">{alertResult.generated_message_preview}</pre>
              </div>

              <div className="guidance-box">
                <p>
                  <Info size={15} className="ui-icon-navy" aria-hidden="true" /> <strong>Tip for you:</strong> You can also copy the message above and paste it directly 
                  into a text message or phone call to {contactName}.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSimulateSend} className="contact-form">
              <div className="prototype-notice-small">
                <Lock size={14} className="ui-icon-navy" aria-hidden="true" /> <strong>Zero PII Retention:</strong> In this prototype, contact details are masked and not stored externally.
              </div>

              {errorMessage && (
                <div className="error-banner" role="alert">
                  <AlertTriangle size={15} className="ui-icon-danger" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactName">Contact's Name:</label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Sarah Miller"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="relationship">Relationship:</label>
                  <select
                    id="relationship"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                  >
                    <option value="Daughter">Daughter</option>
                    <option value="Son">Son</option>
                    <option value="Grandchild">Grandchild</option>
                    <option value="Caregiver">Caregiver</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Trusted Friend">Trusted Friend / Neighbor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phoneOrEmail">Contact Phone or Email (Masked in prototype):</label>
                <input
                  id="phoneOrEmail"
                  type="text"
                  required
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder="e.g. (555) 234-5678 or name@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customNote">Personal Note (Optional):</label>
                <textarea
                  id="customNote"
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Add any specific message for your contact..."
                />
              </div>

              {/* Message Live Preview */}
              <div className="message-preview-container">
                <span className="preview-label">Live Message Preview:</span>
                <div className="preview-bubble">
                  "[ScamShield AI Family Alert] Hello {contactName} ({relationship}), your family member evaluated a suspicious contact claiming to be: '{incident.claimed_caller}'. Risk Assessment: {incident.risk_level} RISK ({incident.risk_score}/100). Recommended Action: STOP PAYMENT & INDEPENDENTLY VERIFY. {customNote ? `Note: "${customNote}"` : ''}"
                </div>
              </div>

              {/* MANDATORY EXPLICIT CONSENT CHECKBOX */}
              <div className="consent-box">
                <label className="consent-checkbox-label">
                  <input
                    type="checkbox"
                    id="consentCheckbox"
                    checked={explicitConsent}
                    onChange={(e) => setExplicitConsent(e.target.checked)}
                  />
                  <span>
                    <strong>I explicitly consent</strong> to simulating this notification to my trusted contact. 
                    I understand that in this prototype, no real SMS or email is transmitted.
                  </span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetAndClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!explicitConsent || isLoading}
                >
                  {isLoading ? (
                    'Simulating Alert...'
                  ) : (
                    <>
                      <CheckCircle2 size={15} aria-hidden="true" />
                      <span>Generate Simulated Alert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {alertResult && (
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={resetAndClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
