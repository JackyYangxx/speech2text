import { ref, onUnmounted } from 'vue';
import { SpeechToText } from '../SpeechToText';
import { SpeechToTextOptions } from '../types';

interface UseSpeechToTextOptions extends SpeechToTextOptions {
  /** 是否自动启动 */
  autoStart?: boolean;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const transcript = ref('');
  const isListening = ref(false);
  const isSupported = ref(true);
  const error = ref<string | null>(null);

  let instance: SpeechToText | null = null;

  const initInstance = () => {
    if (!SpeechToText.isSupported()) {
      isSupported.value = false;
      error.value = '当前浏览器不支持 Web Speech API';
      return;
    }

    instance = new SpeechToText({
      lang: options.lang,
      continuous: options.continuous,
      interimResults: options.interimResults,
      onResult: (text, isFinal) => {
        if (isFinal) {
          transcript.value += text;
        } else {
          transcript.value = text;
        }
        options.onResult?.(text, isFinal);
      },
      onStart: () => {
        isListening.value = true;
        error.value = null;
        options.onStart?.();
      },
      onEnd: () => {
        isListening.value = false;
        options.onEnd?.();
      },
      onError: (err) => {
        error.value = err;
        options.onError?.(err);
      }
    });

    if (options.autoStart) {
      instance.start();
    }
  };

  initInstance();

  const start = () => {
    instance?.start();
  };

  const stop = () => {
    instance?.stop();
  };

  const setLanguage = (lang: string) => {
    instance?.setLanguage(lang);
  };

  const clearTranscript = () => {
    transcript.value = '';
  };

  onUnmounted(() => {
    instance?.destroy();
  });

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
