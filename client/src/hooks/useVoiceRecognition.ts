import { useState, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export interface VoiceHookResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(onResult?: (text: string) => void): VoiceHookResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      // Set language according to active user selection (ta-IN for Tamil, en-IN for English)
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        if (onResult) {
          onResult(text);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permission in browser settings.');
        } else {
          setError('Voice recognition failed. Please try speaking clearly.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setError('Could not initialize speech recognition.');
      setIsListening(false);
    }
  }, [language, onResult]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
