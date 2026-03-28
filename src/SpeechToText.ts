import { SpeechToTextOptions, SpeechToTextInstance } from './types';

export class SpeechToText implements SpeechToTextInstance {
  private recognition: any = null;
  private _isListening = false;
  private _manualStop = false;
  private _lang: string;
  private _continuous: boolean;
  private _interimResults: boolean;
  private _onResult?: (transcript: string, isFinal: boolean) => void;
  private _onStart?: () => void;
  private _onEnd?: () => void;
  private _onError?: (error: string) => void;

  constructor(options: SpeechToTextOptions = {}) {
    this._lang = options.lang || 'zh-CN';
    this._continuous = options.continuous !== false;
    this._interimResults = options.interimResults !== false;
    this._onResult = options.onResult;
    this._onStart = options.onStart;
    this._onEnd = options.onEnd;
    this._onError = options.onError;

    this.initRecognition();
  }

  private getSpeechRecognition(): any {
    const SpeechRecognition = (window as any).SpeechRecognition ||
                              (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('当前浏览器不支持 Web Speech API');
    }
    return SpeechRecognition;
  }

  private initRecognition(): void {
    const SpeechRecognition = this.getSpeechRecognition();
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this._continuous;
    this.recognition.interimResults = this._interimResults;
    this.recognition.lang = this._lang;

    this.recognition.onstart = () => {
      this._isListening = true;
      this._onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      // 如果是用户主动停止后的结果，不处理
      if (this._manualStop) return;

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this._onResult?.(finalTranscript, true);
      }
      if (interimTranscript) {
        this._onResult?.(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      this._isListening = false;
      const errorMessages: Record<string, string> = {
        'not-allowed': '麦克风权限被拒绝',
        'no-speech': '未检测到语音输入',
        'audio-capture': '无法捕获音频',
        'network': '网络错误',
        'aborted': '识别被中断',
        'no-match': '无法识别语音'
      };
      const message = errorMessages[event.error] || `识别错误: ${event.error}`;
      this._onError?.(message);
    };

    this.recognition.onend = () => {
      if (this._isListening) {
        this._isListening = false;
        this._manualStop = false;
        this._onEnd?.();
      }
    };
  }

  start(): void {
    if (this._isListening) return;
    this._manualStop = false;

    try {
      this.recognition.lang = this._lang;
      this.recognition.start();
    } catch (e) {
      this._onError?.('启动识别失败');
    }
  }

  stop(): void {
    if (!this._isListening) return;
    this._manualStop = true;
    try {
      this.recognition.stop();
    } catch (e) {
      // 忽略停止时的错误
    }
  }

  setLanguage(lang: string): void {
    this._lang = lang;
    if (this._isListening) {
      this.stop();
      setTimeout(() => this.start(), 100);
    }
  }

  isListening(): boolean {
    return this._isListening;
  }

  destroy(): void {
    this.stop();
    this.recognition = null;
  }

  /** 静态方法：检测浏览器支持 */
  static isSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }
}

export default SpeechToText;
