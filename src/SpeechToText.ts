import { SpeechToTextOptions, SpeechToTextInstance } from './types';

export class SpeechToText implements SpeechToTextInstance {
  private recognition: any = null;
  private _isListening = false;
  private _manualStop = false;
  private _restarting = false;
  private _lang: string;
  private _continuous: boolean;
  private _interimResults: boolean;
  private _onResult?: (transcript: string, isFinal: boolean) => void;
  private _onStart?: () => void;
  private _onEnd?: () => void;
  private _onError?: (error: string) => void;
  // 用于去重：记录上次的最终文本，避免重复添加
  private _lastFinalTranscript = '';
  // 用于去重：记录本轮会话中所有已处理的最终文本
  private _processedFinals = new Set<string>();

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
      this._restarting = false;
      this._onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      // 如果是用户主动停止后的结果，不处理
      if (this._manualStop) return;

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // 去重：如果这个最终文本在本轮会话中已经处理过，则跳过
      if (finalTranscript && this._processedFinals.has(finalTranscript)) {
        return;
      }

      if (finalTranscript) {
        this._processedFinals.add(finalTranscript);
        this._lastFinalTranscript = finalTranscript;
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
      if (this._manualStop) {
        // 用户主动停止
        this._isListening = false;
        this._manualStop = false;
        this._onEnd?.();
      } else if (this._continuous && !this._restarting) {
        // continuous 模式且非 restart 状态，自动重启
        try {
          this.recognition.start();
        } catch (e) {
          this._isListening = false;
          this._onError?.('识别重启失败');
        }
      } else {
        // 非 continuous 模式或正在 restart，正常结束
        this._isListening = false;
        this._onEnd?.();
      }
    };
  }

  start(): void {
    if (this._isListening) return;
    this._manualStop = false;
    this._restarting = true;
    this._lastFinalTranscript = '';
    this._processedFinals.clear();

    try {
      this.recognition.lang = this._lang;
      this.recognition.start();
    } catch (e) {
      this._restarting = false;
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
