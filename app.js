// 语音转文字应用 - 主逻辑
(function() {
  'use strict';

  // DOM 元素
  const languageSelect = document.getElementById('language-select');
  const controlBtn = document.getElementById('control-btn');
  const resultTextarea = document.getElementById('result');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const errorMessage = document.getElementById('error-message');

  // 状态
  let isListening = false;
  let recognition = null;
  let accumulatedResult = '';

  // 检测浏览器支持
  function checkBrowserSupport() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showError('当前浏览器不支持 Web Speech API。请使用 Chrome、Edge 或 Safari。');
      controlBtn.disabled = true;
      return false;
    }

    return true;
  }

  // 初始化语音识别
  function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageSelect.value;

    recognition.onstart = function() {
      isListening = true;
      updateUI('listening');
    };

    recognition.onresult = function(event) {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // 更新累积结果（只保留最终确认的部分）
      accumulatedResult = finalTranscript;
      resultTextarea.value = accumulatedResult + interimTranscript;
    };

    recognition.onerror = function(event) {
      if (event.error === 'not-allowed') {
        showError('麦克风权限被拒绝。请在浏览器设置中允许使用麦克风。');
      } else if (event.error === 'no-speech') {
        showError('未检测到语音输入，请重试。');
      } else {
        showError('识别错误: ' + event.error);
      }
      stopListening();
    };

    recognition.onend = function() {
      // 如果还在 listening 状态但 onend 被触发，尝试重启
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          stopListening();
        }
      }
    };
  }

  // 更新 UI 状态
  function updateUI(status) {
    statusIndicator.className = 'indicator ' + status;

    switch (status) {
      case 'idle':
        statusText.textContent = '就绪';
        controlBtn.className = 'btn start';
        controlBtn.querySelector('.icon').textContent = '🎤';
        controlBtn.querySelector('.text').textContent = '开始录音';
        break;
      case 'listening':
        statusText.textContent = '正在聆听...';
        controlBtn.className = 'btn stop';
        controlBtn.querySelector('.icon').textContent = '⏹';
        controlBtn.querySelector('.text').textContent = '停止录音';
        break;
      case 'error':
        statusText.textContent = '出错了';
        break;
    }
  }

  // 显示错误信息
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    updateUI('error');

    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 5000);
  }

  // 清除错误信息
  function hideError() {
    errorMessage.classList.add('hidden');
  }

  // 开始录音
  function startListening() {
    hideError();
    accumulatedResult = resultTextarea.value;

    try {
      recognition.lang = languageSelect.value;
      recognition.start();
    } catch (e) {
      showError('启动识别失败，请重试。');
      console.error('Recognition start error:', e);
    }
  }

  // 停止录音
  function stopListening() {
    isListening = false;
    try {
      recognition.stop();
    } catch (e) {
      // 忽略停止时的错误
    }
    updateUI('idle');
  }

  // 切换录音状态
  function toggleListening() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // 语言切换时如果正在录音则重启
  function onLanguageChange() {
    if (isListening) {
      stopListening();
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }

  // 初始化
  function init() {
    if (!checkBrowserSupport()) {
      return;
    }

    initRecognition();

    // 绑定事件
    controlBtn.addEventListener('click', toggleListening);
    languageSelect.addEventListener('change', onLanguageChange);

    updateUI('idle');
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
