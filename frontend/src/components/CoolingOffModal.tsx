import React, { useState, useEffect } from 'react';
import {
  Timer,
  X,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface CoolingOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
  initialMinutes?: number;
}

export const CoolingOffModal: React.FC<CoolingOffModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  initialMinutes = 15,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const [checklist, setChecklist] = useState({
    callDisconnected: true,
    tookBreaths: false,
    noPaymentsMade: false,
    verifiedDirectly: false,
  });

  useEffect(() => {
    if (!isActive || !isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          if (onCompleted) onCompleted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, isOpen, onCompleted]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cooling-off-title">
      <div className="modal-container cooling-off-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon" aria-hidden="true">
              <Timer size={22} className="ui-icon-calm" strokeWidth={2} />
            </span>
            <div>
              <h2 id="cooling-off-title" className="modal-title">Voluntary Cooling-Off Pause</h2>
              <p className="modal-subtitle">Take your time. High-pressure criminals want you to rush.</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {/* Breathing & Affirmation Banner */}
          <div className="calm-affirmation-box">
            <div className="breathing-circle-wrapper" aria-hidden="true">
              <div className="breathing-circle"></div>
              <span>Breathe In ... Breathe Out</span>
            </div>
            <p className="affirmation-quote">
              "Scammers manufacture panic so you can't think clearly. Legitimate banks and government 
              agencies will <strong>always wait</strong>. You are completely safe taking a pause."
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="timer-display-card">
            <span className="timer-label">Recommended Cooling-Off Time</span>
            <div className="timer-digits" aria-live="polite">
              {formattedTime}
            </div>
            <div className="timer-controls">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? (
                  <>
                    <Pause size={14} aria-hidden="true" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play size={14} aria-hidden="true" />
                    <span>Resume Timer</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSecondsRemaining(initialMinutes * 60);
                  setIsActive(true);
                }}
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Reset 15 Min</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Calming Verification Checklist */}
          <div className="cooling-checklist">
            <h3 className="checklist-heading">Calm Verification Checklist:</h3>
            
            <label className="checklist-item">
              <input
                type="checkbox"
                checked={checklist.callDisconnected}
                onChange={() => toggleCheck('callDisconnected')}
              />
              <span className="check-text">
                <strong>1. Disconnect the call immediately:</strong> I have hung up the phone and will not answer follow-up calls from that number.
              </span>
            </label>

            <label className="checklist-item">
              <input
                type="checkbox"
                checked={checklist.tookBreaths}
                onChange={() => toggleCheck('tookBreaths')}
              />
              <span className="check-text">
                <strong>2. Physical reset:</strong> I took 3 slow, deep breaths, stepped away from my phone, and had a glass of water.
              </span>
            </label>

            <label className="checklist-item">
              <input
                type="checkbox"
                checked={checklist.noPaymentsMade}
                onChange={() => toggleCheck('noPaymentsMade')}
              />
              <span className="check-text">
                <strong>3. Safeguard funds:</strong> I have not purchased gift cards, authorized bank wires, or given any verification passcodes.
              </span>
            </label>

            <label className="checklist-item">
              <input
                type="checkbox"
                checked={checklist.verifiedDirectly}
                onChange={() => toggleCheck('verifiedDirectly')}
              />
              <span className="check-text">
                <strong>4. Independent verification plan:</strong> I will look up the official phone number on my physical card or bill, or call my family member on their known number.
              </span>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Keep Running in Background
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (onCompleted) onCompleted();
              onClose();
            }}
          >
            {allChecked ? (
              <>
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>Mark Cooling-Off Complete</span>
              </>
            ) : (
              'Close and Return'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
