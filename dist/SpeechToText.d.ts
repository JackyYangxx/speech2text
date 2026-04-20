import { SpeechToTextOptions, SpeechToTextInstance } from './types';
export declare class SpeechToText implements SpeechToTextInstance {
    private recognition;
    private _isListening;
    private _manualStop;
    private _restarting;
    private _lang;
    private _continuous;
    private _interimResults;
    private _onResult?;
    private _onStart?;
    private _onEnd?;
    private _onError?;
    private _lastFinalTranscript;
    private _processedFinals;
    constructor(options?: SpeechToTextOptions);
    private getSpeechRecognition;
    private initRecognition;
    start(): void;
    stop(): void;
    setLanguage(lang: string): void;
    isListening(): boolean;
    destroy(): void;
    /** 静态方法：检测浏览器支持 */
    static isSupported(): boolean;
}
export default SpeechToText;
