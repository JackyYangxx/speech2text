import { SpeechToTextOptions } from '../types';
interface UseSpeechToTextOptions extends SpeechToTextOptions {
    /** 是否自动启动 */
    autoStart?: boolean;
}
export declare function useSpeechToText(options?: UseSpeechToTextOptions): {
    transcript: any;
    isListening: any;
    isSupported: any;
    error: any;
    start: any;
    stop: any;
    setLanguage: any;
    clearTranscript: any;
};
export default useSpeechToText;
