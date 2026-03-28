export interface SpeechToTextOptions {
  /** 识别语言，如 'zh-CN', 'en-US', 'ja-JP', 'ko-KR' */
  lang?: string;
  /** 是否持续识别，默认 true */
  continuous?: boolean;
  /** 是否返回临时结果，默认 true */
  interimResults?: boolean;
  /** 识别成功回调 */
  onResult?: (transcript: string, isFinal: boolean) => void;
  /** 开始识别回调 */
  onStart?: () => void;
  /** 结束识别回调 */
  onEnd?: () => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

export interface SpeechToTextInstance {
  /** 开始识别 */
  start: () => void;
  /** 停止识别 */
  stop: () => void;
  /** 设置语言 */
  setLanguage: (lang: string) => void;
  /** 销毁实例 */
  destroy: () => void;
  /** 当前是否正在识别 */
  isListening: () => boolean;
}

export type SpeechToTextEvent = 'start' | 'end' | 'result' | 'error';
