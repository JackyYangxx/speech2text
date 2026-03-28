import { useState } from 'react'
import { useSpeechToText } from 'speech2text-web'
import './App.css'

function App() {
  const [selectedLang, setSelectedLang] = useState('zh-CN')

  const {
    transcript,
    isListening,
    error,
    start,
    stop,
    setLanguage
  } = useSpeechToText({
    lang: selectedLang,
    onResult: (text, isFinal) => {
      console.log(isFinal ? '最终: ' + text : '临时: ' + text)
    }
  })

  const handleLangChange = (e) => {
    setSelectedLang(e.target.value)
    setLanguage(e.target.value)
  }

  const toggleListening = () => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }

  const getStatusText = () => {
    if (error) return '出错了'
    if (isListening) return '正在聆听...'
    return '就绪'
  }

  return (
    <div className="container">
      <header>
        <h1>React 集成示例</h1>
        <p className="subtitle">集成 speech2text-web 语音转文字组件</p>
      </header>

      <div className="controls">
        <select value={selectedLang} onChange={handleLangChange} disabled={isListening}>
          <option value="zh-CN">中文</option>
          <option value="en-US">English</option>
          <option value="ja-JP">日本語</option>
          <option value="ko-KR">한국어</option>
        </select>

        <button onClick={toggleListening} className={isListening ? 'stop' : 'start'}>
          <span className="icon">{isListening ? '⏹' : '🎤'}</span>
          <span>{isListening ? '停止录音' : '开始录音'}</span>
        </button>
      </div>

      <div className="result-area">
        <textarea
          value={transcript}
          readOnly
          placeholder="识别结果将显示在这里..."
        />
      </div>

      <div className="status">
        <span className={`indicator ${error ? 'error' : isListening ? 'listening' : 'idle'}`}></span>
        <span>{getStatusText()}</span>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="info">
        <h3>集成方式</h3>
        <pre><code>{`import { useSpeechToText } from 'speech2text-web';

const { transcript, isListening, start, stop } = useSpeechToText({
  lang: 'zh-CN'
});`}</code></pre>
      </div>
    </div>
  )
}

export default App
