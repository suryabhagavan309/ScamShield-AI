import React from 'react';
import { Mic, MicOff, AlertTriangle, X } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceInputButtonProps {
  onTranscript: (spokenText: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * Accessible microphone input button using browser SpeechRecognition.
 * 
 * ACCESSIBILITY & SAFETY SPECIFICATIONS:
 * - Minimum 48px touch target compliant with WCAG AAA/AA elder accessibility.
 * - Clear visual states for idle, active listening (with animated pulse), and errors.
 * - Live transcript feedback preview during speech.
 * - Inline, dismissible error handling for denied permissions and network drops.
 * - Purely client-side; zero audio recording or server upload.
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  disabled = false,
  className = '',
  label = 'Speak Description',
}) => {
  const {
    isSupported,
    isListening,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (finalText) => {
      if (finalText && finalText.trim()) {
        onTranscript(finalText.trim());
      }
    },
  });

  if (!isSupported) {
    return (
      <div className={`voice-input-container unsupported ${className}`} role="status">
        <span
          className="voice-unsupported-note"
          title="Speech recognition is not supported in this browser. Please type your description."
        >
          <MicOff size={14} strokeWidth={2} className="ui-icon ui-icon-muted" aria-hidden="true" />
          <small>Voice input unavailable (type below)</small>
        </span>
      </div>
    );
  }

  return (
    <div className={`voice-input-container ${className}`} role="region" aria-label="Voice Input Controls">
      <div className="voice-btn-row">
        <button
          type="button"
          className={`btn btn-voice-input ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          aria-label={
            isListening
              ? 'Microphone is listening. Click to stop voice recording.'
              : `${label}. Click to dictate your description using your microphone.`
          }
          aria-pressed={isListening}
        >
          {isListening ? (
            <>
              <span className="voice-pulse-dot" aria-hidden="true" />
              <span className="voice-btn-text">Listening... (Tap to Finish)</span>
            </>
          ) : (
            <>
              <Mic size={16} strokeWidth={2} className="ui-icon ui-icon-navy voice-mic-icon" aria-hidden="true" />
              <span className="voice-btn-text">{label}</span>
            </>
          )}
        </button>

        {isListening && (
          <span className="voice-status-pill" aria-live="polite">
            <span className="audio-pulse-indicator" aria-hidden="true" />
            <span>Listening to voice...</span>
          </span>
        )}
      </div>

      {/* Live Interim Transcript Feedback */}
      {isListening && interimTranscript && (
        <div className="voice-interim-preview" aria-live="polite">
          <span className="preview-label">Hearing:</span>
          <span className="preview-text">"{interimTranscript}"</span>
        </div>
      )}

      {/* Inline Error Notice */}
      {errorMessage && (
        <div className="voice-error-notice" role="alert">
          <AlertTriangle size={15} strokeWidth={2} className="ui-icon ui-icon-danger" aria-hidden="true" />
          <span className="error-text">{errorMessage}</span>
          <button
            type="button"
            className="btn-dismiss-voice-error"
            onClick={resetTranscript}
            aria-label="Dismiss speech error notice"
          >
            <X size={13} strokeWidth={2} aria-hidden="true" />
            <span>Dismiss</span>
          </button>
        </div>
      )}
    </div>
  );
};

