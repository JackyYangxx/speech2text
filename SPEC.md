# 语音转文字 - 规格说明

## 1. 项目概述

- **项目名称**：Speech2Text
- **类型**：单页 Web 应用
- **核心功能**：通过浏览器麦克风实时录音，将语音转换为文字显示在页面上
- **技术方案**：Web Speech API（SpeechRecognition）

## 2. UI/UX 设计

### 页面结构
```
┌─────────────────────────────────┐
│          页面标题               │
├─────────────────────────────────┤
│   [语言选择下拉框] [开始/停止]   │
├─────────────────────────────────┤
│                                 │
│         识别结果文字区域         │
│         (实时显示文字)          │
│                                 │
├─────────────────────────────────┤
│         状态指示器              │
└─────────────────────────────────┘
```

### 视觉风格
- **主题**：深色极简风格
- **背景**：#0f0f0f（深灰黑）
- **主色**：#10b981（翠绿色，用于开始按钮和录音状态）
- **强调色**：#ef4444（红色，用于停止状态）
- **文字**：#f5f5f5（浅灰白）
- **字体**：system-ui, -apple-system, sans-serif
- **圆角**：12px

### 组件

#### 语言选择下拉框
- 支持语言：中文(zh-CN)、英文(en-US)、日文(ja-JP)、韩文(ko-KR)
- 默认：中文(zh-CN)
- 样式：深色背景，浅色边框

#### 控制按钮
- **开始录音**：绿色背景 (#10b981)，图标+文字
- **停止录音**：红色背景 (#ef4444)，图标+文字
- 状态切换：录音中按钮变为停止状态

#### 结果显示区
- 实时显示识别文字
- 支持换行
- 滚动显示（超出时）
- 空状态时显示提示文字

#### 状态指示器
- 空闲状态：灰色圆点
- 录音中：绿色闪烁圆点 + "正在聆听..."
- 错误状态：红色 + 错误信息

## 3. 功能规范

### 核心功能
1. **语言选择**：用户可选择识别语言
2. **开始录音**：点击开始，浏览器请求麦克风权限并开始识别
3. **停止录音**：点击停止，结束识别会话
4. **实时显示**：识别结果实时追加显示到文本区域

### 用户交互流程
1. 用户打开页面 → 默认语言为中文
2. 用户可选择语言（可选）
3. 用户点击「开始录音」→ 弹出麦克风权限请求 → 开始识别
4. 用户说话 → 文字实时显示
5. 用户点击「停止」→ 结束识别
6. 可再次点击开始继续识别（新内容追加）

### 边界情况
- 麦克风权限被拒绝：显示错误提示
- 浏览器不支持 Web Speech API：显示兼容性提示
- 识别中断：显示状态变化
- 无声音输入：持续等待

## 4. 技术实现

### 4.1 文件结构
```
speech2text/
├── src/
│   ├── index.ts                 # 入口文件
│   ├── types.ts                 # TypeScript 类型定义
│   ├── SpeechToText.ts          # 核心类
│   ├── hooks/
│   │   └── useSpeechToText.ts   # React Hook
│   └── composables/
│       └── useSpeechToText.ts   # Vue Composable
├── dist/                        # 构建输出
├── index.html      # 示例页面（独立使用）
├── style.css       # 示例页面样式
├── app.js          # 示例页面逻辑
├── package.json    # npm 包配置
├── rollup.config.js
├── tsconfig.json
└── SPEC.md
```

### 4.2 npm 包使用方式

```bash
npm install speech2text-web
```

#### React 使用
```jsx
import { useSpeechToText } from 'speech2text-web';

function App() {
  const { transcript, isListening, start, stop } = useSpeechToText({
    lang: 'zh-CN',
    onResult: (text, isFinal) => {
      console.log(isFinal ? '最终: ' + text : '临时: ' + text);
    }
  });

  return (
    <div>
      <p>{transcript}</p>
      <button onClick={isListening ? stop : start}>
        {isListening ? '停止' : '开始'}
      </button>
    </div>
  );
}
```

#### Vue 使用
```vue
<template>
  <div>
    <p>{{ transcript }}</p>
    <button @click="isListening ? stop() : start()">
      {{ isListening ? '停止' : '开始' }}
    </button>
  </div>
</template>

<script setup>
import { useSpeechToText } from 'speech2text-web';

const { transcript, isListening, start, stop } = useSpeechToText({
  lang: 'zh-CN'
});
</script>
```

#### 原生 JS 使用
```javascript
import { SpeechToText } from 'speech2text-web';

const stt = new SpeechToText({
  lang: 'zh-CN',
  onResult: (text, isFinal) => {
    console.log(text);
  },
  onStart: () => console.log('开始'),
  onError: (err) => console.error(err)
});

stt.start();  // 开始
stt.stop();   // 停止
stt.setLanguage('en-US');  // 切换语言
stt.destroy();  // 销毁
```

### 4.3 Web Speech API 使用
```javascript
// 核心 API
const recognition = new SpeechRecognition();
recognition.continuous = true;       // 持续识别
recognition.interimResults = true;   // 返回临时结果
recognition.lang = 'zh-CN';          // 设置语言

// 事件
recognition.onresult = (event) => {};   // 识别结果
recognition.onstart = () => {};         // 开始识别
recognition.onend = () => {};           // 识别结束
recognition.onerror = (event) => {};    // 错误处理
```

### 浏览器兼容性
- Chrome: ✅ 完全支持
- Edge: ✅ 完全支持
- Safari: ⚠️ 部分支持（需要 webkit 前缀）
- Firefox: ❌ 不支持 SpeechRecognition
