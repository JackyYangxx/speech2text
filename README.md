# speech2text-web

基于 Web Speech API 的语音转文字库，支持 React Hook、Vue Composable 和原生 JavaScript。

## 特性

- **框架无关**：提供原生 JS 类，可自由集成到任何框架
- **React Hook**：`useSpeechToText` 开箱即用
- **Vue Composable**：`useVueSpeechToText` 方便 Vue 项目
- **持续识别**：支持连续语音识别，自动处理临时结果和最终结果
- **中文优化**：默认中文（zh-CN），自动处理临时结果与最终结果重复问题
- **去重机制**：内置多种去重机制，避免重复输出

## 支持浏览器

- Chrome / Edge（完整支持）
- Safari（需要 webkit 前缀）
- Firefox（不支持 Web Speech API）

## 安装

```bash
npm install speech2text-web
```

## 使用方式

### React

```tsx
import { useSpeechToText } from 'speech2text-web';

function App() {
  const { transcript, isListening, isSupported, error, start, stop, clearTranscript } = useSpeechToText({
    lang: 'zh-CN',
    continuous: true,
    interimResults: true,
  });

  if (!isSupported) {
    return <div>当前浏览器不支持 Web Speech API</div>;
  }

  return (
    <div>
      <div>{error || transcript || '开始说话...'}</div>
      <button onClick={isListening ? stop : start}>
        {isListening ? '停止' : '开始识别'}
      </button>
      <button onClick={clearTranscript}>清空</button>
    </div>
  );
}
```

### Vue

```vue
<script setup>
import { useVueSpeechToText } from 'speech2text-web';

const { transcript, isListening, isSupported, error, start, stop, clearTranscript } = useVueSpeechToText({
  lang: 'zh-CN',
  continuous: true,
});
</script>

<template>
  <div>
    <div>{{ error || transcript || '开始说话...' }}</div>
    <button @click="isListening ? stop() : start()">
      {{ isListening ? '停止' : '开始识别' }}
    </button>
  </div>
</template>
```

### 原生 JavaScript

```javascript
import { SpeechToText } from 'speech2text-web';

const stt = new SpeechToText({
  lang: 'zh-CN',
  continuous: true,
  interimResults: true,
  onResult: (transcript, isFinal) => {
    console.log(isFinal ? `最终: ${transcript}` : `临时: ${transcript}`);
  },
  onStart: () => console.log('开始识别'),
  onEnd: () => console.log('识别结束'),
  onError: (err) => console.error('错误:', err),
});

stt.start(); // 开始识别
stt.stop();  // 停止识别
stt.setLanguage('en-US'); // 切换语言
SpeechToText.isSupported(); // 检查浏览器支持
```

## API

### SpeechToTextOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `lang` | `string` | `'zh-CN'` | 识别语言，如 `'zh-CN'`, `'en-US'`, `'ja-JP'` |
| `continuous` | `boolean` | `true` | 是否持续识别 |
| `interimResults` | `boolean` | `true` | 是否返回临时结果 |
| `onResult` | `(transcript: string, isFinal: boolean) => void` | - | 识别结果回调 |
| `onStart` | `() => void` | - | 开始识别回调 |
| `onEnd` | `() => void` | - | 结束识别回调 |
| `onError` | `(error: string) => void` | - | 错误回调 |

### React Hook 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `transcript` | `string` | 识别文本 |
| `isListening` | `boolean` | 是否正在识别 |
| `isSupported` | `boolean` | 浏览器是否支持 |
| `error` | `string \| null` | 错误信息 |
| `start` | `() => void` | 开始识别 |
| `stop` | `() => void` | 停止识别 |
| `setLanguage` | `(lang: string) => void` | 设置语言 |
| `clearTranscript` | `() => void` | 清空文本 |

### Vue Composable 返回值

同 React Hook。

### SpeechToText 实例方法

| 方法 | 说明 |
|------|------|
| `start()` | 开始识别 |
| `stop()` | 停止识别 |
| `setLanguage(lang)` | 设置语言 |
| `isListening()` | 返回是否正在识别 |
| `destroy()` | 销毁实例 |

### 静态方法

| 方法 | 说明 |
|------|------|
| `SpeechToText.isSupported()` | 检查浏览器是否支持 |

## 构建

```bash
# 构建库
npm run build

# 开发模式（监听文件变化）
npm run dev
```

构建产物输出到 `dist/` 目录：
- `dist/speech2text.esm.js` - ES 模块
- `dist/speech2text.cjs.js` - CommonJS
- `dist/index.d.ts` - TypeScript 类型声明

## 示例

React 示例项目位于 `examples/react-demo/`：

```bash
cd examples/react-demo
npm install
npm run dev
```

## License

MIT
