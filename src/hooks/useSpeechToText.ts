import { useState, useEffect, useRef, useCallback } from 'react';
import { SpeechToText } from '../SpeechToText';
import { SpeechToTextOptions } from '../types';

interface UseSpeechToTextOptions extends SpeechToTextOptions {
  /** 是否自动启动 */
  autoStart?: boolean;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const instanceRef = useRef<SpeechToText | null>(null);

  useEffect(() => {
    if (!SpeechToText.isSupported()) {
      setIsSupported(false);
      setError('当前浏览器不支持 Web Speech API');
      return;
    }

    instanceRef.current = new SpeechToText({
      lang: options.lang,
      continuous: options.continuous,
      interimResults: options.interimResults,
      onResult: (text, isFinal) => {
        if (isFinal) {
          setTranscript(prev => prev + text);
        } else {
          setTranscript(text);
        }
        options.onResult?.(text, isFinal);
      },
      onStart: () => {
        setIsListening(true);
        setError(null);
        options.onStart?.();
      },
      onEnd: () => {
        setIsListening(false);
        options.onEnd?.();
      },
      onError: (err) => {
        setError(err);
        options.onError?.(err);
      }
    });

    if (options.autoStart) {
      instanceRef.current.start();
    }

    return () => {
      instanceRef.current?.destroy();
    };
  }, []);

  const start = useCallback(() => {
    instanceRef.current?.start();
  }, []);

  const stop = useCallback(() => {
    instanceRef.current?.stop();
  }, []);

  const setLanguage = useCallback((lang: string) => {
    instanceRef.current?.setLanguage(lang);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    error,
    start,
    stop,
    setLanguage,
    clearTranscript
  };
}

export default useSpeechToText;
