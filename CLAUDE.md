# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`speech2text-web` is a语音转文字 (speech-to-text) library based on the Web Speech API. It provides a framework-agnostic core class with React hooks and Vue composables for easy integration.

## Build Commands

```bash
# Build the library (outputs to dist/)
npm run build

# Watch mode for development
npm run dev

# The react-demo example is in examples/react-demo/
```

## Architecture

### Core Structure

- `src/SpeechToText.ts` - Core class wrapping Web Speech API (webkitSpeechRecognition/SpeechRecognition)
- `src/hooks/useSpeechToText.ts` - React hook (requires React as peer dependency)
- `src/composables/useSpeechToText.ts` - Vue composable (requires Vue as peer dependency)
- `src/index.ts` - Entry point exporting all APIs

### Key Design Decisions

1. **Peer Dependencies**: React and Vue are peer dependencies, not bundled. The rollup config marks them as `external`.
2. **Dual Exports**: `useSpeechToText` for React, `useVueSpeechToText` for Vue
3. **Browser-Only**: Uses `window.SpeechRecognition` or `window.webkitSpeechRecognition` (Safari compatibility)
4. **Framework-Agnostic Core**: The `SpeechToText` class can be used standalone without React/Vue

### Distribution

- `dist/speech2text.esm.js` - ES modules
- `dist/speech2text.cjs.js` - CommonJS
- `dist/index.d.ts` - TypeScript declarations

## Examples

The `examples/react-demo/` directory contains a Vite + React demo. To run:

```bash
cd examples/react-demo
npm install
npm run dev
```

When linking the local package, examples use `vite.config.js` alias pointing to `../../dist/speech2text.esm.js`.

## Browser Compatibility

Web Speech API support: Chrome, Edge, Safari (with prefix). Firefox does not support this API.

## Bug Fixes

### Bug 1: 录音无法关闭
- **文件**: `src/SpeechToText.ts`
- **问题**: `stop()` 方法中提前将 `_isListening` 设为 `false`，导致 `onend` 事件触发时 `onEnd` 回调未被调用，React 的 `isListening` 状态无法更新为 `false`
- **修复**: 移除 `stop()` 方法中的 `this._isListening = false`，让 `onend` 事件处理器统一处理状态重置
- **日期**: 2026-03-28

### Bug 2: 点击停止录音后内容重复输出
- **文件**: `src/SpeechToText.ts`
- **问题**: 在 `continuous: true` 模式下，调用 `stop()` 后、`onend` 触发前，Web Speech API 可能还会触发一到两个 `onresult` 事件，导致内容重复输出
- **修复**: 添加 `_manualStop` 标志位区分用户主动停止和异常中断，在 `onresult` 中检查该标志并忽略停止后的结果
- **日期**: 2026-03-28

### Bug 3: 最终识别内容与临时内容重复
- **文件**: `src/hooks/useSpeechToText.ts`
- **问题**: Web Speech API 在识别过程中会先输出临时结果（interim），然后输出最终结果（final）。临时结果会直接替换显示，最终结果会追加。但在 continuous 模式下，最终结果通常包含临时结果的完整内容，导致显示 "你好"+"你好"="你好你好"
- **分析**:
  - 临时结果显示：`setTranscript("你")`
  - 最终结果追加：`setTranscript(prev => prev + "你好")`
  - 结果：`"你" + "你好" = "你好你好"`
- **修复**: 在 React Hook 中跟踪上一次的临时结果（`lastInterimRef`）。当最终结果来时，检查最终结果是否以上一次的临时内容开头。如果是，说明临时内容已被确认为最终内容的一部分，需要先移除临时内容再追加最终结果；如果不是，直接追加
- **核心逻辑**:
  ```typescript
  if (isFinal) {
    const prevInterim = lastInterimRef.current;
    if (prevInterim && text.startsWith(prevInterim)) {
      // 移除临时内容，追加最终结果
      setTranscript(prev => prev.slice(0, -prevInterim.length) + text);
    } else {
      setTranscript(prev => prev + text);
    }
    lastInterimRef.current = '';
  } else {
    setTranscript(text);
    lastInterimRef.current = text;
  }
  ```
- **日期**: 2026-03-29
