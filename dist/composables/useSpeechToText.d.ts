import { SpeechToTextOptions } from '../types';
interface UseSpeechToTextOptions extends SpeechToTextOptions {
    /** 是否自动启动 */
    autoStart?: boolean;
}
export declare function useSpeechToText(options?: UseSpeechToTextOptions): {
    transcript: import("vue").Ref<string, string>;
    isListening: import("vue").Ref<boolean, boolean>;
    isSupported: import("vue").Ref<boolean, boolean>;
    error: import("vue").Ref<string | null, string | null>;
    start: () => void;
    stop: () => void;
    setLanguage: (lang: string) => void;
    clearTranscript: () => void;
};
export default useSpeechToText;
