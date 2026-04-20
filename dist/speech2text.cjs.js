'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');
var vue = require('vue');

class SpeechToText {
    constructor(options = {}) {
        this.recognition = null;
        this._isListening = false;
        this._manualStop = false;
        this._restarting = false;
        // 用于去重：记录上次的最终文本，避免重复添加
        this._lastFinalTranscript = '';
        // 用于去重：记录本轮会话中所有已处理的最终文本
        this._processedFinals = new Set();
        this._lang = options.lang || 'zh-CN';
        this._continuous = options.continuous !== false;
        this._interimResults = options.interimResults !== false;
        this._onResult = options.onResult;
        this._onStart = options.onStart;
        this._onEnd = options.onEnd;
        this._onError = options.onError;
        this.initRecognition();
    }
    getSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition ||
            window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            throw new Error('当前浏览器不支持 Web Speech API');
        }
        return SpeechRecognition;
    }
    initRecognition() {
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
        this.recognition.onresult = (event) => {
            // 如果是用户主动停止后的结果，不处理
            if (this._manualStop)
                return;
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim();
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                }
                else {
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
        this.recognition.onerror = (event) => {
            this._isListening = false;
            const errorMessages = {
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
            }
            else if (this._continuous && !this._restarting) {
                // continuous 模式且非 restart 状态，自动重启
                try {
                    this.recognition.start();
                }
                catch (e) {
                    this._isListening = false;
                    this._onError?.('识别重启失败');
                }
            }
            else {
                // 非 continuous 模式或正在 restart，正常结束
                this._isListening = false;
                this._onEnd?.();
            }
        };
    }
    start() {
        if (this._isListening)
            return;
        this._manualStop = false;
        this._restarting = true;
        this._lastFinalTranscript = '';
        this._processedFinals.clear();
        try {
            this.recognition.lang = this._lang;
            this.recognition.start();
        }
        catch (e) {
            this._restarting = false;
            this._onError?.('启动识别失败');
        }
    }
    stop() {
        if (!this._isListening)
            return;
        this._manualStop = true;
        try {
            this.recognition.stop();
        }
        catch (e) {
            // 忽略停止时的错误
        }
    }
    setLanguage(lang) {
        this._lang = lang;
        if (this._isListening) {
            this.stop();
            setTimeout(() => this.start(), 100);
        }
    }
    isListening() {
        return this._isListening;
    }
    destroy() {
        this.stop();
        this.recognition = null;
    }
    /** 静态方法：检测浏览器支持 */
    static isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
}

function useSpeechToText$1(options = {}) {
    const [transcript, setTranscript] = react.useState('');
    const [isListening, setIsListening] = react.useState(false);
    const [isSupported, setIsSupported] = react.useState(true);
    const [error, setError] = react.useState(null);
    const instanceRef = react.useRef(null);
    // 跟踪上一次的临时结果，用于去重
    const lastInterimRef = react.useRef('');
    react.useEffect(() => {
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
                    }
                    else {
                        setTranscript(prev => prev + text);
                    }
                    lastInterimRef.current = '';
                }
                else {
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
    const start = react.useCallback(() => {
        instanceRef.current?.start();
    }, []);
    const stop = react.useCallback(() => {
        instanceRef.current?.stop();
    }, []);
    const setLanguage = react.useCallback((lang) => {
        instanceRef.current?.setLanguage(lang);
    }, []);
    const clearTranscript = react.useCallback(() => {
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

function useSpeechToText(options = {}) {
    const transcript = vue.ref('');
    const isListening = vue.ref(false);
    const isSupported = vue.ref(true);
    const error = vue.ref(null);
    // 跟踪上一次的临时结果，用于去重
    const lastInterimRef = vue.ref('');
    let instance = null;
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
                    }
                    else {
                        transcript.value += text;
                    }
                    lastInterimRef.value = '';
                }
                else {
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
    const setLanguage = (lang) => {
        instance?.setLanguage(lang);
    };
    const clearTranscript = () => {
        transcript.value = '';
    };
    vue.onUnmounted(() => {
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

exports.SpeechToText = SpeechToText;
exports.default = SpeechToText;
exports.useSpeechToText = useSpeechToText$1;
exports.useVueSpeechToText = useSpeechToText;
//# sourceMappingURL=speech2text.cjs.js.map
