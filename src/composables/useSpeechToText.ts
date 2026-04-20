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
  // 跟踪上一次的临时结果，用于去重
  const lastInterimRef = ref('');

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
          // 如果最终结果的开头包含上一次的临时内容，说明临时内容已被确认为最终内容的一部分
          // 需要移除临时内容，避免重复
          const prevInterim = lastInterimRef.value;
          if (prevInterim && text.startsWith(prevInterim)) {
            transcript.value = transcript.value.slice(0, -prevInterim.length) + text;
          } else {
            transcript.value += text;
          }
          lastInterimRef.value = '';
        } else {
          transcript.value = text;
          lastInterimRef.value = text;
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
