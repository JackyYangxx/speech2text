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
