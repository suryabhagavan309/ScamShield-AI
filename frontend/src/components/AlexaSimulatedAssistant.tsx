import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Square,
  AlertTriangle,
  Zap,
  Sparkles,
  Shield,
  User,
  Bot,
  OctagonAlert,
  CheckCircle2,
  Cog,
  ShieldCheck,
  FileCheck,
  Timer,
  Users,
  FileText,
  ArrowRightLeft,
  ShieldAlert,
  RotateCcw,
  ListChecks,
} from 'lucide-react';
import type {
  AssessmentResponse,
  SyntheticScenario,
  Incident,
} from '../types';
import { ApiService } from '../services/api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import {
  buildAlexaSpokenSummary,
  cancelSpeech,
  cleanTextForSpeech,
} from '../utils/speechUtils';

export interface AlexaSimulatedAssistantProps {
  onIncidentCreated: (incident: Incident) => void;
  onOpenCoolingOff: (assessment: AssessmentResponse) => void;
  onOpenTrustedContact: (incident: Incident) => void;
  onOpenReportDraft: (incident: Incident) => void;
  onSwitchToStandardMode?: () => void;
}

type AssistantState = 'idle' | 'listening' | 'analyzing' | 'speaking' | 'error';

interface DialogueMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  assessment?: AssessmentResponse;
}

/**
 * Builds a clear, concise visual recommendation for display in the assistant chat bubble.
 * Focuses on direct conversational advice, eliminating repetition with the structured
 * risk card, threat score gauge, and detailed heuristics below.
 */
const buildConciseVerdict = (assessment: AssessmentResponse): string => {
  if (assessment.risk_level === 'HIGH') {
    return 'ScamShield recommends hanging up immediately. This interaction matches known financial impersonation and urgency patterns. Review the safety breakdown below before taking any further action.';
  }
  if (assessment.risk_level === 'MODERATE') {
    return 'ScamShield advises caution. This interaction contains unverified claims. Please review the highlighted warning signs below before responding or sharing any information.';
  }
  return 'ScamShield detected no acute fraud hallmarks. Standard verification is recommended as detailed below.';
};

