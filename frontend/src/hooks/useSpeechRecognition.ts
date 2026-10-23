import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  errorMessage: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Resolves browser SpeechRecognition constructor across standard and vendor-prefixed implementations.
 */
function getSpeechRecognitionConstructor(): (new () => any) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

/**
 * Maps SpeechRecognition error codes to clear, elder-friendly guidance.
 */
export function mapRecognitionError(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Please allow microphone permissions in your browser to speak.';
    case 'no-speech':
      return 'No speech was detected. Please try speaking again.';
    case 'audio-capture':
      return 'No microphone was detected. Please connect an audio input device.';
    case 'network':
      return 'Speech recognition network error. Please check your internet connection or type below.';
    case 'aborted':
      return ''; // User intentionally stopped or aborted
    default:
      return `Speech recognition notice (${error}). You can also type your description below.`;
  }
}

/**
 * Custom React hook for accessible browser voice recognition via Web Speech API.
 * 
 * PRIVACY & SAFETY GUARANTEES:
 * - Purely client-side browser speech recognition.
 * - Does not record, persist, or upload audio files to any server or external service.
 * - Gracefully degrades on unsupported browsers or denied microphone permissions.
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const isSupported = typeof window !== 'undefined' && getSpeechRecognitionConstructor() !== null;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop failures on already stopped sessions
      }
    }
    setIsListening(false);
    isListeningRef.current = false;
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setErrorMessage('Speech recognition is not supported in this browser. Please type your description.');
      return;
    }

    // Toggle behavior: if already listening, clicking again stops gracefully
    if (isListeningRef.current) {
      stopListening();
      return;
    }

    setErrorMessage(null);
    setInterimTranscript('');

    const SpeechClass = getSpeechRecognitionConstructor();
    if (!SpeechClass) {
      setErrorMessage('Speech recognition engine is unavailable.');
      return;
    }

    try {
      const recognition = new SpeechClass();
      recognition.lang = optionsRef.current.lang || 'en-US';
      recognition.continuous = optionsRef.current.continuous ?? false;
      recognition.interimResults = optionsRef.current.interimResults ?? true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += (finalChunk ? ' ' : '') + text.trim();
          } else {
            interimChunk += (interimChunk ? ' ' : '') + text.trim();
          }
        }

        if (interimChunk) {
          setInterimTranscript(interimChunk);
        }

        if (finalChunk) {
          setInterimTranscript('');
          setTranscript((prev) => {
            const updated = prev ? `${prev} ${finalChunk}` : finalChunk;
            optionsRef.current.onResult?.(finalChunk);
            return updated;
          });
        }
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error || 'unknown';
        const friendly = mapRecognitionError(errorType);
        if (friendly) {
          setErrorMessage(friendly);
          optionsRef.current.onError?.(friendly);
        }
        setIsListening(false);
        isListeningRef.current = false;
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        setInterimTranscript('');
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not activate microphone.';
      setErrorMessage(msg);
      setIsListening(false);
      isListeningRef.current = false;
      optionsRef.current.onError?.(msg);
    }
  }, [isSupported, stopListening]);

  // Cleanup on unmount: abort any active speech recognition session
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  };
}
