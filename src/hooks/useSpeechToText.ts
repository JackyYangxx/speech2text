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
  // 跟踪上一次的临时结果，用于去重
  const lastInterimRef = useRef<string>('');

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
          // 如果最终结果的开头包含上一次的临时内容，说明临时内容已被确认为最终内容的一部分
          // 需要移除临时内容，避免重复
          const prevInterim = lastInterimRef.current;
          if (prevInterim && text.startsWith(prevInterim)) {
            setTranscript(prev => prev.slice(0, -prevInterim.length) + text);
          } else {
            setTranscript(prev => prev + text);
          }
          lastInterimRef.current = '';
        } else {
          setTranscript(text);
          lastInterimRef.current = text;
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