export const AlexaSimulatedAssistant: React.FC<AlexaSimulatedAssistantProps> = ({
  onIncidentCreated,
  onOpenCoolingOff,
  onOpenTrustedContact,
  onOpenReportDraft,
  onSwitchToStandardMode,
}) => {
  // Input fields
  const [description, setDescription] = useState('');
  const [claimedCaller, setClaimedCaller] = useState('');
  const [demandedAmount, setDemandedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [channel, setChannel] = useState('phone_call');

  // Assistant states
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResponse | null>(null);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [scenarios, setScenarios] = useState<SyntheticScenario[]>([]);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueMessage[]>([]);

  // Speech hooks
  const {
    isSupported: isSTTSupported,
    isListening,
    interimTranscript,
    errorMessage: sttError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (spokenText) => {
      if (spokenText && spokenText.trim()) {
        setDescription((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${spokenText.trim()}` : spokenText.trim();
        });
      }
    },
  });

  const {
    isSupported: isTTSSupported,
    status: speechStatus,
    speak,
    stop: stopTTS,
  } = useSpeechSynthesis();

  // Load scenarios on mount
  useEffect(() => {
    let isMounted = true;
    ApiService.getScenarios()
      .then((data) => {
        if (isMounted) setScenarios(data);
      })
      .catch(() => {
        if (isMounted) {
          setScenarios([
            {
              id: 'scenario-grandchild',
              title: 'Grandchild in Distress (Bail Scam)',
              claimed_caller: 'Grandson / Bail Attorney',
              category: 'Family Emergency',
              prompt_text:
                "Caller claiming to be my grandson said he was in a car accident and in jail. He needs $4,500 in Target gift cards right now for bail. Told me not to tell his parents.",
              demanded_amount: '$4,500',
              payment_method: 'Gift Cards',
              channel: 'phone_call',
            },
            {
              id: 'scenario-bank-safe-account',
              title: 'Bank Fraud Safe Account Wire',
              claimed_caller: 'Chase Bank Fraud Security',
              category: 'Bank Impersonation',
              prompt_text:
                "Caller claimed my bank account was compromised and told me to wire $12,000 immediately to a safe holding account, warning me not to speak to the teller.",
              demanded_amount: '$12,000',
              payment_method: 'Wire Transfer',
              channel: 'phone_call',
            },
            {
              id: 'scenario-tech-support',
              title: 'Tech Support AnyDesk Virus Scam',
              claimed_caller: 'Microsoft Support',
              category: 'Tech Support',
              prompt_text:
                "Computer popped up warning of trojan virus. Technician told me to install AnyDesk and log into my bank account to get a refund.",
              demanded_amount: 'Bank Access',
              payment_method: 'Remote Screen Share',
              channel: 'phone_call',
            },
            {
              id: 'scenario-routine-bank-notice',
              title: 'Routine Bank Notice (Low Risk)',
              claimed_caller: 'Local Bank Branch',
              category: 'Routine Notice',
              prompt_text:
                "My local bank teller mailed an account statement asking me to schedule a routine annual portfolio review at the physical branch next Tuesday. No urgent payment or passwords were requested.",
              demanded_amount: 'None',
              payment_method: 'None',
              channel: 'in_person',
            },
          ]);
        }
      });

    return () => {
      isMounted = false;
      cancelSpeech();
    };
  }, []);

  // Compute ring state
  let ringState: AssistantState = 'idle';
  if (isLoading) {
    ringState = 'analyzing';
  } else if (isListening) {
    ringState = 'listening';
  } else if (speechStatus === 'playing') {
    ringState = 'speaking';
  } else if (errorMessage || sttError) {
    ringState = 'error';
  }

  // Handle core assessment flow
  const executeAssessment = useCallback(
    async (textToAssess: string, caller?: string, amount?: string, payment?: string, chan?: string) => {
      if (!textToAssess.trim()) return;

      cancelSpeech();
      stopListening();
      setIsLoading(true);
      setErrorMessage(null);

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMessage: DialogueMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: textToAssess.trim(),
        timestamp,
      };

      setDialogueHistory((prev) => [...prev, userMessage]);

      try {
        const assessment = await ApiService.assessInteraction({
          description: textToAssess.trim(),
          claimed_caller: caller || undefined,
          demanded_amount: amount || undefined,
          payment_method: payment || undefined,
          channel: chan || 'phone_call',
        });

        setAssessmentResult(assessment);

        // Record incident in existing shared store
        const incident = await ApiService.createIncident({
          assessment,
          claimed_caller: caller || 'Unspecified Caller',
          description: textToAssess.trim(),
        });

        setCurrentIncident(incident);
        onIncidentCreated(incident);

        const spokenVerdict = buildAlexaSpokenSummary(assessment);
        const conciseVerdict = buildConciseVerdict(assessment);
        const assistantMessage: DialogueMessage = {
          id: `alexa-${Date.now()}`,
          sender: 'assistant',
          text: conciseVerdict,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          assessment,
        };

        setDialogueHistory((prev) => [...prev, assistantMessage]);

        // Auto-speak ONLY when explicitly enabled by user
        if (autoSpeak && isTTSSupported && spokenVerdict) {
          speak(spokenVerdict);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An error occurred during Alexa+ assessment.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [autoSpeak, isTTSSupported, onIncidentCreated, speak, stopListening]
  );

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    executeAssessment(description, claimedCaller, demandedAmount, paymentMethod, channel);
  };

  const handleApplyPresetScenario = (scenario: SyntheticScenario) => {
    cancelSpeech();
    stopListening();
    setDescription(scenario.prompt_text);
    setClaimedCaller(scenario.claimed_caller);
    setDemandedAmount(scenario.demanded_amount);
    setPaymentMethod(scenario.payment_method);
    setChannel(scenario.channel);
    // Directly run the assessment for judges to test seamlessly in 1 click
    executeAssessment(
      scenario.prompt_text,
      scenario.claimed_caller,
      scenario.demanded_amount,
      scenario.payment_method,
      scenario.channel
    );
  };

  const handleResetSession = () => {
    cancelSpeech();
    stopListening();
    stopTTS();
    resetTranscript();
    setDescription('');
    setClaimedCaller('');
    setDemandedAmount('');
    setPaymentMethod('');
    setAssessmentResult(null);
    setCurrentIncident(null);
    setErrorMessage(null);
    setDialogueHistory([]);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      cancelSpeech();
      stopTTS();
      startListening();
    }
  };

  const handleManualSpeakVerdict = () => {
    if (!assessmentResult) return;
    const spokenVerdict = buildAlexaSpokenSummary(assessmentResult);
    if (speechStatus === 'playing') {
      stopTTS();
    } else {
      speak(spokenVerdict);
    }
  };

  return (
    <div className="alexa-simulation-container" role="region" aria-label="Alexa+ Simulated Assistant Mode">
      {/* Multimodal Echo Show Frame */}
      <section className="alexa-display-frame">
        {/* Device Header Bar */}
        <div className="alexa-display-header">
          <div className="device-brand-info">
            <span className="alexa-brand-dot" aria-hidden="true" />
            <span className="device-brand-title">Echo Show 10 • Alexa+ Multimodal Simulation</span>
            <span className="simulation-badge">Dev Prototype</span>
          </div>

          <div className="alexa-header-controls">
            {/* Auto-Speak Accessible Custom Toggle */}
            <label className="auto-speak-toggle" htmlFor="autoSpeakCheckbox" title="Toggle automatic voice speech synthesis">
              <input
                id="autoSpeakCheckbox"
                type="checkbox"
                className="auto-speak-checkbox"
                checked={autoSpeak}
                onChange={(e) => {
                  setAutoSpeak(e.target.checked);
                  if (!e.target.checked) {
                    cancelSpeech();
                    stopTTS();
                  }
                }}
              />
              <span className="toggle-switch-track" aria-hidden="true">
                <span className="toggle-switch-thumb" />
              </span>
              <span className="toggle-label-text">
                {autoSpeak ? (
                  <>
                    <Volume2 size={15} className="ui-icon-cyan" aria-hidden="true" />
                    <span>Auto-Speak: ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX size={15} className="ui-icon-muted" aria-hidden="true" />
                    <span>Auto-Speak: OFF</span>
                  </>
                )}
              </span>
            </label>

            {onSwitchToStandardMode && (
              <button
                type="button"
                className="btn-switch-mode"
                onClick={() => {
                  cancelSpeech();
                  onSwitchToStandardMode();
                }}
                aria-label="Switch back to Standard Form Mode"
              >
                <ArrowRightLeft size={14} aria-hidden="true" />
                <span>Switch to Standard Mode</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Listening Ring & Assistant Status */}
        <div className="alexa-ring-stage">
          <div className={`alexa-ring-wrapper state-${ringState}`}>
            <button
              type="button"
              className="alexa-glow-ring"
              onClick={handleToggleListening}
              disabled={isLoading}
              aria-label={
                isListening
                  ? 'Listening for voice input. Click to finish speaking.'
                  : 'Alexa is ready. Click to speak with microphone.'
              }
              aria-pressed={isListening}
            >
              {/* Inner animated ring contents */}
              <div className="ring-inner-core">
                {ringState === 'idle' && <Mic size={32} className="ring-icon-symbol" strokeWidth={2} />}
                {ringState === 'listening' && (
                  <div className="wave-bars-container" aria-hidden="true">
                    <span className="wave-bar bar-1" />
                    <span className="wave-bar bar-2" />
                    <span className="wave-bar bar-3" />
                    <span className="wave-bar bar-4" />
                    <span className="wave-bar bar-5" />
                  </div>
                )}
                {ringState === 'analyzing' && <div className="ring-spinner" aria-hidden="true" />}
                {ringState === 'speaking' && (
                  <div className="speaking-audio-pulse" aria-hidden="true">
                    <Volume2 size={32} strokeWidth={2} />
                  </div>
                )}
                {ringState === 'error' && <AlertTriangle size={32} className="ring-icon-symbol ui-icon-danger" strokeWidth={2} />}
              </div>
            </button>
          </div>

          {/* Assistant Status Text */}
          <div className="alexa-status-banner" aria-live="polite">
            <span className={`status-pill status-${ringState}`}>
              {ringState === 'idle' && 'IDLE • SAY OR TYPE YOUR CALL DETAILS'}
              {ringState === 'listening' && 'LISTENING • MICROPHONE RECORDING...'}
              {ringState === 'analyzing' && 'ANALYZING • SCANNING FRAUD INDICATORS...'}
              {ringState === 'speaking' && 'SPEAKING • AUDIO VERDICT PLAYING...'}
              {ringState === 'error' && 'NOTICE • PLEASE REVIEW INPUT'}
            </span>
            <p className="status-hint">
              {ringState === 'idle' && 'Tap the ring or type what someone said to evaluate fraud risk.'}
              {ringState === 'listening' && 'Speak clearly. When done, tap the ring again or click Ask Alexa+.'}
              {ringState === 'analyzing' && 'Evaluating threat vectors against impersonation, urgency, and payment hallmarks...'}
              {ringState === 'speaking' && 'Listening to Alexa+ safety verdict. Click Stop Audio anytime.'}
              {ringState === 'error' && (errorMessage || sttError || 'An error occurred.')}
            </p>
          </div>
        </div>

        {/* Judge / Demo Presets (1-Click Test Without Mic) */}
        <div className="alexa-presets-bar">
          <div className="presets-header">
            <span className="presets-label">
              <Zap size={14} className="ui-icon-cyan" aria-hidden="true" />
              <span> Hackathon Judge Quick-Test Presets (No microphone required):</span>
            </span>
          </div>
          <div className="preset-chips-scroll">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                type="button"
                className="alexa-preset-chip"
                onClick={() => handleApplyPresetScenario(sc)}
                disabled={isLoading}
              >
                <span>{sc.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Dock (Speech Preview + Fallback Textarea) */}
        <form onSubmit={handleSubmitForm} className="alexa-input-dock">
          {/* Real-time Interim Voice Preview */}
          {isListening && interimTranscript && (
            <div className="alexa-interim-box" aria-live="polite">
              <span className="interim-tag">Hearing:</span>
              <span className="interim-text">"{interimTranscript}"</span>
            </div>
          )}

          {/* Fallback Speech Recognition Error Notice */}
          {sttError && (
            <div className="alexa-error-bar" role="alert">
              <span>
                <AlertTriangle size={14} className="ui-icon-danger" aria-hidden="true" />
                <span> {sttError}</span>
              </span>
              <button
                type="button"
                className="btn-dismiss-stt"
                onClick={resetTranscript}
                aria-label="Dismiss speech error notice"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span> Dismiss</span>
              </button>
            </div>
          )}

          {!isSTTSupported && (
            <div className="alexa-unsupported-note">
              <MicOff size={14} className="ui-icon-muted" aria-hidden="true" />
              <span> Voice input is not supported in this browser. Please type your call description below.</span>
            </div>
          )}

          <div className="dock-input-row">
            <textarea
              id="alexaDescriptionInput"
              rows={2}
              className="alexa-text-input"
              placeholder="Describe what the caller said (e.g. 'Caller claims my grandson is in jail and needs $4,500 in Target gift cards right now for bail')..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              required
            />

            <div className="dock-actions">
              <button
                type="button"
                className={`btn-mic-toggle ${isListening ? 'active-listening' : ''}`}
                onClick={handleToggleListening}
                disabled={isLoading || !isSTTSupported}
                aria-label={isListening ? 'Stop microphone listening' : 'Start microphone listening'}
              >
                {isListening ? (
                  <>
                    <Square size={15} aria-hidden="true" />
                    <span>Stop Listening</span>
                  </>
                ) : (
                  <>
                    <Mic size={15} aria-hidden="true" />
                    <span>Speak</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                className="btn-alexa-submit"
                disabled={isLoading || !description.trim()}
                aria-label="Submit call details for Alexa+ multimodal safety assessment"
              >
                {isLoading ? (
                  <>
                    <span className="ring-spinner btn-spin" aria-hidden="true" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} aria-hidden="true" />
                    <span>Ask Alexa+</span>
                  </>
                )}
              </button>

              {(description || assessmentResult) && (
                <button
                  type="button"
                  className="btn-alexa-clear"
                  onClick={handleResetSession}
                  disabled={isLoading}
                  aria-label="Clear current input and dialogue session"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Multimodal Dialogue Canvas */}
        <div className="alexa-dialogue-canvas" aria-live="polite">
          {dialogueHistory.length === 0 && !assessmentResult && (
            <div className="empty-dialogue-placeholder">
              <div className="placeholder-icon">
                <Shield size={36} className="ui-icon-cyan" strokeWidth={1.8} />
              </div>
              <h3>Ready to Screen Suspicious Contacts</h3>
              <p>
                Say <em>"Alexa, someone just called about my grandson"</em> or click one of the quick test
                presets above to experience the multimodal safety assessment.
              </p>
            </div>
          )}

          {/* Dialogue Conversation Turns */}
          {dialogueHistory.map((msg) => (
            <div key={msg.id} className={`dialogue-turn turn-${msg.sender}`}>
              <div className="turn-avatar" aria-hidden="true">
                {msg.sender === 'user' ? (
                  <User size={18} strokeWidth={2} />
                ) : (
                  <Bot size={18} strokeWidth={2} />
                )}
              </div>

              <div className="turn-bubble">
                <div className="bubble-header">
                  <div className="sender-meta">
                    <span className="sender-name">{msg.sender === 'user' ? 'You' : 'Alexa+ Assistant'}</span>
                    {msg.sender === 'assistant' && (
                      <span className="assistant-badge">Multimodal Analysis</span>
                    )}
                  </div>
                  <span className="message-time">{msg.timestamp}</span>
                </div>

                <div className="bubble-content">
                  {msg.sender === 'assistant' ? (
                    <p className="concise-verdict">{msg.text}</p>
                  ) : (
                    <p className="user-message-text">{msg.text}</p>
                  )}
                </div>

                {/* Multimodal Assessment Card for Assistant Turn */}
                {msg.sender === 'assistant' && msg.assessment && (
                  <div className="alexa-multimodal-card">
                    {/* Visual Risk Badge and Threat Score Gauge */}
                    <div className={`card-risk-strip risk-${msg.assessment.risk_level.toLowerCase()}`}>
                      <div className="risk-level-tag">
                        <span className="risk-icon" aria-hidden="true">
                          {msg.assessment.risk_level === 'HIGH' ? (
                            <OctagonAlert size={18} className="ui-icon-danger" strokeWidth={2.2} />
                          ) : msg.assessment.risk_level === 'MODERATE' ? (
                            <AlertTriangle size={18} className="ui-icon-warning" strokeWidth={2.2} />
                          ) : (
                            <CheckCircle2 size={18} className="ui-icon-success" strokeWidth={2.2} />
                          )}
                        </span>
                        <span>{msg.assessment.risk_level} RISK DETECTED</span>
                      </div>

                      <div className="score-meter-box">
                        <div className="score-meter-header">
                          <span className="score-label">Synthetic Threat Score</span>
                          <span className="score-value">{msg.assessment.risk_score}/100</span>
                        </div>
                        <div
                          className="score-bar-track"
                          role="progressbar"
                          aria-valuenow={msg.assessment.risk_score}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Synthetic threat score indicator"
                        >
                          <div
                            className={`score-bar-fill fill-${msg.assessment.risk_level.toLowerCase()}`}
                            style={{ width: `${Math.max(8, msg.assessment.risk_score)}%` }}
                          />
                        </div>
                        <span className="score-disclaimer">
                          Rule-based synthetic heuristic score • Not a calibrated real-world fraud probability
                        </span>
                      </div>
                    </div>

                    <div className="card-headline-group">
                      <h4 className="card-headline">
                        {msg.assessment.risk_level === 'HIGH' ? (
                          <OctagonAlert size={20} className="ui-icon-danger" aria-hidden="true" />
                        ) : msg.assessment.risk_level === 'MODERATE' ? (
                          <AlertTriangle size={20} className="ui-icon-warning" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 size={20} className="ui-icon-success" aria-hidden="true" />
                        )}
                        <span>{cleanTextForSpeech(msg.assessment.summary_headline)}</span>
                      </h4>
                      <p className="card-explanation">{cleanTextForSpeech(msg.assessment.detailed_explanation)}</p>
                    </div>

                    {/* Audio Controls for the verdict */}
                    <div className="alexa-card-audio-controls">
                      <button
                        type="button"
                        className="btn-alexa-audio"
                        onClick={handleManualSpeakVerdict}
                        aria-label={speechStatus === 'playing' ? 'Stop spoken audio playback' : 'Listen to spoken Alexa verdict'}
                      >
                        {speechStatus === 'playing' ? (
                          <>
                            <Square size={14} aria-hidden="true" />
                            <span>Stop Spoken Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={14} aria-hidden="true" />
                            <span>Listen to Spoken Verdict</span>
                          </>
                        )}
                      </button>
                      <span className="audio-helper-note">Elder-paced natural speech synthesis</span>
                    </div>

                    {/* Simulated Demonstrative Events Drawer */}
                    <div className="simulated-events-box" role="region" aria-label="Demonstrative Prototype Events">
                      <div className="events-header">
                        <div className="events-title-wrap">
                          <span className="event-badge">SIMULATED DEMO ONLY</span>
                          <span className="event-subtitle">Visual demonstration of prototype assistant heuristics:</span>
                        </div>
                        <span className="events-disclaimer-tag">Demo Display • No Real Cloud / AWS Triggers</span>
                      </div>
                      <p className="events-disclaimer-note">
                        The actions below are illustrative simulations for educational review. No external cloud tools, telephony monitoring, or bank transactions are executed.
                      </p>
                      <ul className="events-list">
                        <li>
                          <span className="event-bullet">
                            <Cog size={14} className="ui-icon-cyan" aria-hidden="true" />
                          </span>
                          <span><strong>[Simulated Heuristic Check]</strong> Screened input text against local rule-based urgency and coercion patterns</span>
                        </li>
                        <li>
                          <span className="event-bullet">
                            <ShieldCheck size={14} className="ui-icon-cyan" aria-hidden="true" />
                          </span>
                          <span><strong>[Simulated Privacy Guardrail]</strong> Confirmed zero PII or credentials recorded; all heuristics processed locally</span>
                        </li>
                        <li>
                          <span className="event-bullet">
                            <FileCheck size={14} className="ui-icon-cyan" aria-hidden="true" />
                          </span>
                          <span><strong>[Simulated Verification Protocol]</strong> Loaded non-emergency helpline guidance from static reference directory</span>
                        </li>
                      </ul>
                    </div>

                    {/* Detected Warning Signs */}
                    {msg.assessment.detected_warning_signs.length > 0 && (
                      <div className="card-red-flags">
                        <div className="red-flags-header">
                          <ShieldAlert size={16} className="ui-icon-danger" aria-hidden="true" />
                          <h5>Detected Scam Hallmarks ({msg.assessment.detected_warning_signs.length})</h5>
                        </div>
                        <div className="red-flags-grid">
                          {msg.assessment.detected_warning_signs.map((flag, idx) => (
                            <div key={idx} className="red-flag-chip">
                              <div className="flag-title-row">
                                <AlertTriangle size={15} className="ui-icon-warning" aria-hidden="true" />
                                <span className="flag-title">{cleanTextForSpeech(flag.title)}</span>
                              </div>
                              <p className="flag-desc">{cleanTextForSpeech(flag.description)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Immediate Action & Verification Guidance */}
                    <div className="card-guidance-block">
                      <div className="guidance-immediate">
                        <div className="guidance-header">
                          <ShieldAlert size={16} className="ui-icon-danger" aria-hidden="true" />
                          <strong>Immediate Protective Advice</strong>
                        </div>
                        <p>{cleanTextForSpeech(msg.assessment.verification_guidance.immediate_action)}</p>
                      </div>

                      {msg.assessment.verification_guidance.independent_verification_steps.length > 0 && (
                        <div className="guidance-steps">
                          <div className="guidance-header">
                            <ListChecks size={16} className="ui-icon-cyan" aria-hidden="true" />
                            <strong>Independent Verification Steps</strong>
                          </div>
                          <ol>
                            {msg.assessment.verification_guidance.independent_verification_steps.map((st, i) => (
                              <li key={i}>{cleanTextForSpeech(st)}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* Safe Next Steps & Protective Actions */}
                    <div className="card-actions-bar">
                      <button
                        type="button"
                        className="btn-action-cooling"
                        onClick={() => onOpenCoolingOff(msg.assessment!)}
                      >
                        <Timer size={16} aria-hidden="true" />
                        <span>Start 15-Min Cooling-Off Pause</span>
                      </button>

                      <button
                        type="button"
                        className="btn-action-contact"
                        onClick={() => {
                          if (currentIncident) {
                            onOpenTrustedContact(currentIncident);
                          }
                        }}
                      >
                        <Users size={16} aria-hidden="true" />
                        <span>Alert Trusted Contact (Consent-Gated)</span>
                      </button>

                      <button
                        type="button"
                        className="btn-action-report"
                        onClick={() => {
                          if (currentIncident) {
                            onOpenReportDraft(currentIncident);
                          }
                        }}
                      >
                        <FileText size={16} aria-hidden="true" />
                        <span>Draft FTC / Bank Fraud Report</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
