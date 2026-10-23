import { useState, useEffect, useCallback, useRef } from 'react';

export type SpeechStatus = 'idle' | 'playing' | 'paused' | 'error';

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  status: SpeechStatus;
  errorMessage: string | null;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop / Cancel speech
  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancellation failures
    }
    currentUtteranceRef.current = null;
    setStatus('idle');
    setErrorMessage(null);
  }, [isSupported]);

  // Pause speech
  const pause = useCallback(() => {
    if (!isSupported) return;
    try {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setStatus('paused');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not pause audio');
    }
  }, [isSupported]);

  // Resume speech
  const resume = useCallback(() => {
    if (!isSupported) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setStatus('playing');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not resume audio');
    }
  }, [isSupported]);

  // Speak speech text
  const speak = useCallback((text: string) => {
    if (!isSupported) {
      setErrorMessage('Audio narration is not supported by your current browser.');
      setStatus('error');
      return;
    }

    if (!text || !text.trim()) {
      return;
    }

    // Cancel any previous speech
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Continue
    }

    setErrorMessage(null);

    const utterance = new SpeechSynthesisUtterance(text);
    // Elder-friendly pacing: slightly slower and clearer
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Select the best available clear English voice if possible
    try {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David'))
      ) || voices.find((v) => v.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    } catch {
      // Continue with default system voice
    }

    utterance.onstart = () => {
      setStatus('playing');
    };

    utterance.onpause = () => {
      setStatus('paused');
    };

    utterance.onresume = () => {
      setStatus('playing');
    };

    utterance.onend = () => {
      setStatus('idle');
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      // Normal intentional cancellations (e.g. clicking Stop or navigating) should not show errors
      if (event.error === 'canceled' || event.error === 'interrupted') {
        setStatus('idle');
        currentUtteranceRef.current = null;
        return;
      }
      setStatus('error');
      setErrorMessage('Audio playback was interrupted or could not be completed.');
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start speech.');
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [isSupported]);

  return {
    isSupported,
    status,
    errorMessage,
    speak,
    pause,
    resume,
    stop,
  };
}
