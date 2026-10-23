import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Lock,
  Search,
  Zap,
  Target,
  Volume2,
  Timer,
  Users,
  FileText,
  ShieldCheck,
  Mic,
  OctagonAlert,
  Info,
  AlertCircle,
  Phone,
  Building2,
  Monitor,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import type {
  AssessmentResponse,
  SyntheticScenario,
  Incident,
} from '../types';
import { ApiService } from '../services/api';
import { ReadAloudPlayer } from './ReadAloudPlayer';
import { VoiceInputButton } from './VoiceInputButton';
import {
  buildAssessmentSpeechText,
  buildAlexaSpokenSummary,
  cancelSpeech,
} from '../utils/speechUtils';

interface ChatAssessmentProps {
  onIncidentCreated: (incident: Incident) => void;
  onOpenCoolingOff: (assessment: AssessmentResponse) => void;
  onOpenTrustedContact: (incident: Incident) => void;
  onOpenReportDraft: (incident: Incident) => void;
}

export const ChatAssessment: React.FC<ChatAssessmentProps> = ({
  onIncidentCreated,
  onOpenCoolingOff,
  onOpenTrustedContact,
  onOpenReportDraft,
}) => {
  const [description, setDescription] = useState('');
  const [claimedCaller, setClaimedCaller] = useState('');
  const [demandedAmount, setDemandedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [channel, setChannel] = useState('phone_call');

  const [scenarios, setScenarios] = useState<SyntheticScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResponse | null>(null);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechMode, setSpeechMode] = useState<'concise' | 'full'>('concise');

  useEffect(() => {
    // Load pre-built synthetic scenarios
    ApiService.getScenarios()
      .then((data) => setScenarios(data))
      .catch(() => {
        // Fallback default scenario presets if backend is temporarily unreachable
        setScenarios([
          {
            id: 'scenario-grandchild',
            title: 'Grandchild in Distress (Bail Scam)',
            claimed_caller: 'Alleged Grandson / Attorney',
            category: 'Family Emergency / Bail Scam',
            prompt_text: "I got a call from someone crying claiming to be my grandson. He said he was in a car crash out of state and is in jail. An 'attorney' then got on the phone and demanded $4,500 in Target gift cards or cash immediately for bail, and told me not to tell his parents because he's embarrassed.",
            demanded_amount: '$4,500',
            payment_method: 'Gift Cards / Cash',
            channel: 'phone_call',
          },
          {
            id: 'scenario-bank-safe-account',
            title: 'Bank Fraud Dept: Safe Account Transfer',
            claimed_caller: 'Chase Bank Fraud Security Dept',
            category: 'Financial Impersonation',
            prompt_text: "Someone called from 'Chase Fraud Department' saying my account has been compromised by an inside employee. They told me I need to immediately wire $12,000 to a 'federal secure reserve safe account' to safeguard my life savings, and warned me not to speak with the branch teller.",
            demanded_amount: '$12,000',
            payment_method: 'Wire Transfer to Safe Account',
            channel: 'phone_call',
          },
          {
            id: 'scenario-tech-support',
            title: 'Tech Support: Virus & AnyDesk Screen Takeover',
            claimed_caller: 'Microsoft Windows Security / Geek Squad',
            category: 'Tech Support Scam',
            prompt_text: "A popup on my computer said I had a fatal Trojan virus and gave a phone number. When I called, the technician told me to install AnyDesk so he could clean my computer. He then claimed my bank account was breached and asked me to log into my bank so he could verify the refund.",
            demanded_amount: 'Bank credentials / Remote access',
            payment_method: 'Remote Access / Screen Share',
            channel: 'phone_call',
          },
          {
            id: 'scenario-irs-arrest',
            title: 'IRS / Police: Immediate Arrest Threat',
            claimed_caller: 'IRS Agent / County Sheriff',
            category: 'Government Impersonation',
            prompt_text: "A man identifying as Officer Miller from the IRS said there is an active warrant for my arrest due to unpaid back taxes. He said if I don't go to a Bitcoin ATM right now and deposit $2,800, police will be dispatched to my house within 30 minutes.",
            demanded_amount: '$2,800',
            payment_method: 'Bitcoin ATM / Crypto',
            channel: 'phone_call',
          },
          {
            id: 'scenario-utility-shutoff',
            title: 'Utility Company: Power Disconnection in 1 Hour',
            claimed_caller: 'Power & Electric Utility Co',
            category: 'Utility Shutoff Threat',
            prompt_text: "The caller claimed to be from the electric utility and said our electricity would be disconnected in 45 minutes because of an overdue bill. They insisted I go to Walgreens immediately and purchase GreenDot MoneyPak or gift cards to pay.",
            demanded_amount: '$650',
            payment_method: 'Prepaid Card / Gift Card',
            channel: 'phone_call',
          },
          {
            id: 'scenario-routine-check',
            title: 'Legitimate Routine Notice (Low Risk Control)',
            claimed_caller: 'Local Bank Branch',
            category: 'Routine Inquiries',
            prompt_text: "My local bank teller mailed an account statement asking me to schedule a routine annual portfolio review at the physical branch next Tuesday. No urgent payment or passwords were requested.",
            demanded_amount: 'None',
            payment_method: 'None',
            channel: 'in_person',
          },
        ]);
      });
  }, []);

  const handleApplyScenario = (scenario: SyntheticScenario) => {
    cancelSpeech();
    setDescription(scenario.prompt_text);
    setClaimedCaller(scenario.claimed_caller);
    setDemandedAmount(scenario.demanded_amount);
    setPaymentMethod(scenario.payment_method);
    setChannel(scenario.channel);
    setAssessmentResult(null);
    setCurrentIncident(null);
    setErrorMessage(null);
  };

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    cancelSpeech();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await ApiService.assessInteraction({
        description,
        claimed_caller: claimedCaller || undefined,
        demanded_amount: demandedAmount || undefined,
        payment_method: paymentMethod || undefined,
        channel,
      });

      setAssessmentResult(result);

      // Automatically record in incident store
      const incident = await ApiService.createIncident({
        assessment: result,
        claimed_caller: claimedCaller || 'Unknown Caller / Contact',
        description,
      });

      setCurrentIncident(incident);
      onIncidentCreated(incident);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during assessment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    cancelSpeech();
    setDescription('');
    setClaimedCaller('');
    setDemandedAmount('');
    setPaymentMethod('');
    setAssessmentResult(null);
    setCurrentIncident(null);
    setErrorMessage(null);
  };

  return (
    <div className="chat-assessment-container">
      {/* Centered Hero Section (MCP Market Inspired Minimalist Aesthetic) */}
      <section className="assessment-hero-section">
        <h1 className="hero-headline">Spot the Scam Before It Costs You.</h1>
        <p className="hero-subtitle">
          Analyze suspicious messages, understand warning signs, and take safer next steps.
        </p>
      </section>

      {/* Prominent Message-Input Panel */}
      <form onSubmit={handleAssessSubmit} className="hero-input-panel">
        {errorMessage && (
          <div className="error-banner" role="alert">
            <AlertTriangle size={16} className="ui-icon-danger" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="input-panel-header">
          <label htmlFor="descriptionInput" className="main-form-label">
            <strong className="label-heading">What did the caller or message say? *</strong>
            <span className="label-helper">Include details about urgency, requested money, gift cards, or threats.</span>
          </label>
          <VoiceInputButton
            onTranscript={(spokenText) => {
              setDescription((prev) => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed} ${spokenText}` : spokenText;
              });
            }}
            disabled={isLoading}
            label="Speak Message"
          />
        </div>

        <textarea
          id="descriptionInput"
          rows={4}
          required
          className="hero-textarea"
          placeholder="Example: Someone claiming to be from my bank called saying my account was compromised, and I needed to wire money to a safe account right now..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Quick Context Fields Grid */}
        <div className="hero-context-grid">
          <div className="context-input-group">
            <label htmlFor="claimedCallerInput">
              Who did they claim to be?
              <span className="context-helper">(Bank, IRS, Grandson)</span>
            </label>
            <input
              id="claimedCallerInput"
              type="text"
              placeholder="e.g. Bank Fraud Dept"
              value={claimedCaller}
              onChange={(e) => setClaimedCaller(e.target.value)}
            />
          </div>

          <div className="context-input-group">
            <label htmlFor="paymentMethodInput">
              Payment method requested:
              <span className="context-helper">(Gift card, Wire, Crypto)</span>
            </label>
            <input
              id="paymentMethodInput"
              type="text"
              placeholder="e.g. Target Gift Cards, Wire"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>

          <div className="context-input-group">
            <label htmlFor="demandedAmountInput">
              Amount of money requested:
              <span className="context-helper">(If specified)</span>
            </label>
            <input
              id="demandedAmountInput"
              type="text"
              placeholder="e.g. $4,000"
              value={demandedAmount}
              onChange={(e) => setDemandedAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Panel Footer Actions */}
        <div className="input-panel-footer">
          <div className="panel-privacy-badge">
            <span className="privacy-icon" aria-hidden="true">
              <Lock size={14} className="ui-icon-navy" />
            </span>
            <span>Zero personal data stored • Evaluated 100% locally</span>
          </div>

          <div className="panel-actions-group">
            {!description.trim() && (
              <span className="btn-disabled-hint" aria-hidden="true">
                Enter message details to evaluate
              </span>
            )}
            <button
              type="button"
              className="btn btn-clear"
              onClick={handleReset}
              disabled={isLoading || (!description && !claimedCaller && !paymentMethod && !demandedAmount)}
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-analyze"
              disabled={isLoading || !description.trim()}
              title={
                !description.trim()
                  ? 'Enter what the caller or message said above to evaluate fraud risk'
                  : 'Check this interaction for scam warning signs'
              }
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  <span>Analyzing Warning Signs...</span>
                </>
              ) : (
                <>
                  <span>Check This Call for Scams</span>
                  <Search size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Test Scenarios (Compact Responsive 6-Card Grid) */}
      <section className="scenario-filter-section" aria-label="Synthetic Test Scenarios">
        <div className="filter-header-row">
          <div className="filter-header-text">
            <h3 className="filter-title">Quick Test Scenarios</h3>
            <p className="filter-subtitle">Select an example below to populate the form and evaluate warning signs instantly:</p>
          </div>
        </div>

        <div className="scenario-cards-grid" role="list">
          {scenarios.map((sc) => {
            const isSelected = description === sc.prompt_text;
            const getIcon = () => {
              switch (sc.id) {
                case 'scenario-grandchild':
                case 'scenario-bail-grandchild':
                  return <Users size={16} className="ui-icon-navy" aria-hidden="true" />;
                case 'scenario-bank-safe-account':
                case 'scenario-bank-wire':
                  return <Building2 size={16} className="ui-icon-navy" aria-hidden="true" />;
                case 'scenario-tech-support':
                  return <Monitor size={16} className="ui-icon-navy" aria-hidden="true" />;
                case 'scenario-irs-arrest':
                  return <ShieldAlert size={16} className="ui-icon-navy" aria-hidden="true" />;
                case 'scenario-utility-shutoff':
                  return <Zap size={16} className="ui-icon-navy" aria-hidden="true" />;
                case 'scenario-routine-check':
                  return <CheckCircle2 size={16} className="ui-icon-navy" aria-hidden="true" />;
                default:
                  return <AlertCircle size={16} className="ui-icon-navy" aria-hidden="true" />;
              }
            };

            return (
              <button
                key={sc.id}
                type="button"
                className={`scenario-card-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleApplyScenario(sc)}
                aria-pressed={isSelected}
              >
                <div className="scenario-card-header">
                  <div className="scenario-card-icon-box" aria-hidden="true">
                    {getIcon()}
                  </div>
                  <div className="scenario-card-headings">
                    <h4 className="scenario-card-title">{sc.title}</h4>
                    <span className="scenario-card-caller">{sc.claimed_caller}</span>
                  </div>
                </div>
                <div className="scenario-card-footer">
                  <span className="scenario-card-badge">{sc.category}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Clean Feature Cards (Shown when no assessment is displayed yet) */}
      {!assessmentResult && (
        <section className="features-grid-section" aria-label="ScamShield Capabilities">
          <div className="features-header">
            <h2 className="features-title">Designed for Calm, Elder-Safe Scam Intervention</h2>
            <p className="features-subtitle">
              Built to interrupt high-pressure psychological manipulation before irreversible financial action.
            </p>
          </div>

          <div className="features-cards-grid">
            <div className="feature-card">
              <div className="feature-icon-box" aria-hidden="true">
                <Target size={22} className="ui-icon-navy" strokeWidth={2} />
              </div>
              <h3 className="feature-card-title">Real-Time Threat Scoring</h3>
              <p className="feature-card-desc">
                Scores interactions 0–100 by screening for manufactured urgency, spoofed authority, and irreversible payment channels.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" aria-hidden="true">
                <Volume2 size={22} className="ui-icon-navy" strokeWidth={2} />
              </div>
              <h3 className="feature-card-title">Elder-Paced Voice Guidance</h3>
              <p className="feature-card-desc">
                Provides simulated Alexa+ spoken verdicts synthesized with calming cadence and clear, unambiguous next steps.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" aria-hidden="true">
                <Timer size={22} className="ui-icon-calm" strokeWidth={2} />
              </div>
              <h3 className="feature-card-title">15-Min Cooling-Off Pause</h3>
              <p className="feature-card-desc">
                A structured physiological pause with breathing guidance to de-escalate high-adrenaline panic before money moves.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" aria-hidden="true">
                <Users size={22} className="ui-icon-navy" strokeWidth={2} />
              </div>
              <h3 className="feature-card-title">Consent-Gated Caregiver Alert</h3>
              <p className="feature-card-desc">
                Drafts structured incident notifications for trusted family members, strictly gated by explicit user consent.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" aria-hidden="true">
                <FileText size={22} className="ui-icon-navy" strokeWidth={2} />
              </div>
              <h3 className="feature-card-title">FTC & Bank Incident Reports</h3>
              <p className="feature-card-desc">
                Generates pre-filled, standardized fraud incident documentation ready to file with ReportFraud.ftc.gov or bank security.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" aria-hidden="true">
                <ShieldCheck size={22} className="ui-icon-navy" strokeWidth={2} />
              </div>
              <h3 className="feature-card-title">Zero PII & Offline Safe</h3>
              <p className="feature-card-desc">
                Runs on local synthetic heuristics without recording calls, storing passwords, or contacting cloud services.
              </p>
            </div>
          </div>
        </section>
      )}


      {/* Assessment Output Display */}
      {assessmentResult && (
        <section className="assessment-results-section" aria-live="polite">
          {/* Result Header Card */}
          <div className={`result-card-header risk-banner-${assessmentResult.risk_level.toLowerCase()}`}>
            <div className="risk-level-badge-group">
              <span className={`risk-badge-large risk-${assessmentResult.risk_level.toLowerCase()}`}>
                {assessmentResult.risk_level} RISK
              </span>
              <span className="risk-score-display">
                Threat Score: <strong>{assessmentResult.risk_score}/100</strong>
              </span>
            </div>

            <h3 className="result-headline">{assessmentResult.summary_headline}</h3>
            <p className="result-explanation">{assessmentResult.detailed_explanation}</p>
          </div>

          {/* ACCESSIBLE READ ALOUD CONTROLS */}
          <div className="narration-selector-card">
            <div className="narration-tabs" role="tablist" aria-label="Spoken audio narration style">
              <button
                type="button"
                role="tab"
                aria-selected={speechMode === 'concise'}
                className={`narration-tab-btn ${speechMode === 'concise' ? 'active' : ''}`}
                onClick={() => {
                  cancelSpeech();
                  setSpeechMode('concise');
                }}
              >
                <Mic size={14} className="ui-icon-navy" />
                <span>Quick Alexa Verdict</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={speechMode === 'full'}
                className={`narration-tab-btn ${speechMode === 'full' ? 'active' : ''}`}
                onClick={() => {
                  cancelSpeech();
                  setSpeechMode('full');
                }}
              >
                <FileText size={14} className="ui-icon-navy" />
                <span>Full Detailed Narration</span>
              </button>
            </div>
            <ReadAloudPlayer
              text={
                speechMode === 'concise'
                  ? buildAlexaSpokenSummary(assessmentResult)
                  : buildAssessmentSpeechText(assessmentResult)
              }
              label={
                speechMode === 'concise'
                  ? 'Read Quick Alexa Verdict Aloud'
                  : 'Read Full Assessment & Safety Advice Aloud'
              }
            />
          </div>

          {/* RISK-CONSISTENT ACTION BANNER */}
          <div className={`immediate-action-card action-card-${assessmentResult.risk_level.toLowerCase()}`}>
            <div className="action-card-icon" aria-hidden="true">
              {assessmentResult.risk_level === 'HIGH' ? (
                <OctagonAlert size={28} className="ui-icon-danger" strokeWidth={2} />
              ) : assessmentResult.risk_level === 'MODERATE' ? (
                <AlertTriangle size={28} className="ui-icon-warning" strokeWidth={2} />
              ) : (
                <Info size={28} className="ui-icon-success" strokeWidth={2} />
              )}
            </div>
            <div className="action-card-text">
              <h4>
                {assessmentResult.risk_level === 'HIGH'
                  ? 'IMMEDIATE PROTECTIVE ACTION:'
                  : assessmentResult.risk_level === 'MODERATE'
                  ? 'RECOMMENDED CAUTION:'
                  : 'RECOMMENDED GUIDANCE:'}
              </h4>
              <p className="primary-action-text">{assessmentResult.verification_guidance.immediate_action}</p>
              <p className="pause-advice-text">{assessmentResult.verification_guidance.pause_recommendation}</p>
            </div>
          </div>

          {/* Detected Warning Signs Breakdown */}
          {assessmentResult.detected_warning_signs.length > 0 && (
            <div className="warning-signs-section">
              <h3 className="section-title">
                <AlertCircle size={18} className="ui-icon-danger" aria-hidden="true" />
                <span> {assessmentResult.detected_warning_signs.length} Scam Warning Signs Identified:</span>
              </h3>
              <div className="warning-signs-grid">
                {assessmentResult.detected_warning_signs.map((flag, idx) => (
                  <div key={idx} className="warning-flag-card">
                    <div className="flag-top">
                      <span className="flag-category-tag">{flag.category.replace('_', ' ').toUpperCase()}</span>
                      <span className={`flag-severity-pill severity-${flag.severity}`}>
                        {flag.severity.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <h4 className="flag-title">{flag.title}</h4>
                    <p className="flag-description">{flag.description}</p>
                    {flag.detected_indicators.length > 0 && (
                      <div className="flag-indicators">
                        <small><strong>Matched Indicators:</strong> {flag.detected_indicators.join(', ')}</small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Independent Verification Guidance */}
          <div className="verification-steps-card">
            <h3 className="section-title">
              <ShieldCheck size={18} className="ui-icon-navy" aria-hidden="true" />
              <span> How to Independently Verify This (Safe Steps):</span>
            </h3>
            <ol className="verification-steps-list">
              {assessmentResult.verification_guidance.independent_verification_steps.map((step, idx) => (
                <li key={idx}>
                  <strong>Step {idx + 1}:</strong> {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Safe Helplines Box */}
          <div className="helpline-directory-box">
            <h4>Free Official Helplines to Call Directly:</h4>
            <ul>
              {assessmentResult.verification_guidance.safe_helplines.map((helpline, idx) => (
                <li key={idx}>
                  <Phone size={14} className="ui-icon-navy" aria-hidden="true" />
                  <span> {helpline}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Toolbar */}
          <div className="intervention-action-bar">
            <h4>Recommended Next Steps:</h4>
            <div className="action-buttons-wrap">
              {assessmentResult.cooling_off_recommended && (
                <button
                  type="button"
                  className="btn btn-calm btn-lg"
                  onClick={() => onOpenCoolingOff(assessmentResult)}
                >
                  <Timer size={18} aria-hidden="true" />
                  <span>Start 15-Minute Voluntary Cooling-Off Pause</span>
                </button>
              )}

              {currentIncident && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={() => onOpenTrustedContact(currentIncident)}
                  >
                    <Users size={18} className="ui-icon-navy" aria-hidden="true" />
                    <span>Alert a Trusted Contact (Consent Required)</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={() => onOpenReportDraft(currentIncident)}
                  >
                    <FileText size={18} className="ui-icon-navy" aria-hidden="true" />
                    <span>Prepare Official Report Draft</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
