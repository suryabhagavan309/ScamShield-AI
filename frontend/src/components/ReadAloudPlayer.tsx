import React from 'react';
import { Volume2, VolumeX, Pause, Square, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface ReadAloudPlayerProps {
  text: string;
  label?: string;
  className?: string;
}

export const ReadAloudPlayer: React.FC<ReadAloudPlayerProps> = ({
  text,
  label = 'Read Assessment Aloud',
  className = '',
}) => {
  const { isSupported, status, errorMessage, speak, pause, resume, stop } = useSpeechSynthesis();

  if (!isSupported) {
    return (
      <div className={`read-aloud-container unsupported ${className}`} role="status">
        <span className="unsupported-note" title="Web Speech API is not supported on this browser">
          <VolumeX size={15} strokeWidth={2} className="ui-icon ui-icon-muted" aria-hidden="true" />
          <em>Read Aloud audio is not supported in this browser.</em>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`read-aloud-container ${status} ${className}`}
      role="region"
      aria-label="Read Aloud Audio Controls"
    >
      <div className="read-aloud-controls">
        {status === 'idle' && (
          <button
            type="button"
            className="btn btn-audio-play"
            onClick={() => speak(text)}
            aria-label={`${label}. Click to listen to audio narration.`}
          >
            <Volume2 size={16} strokeWidth={2} className="ui-icon ui-icon-navy audio-btn-icon" aria-hidden="true" />
            <span className="audio-btn-text">{label}</span>
          </button>
        )}

        {status === 'playing' && (
          <div className="audio-active-controls">
            <button
              type="button"
              className="btn btn-audio-pause"
              onClick={pause}
              aria-label="Pause audio reading"
            >
              <Pause size={15} strokeWidth={2} className="ui-icon audio-btn-icon" aria-hidden="true" />
              <span className="audio-btn-text">Pause</span>
            </button>

            <button
              type="button"
              className="btn btn-audio-stop"
              onClick={stop}
              aria-label="Stop audio reading"
            >
              <Square size={14} strokeWidth={2} className="ui-icon audio-btn-icon" aria-hidden="true" />
              <span className="audio-btn-text">Stop</span>
            </button>

            <div className="audio-live-pill" aria-live="polite">
              <span className="audio-pulse-indicator" aria-hidden="true"></span>
              <span className="audio-status-label">Reading Aloud...</span>
            </div>
          </div>
        )}

        {status === 'paused' && (
          <div className="audio-active-controls">
            <button
              type="button"
              className="btn btn-audio-resume"
              onClick={resume}
              aria-label="Resume audio reading"
            >
              <Play size={15} strokeWidth={2} className="ui-icon audio-btn-icon" aria-hidden="true" />
              <span className="audio-btn-text">Resume</span>
            </button>

            <button
              type="button"
              className="btn btn-audio-stop"
              onClick={stop}
              aria-label="Stop audio reading"
            >
              <Square size={14} strokeWidth={2} className="ui-icon audio-btn-icon" aria-hidden="true" />
              <span className="audio-btn-text">Stop</span>
            </button>

            <div className="audio-paused-pill" aria-live="polite">
              <span className="audio-status-label">Audio Paused</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="audio-error-view">
            <button
              type="button"
              className="btn btn-audio-play btn-retry"
              onClick={() => speak(text)}
              aria-label="Retry reading aloud"
            >
              <RotateCcw size={15} strokeWidth={2} className="ui-icon audio-btn-icon" aria-hidden="true" />
              <span className="audio-btn-text">Retry Audio</span>
            </button>
            {errorMessage && (
              <span className="audio-error-msg" role="alert">
                <AlertTriangle size={15} strokeWidth={2} className="ui-icon ui-icon-danger" aria-hidden="true" />
                <span>{errorMessage}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

