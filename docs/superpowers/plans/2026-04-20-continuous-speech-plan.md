# 长时间连续语音识别实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现长时间连续语音识别，在用户主动停止前自动重启识别会话；同时修复 Vue Composable 的重复内容问题。

**Architecture:** 修改 `SpeechToText` 核心类，在 `onend` 时判断是否需要自动重启；同步修复 Vue Composable 的去重逻辑与 React Hook 一致。

**Tech Stack:** TypeScript, Web Speech API, React Hooks, Vue Composable

---

## 文件变更概览

| 文件 | 修改内容 |
|------|---------|
| `src/SpeechToText.ts` | 新增 `_restarting` 标志；修改 `onend` 实现自动重启；修改 `start()` 设置 `_restarting` 状态 |
| `src/composables/useSpeechToText.ts` | 新增 `lastInterimRef` 去重逻辑，与 React Hook 保持一致 |

---

## Task 1: 修改 `SpeechToText.ts` — 核心类自动重启逻辑

**Files:**
- Modify: `src/SpeechToText.ts:1-155`

- [ ] **Step 1: 添加 `_restarting` 私有字段**

在现有私有字段区域添加：

```typescript
private _restarting = false;
```

- [ ] **Step 2: 修改 `start()` 方法，设置 `_restarting` 状态**

找到 `start()` 方法，修改为：

```typescript
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
```

找到 `recognition.onstart`，在回调中设置 `_restarting = false`：

```typescript
this.recognition.onstart = () => {
  this._isListening = true;
  this._restarting = false;
  this._onStart?.();
};
```

- [ ] **Step 3: 修改 `onend` 事件处理器，实现自动重启**

找到 `onend` 事件处理器，修改为：

```typescript
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
```

- [ ] **Step 4: 验证修改**

确认 `src/SpeechToText.ts` 中：
- `_restarting` 字段存在
- `start()` 中设置 `_restarting = true`
- `onstart` 中设置 `_restarting = false`
- `onend` 中实现自动重启逻辑

- [ ] **Step 5: 提交**

```bash
git add src/SpeechToText.ts
git commit -m "feat: 添加连续识别自动重启逻辑
- 新增 _restarting 标志防止 onend 误判
- onend 时检测 continuous 模式并自动重启识别
- start() 时设置 _restarting 状态
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 修改 `src/composables/useSpeechToText.ts` — Vue 去重逻辑

**Files:**
- Modify: `src/composables/useSpeechToText.ts`

- [ ] **Step 1: 添加 `lastInterimRef` ref**

在现有 ref 区域添加：

```typescript
// 跟踪上一次的临时结果，用于去重
const lastInterimRef = ref('');
```

- [ ] **Step 2: 修改 `onResult` 回调，实现去重逻辑**

找到 `onResult` 回调，修改为：

```typescript
onResult: (text, isFinal) => {
  if (isFinal) {
    // 如果最终结果的开头包含上一次的临时内容，说明临时内容已被确认为最终内容的一部分
    // 需要移除临时内容，避免重复
    const prevInterim = lastInterimRef.value;
    if (prevInterim && text.startsWith(prevInterim)) {
      transcript.value = transcript.value.slice(0, -prevInterim.length) + text;
    } else {
      transcript.value += text;
    }
    lastInterimRef.value = '';
  } else {
    transcript.value = text;
    lastInterimRef.value = text;
  }
  options.onResult?.(text, isFinal);
},
```

- [ ] **Step 3: 验证修改**

确认 `src/composables/useSpeechToText.ts` 中：
- `lastInterimRef` 存在且类型正确
- `onResult` 中实现了与 React Hook 一致的去重逻辑

- [ ] **Step 4: 提交**

```bash
git add src/composables/useSpeechToText.ts
git commit -m "feat: 同步 Vue Composable 去重逻辑
- 新增 lastInterimRef 跟踪临时结果
- 最终结果来时检查是否包含临时内容，避免重复
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 构建并测试

**Files:**
- Test: `examples/react-demo/`

- [ ] **Step 1: 构建项目**

```bash
cd /Users/fxy/Documents/speech2text && npm run build
```

预期：构建成功，无错误

- [ ] **Step 2: 启动 React Demo 测试**

```bash
cd /Users/fxy/Documents/speech2text/examples/react-demo && npm run dev
```

- [ ] **Step 3: 手动测试场景**

1. 点击"开始录音"，说一段连续的话（超过 10 秒）
2. 验证识别没有中断
3. 点击"停止录音"，验证内容完整无重复
4. 刷新页面，再次测试，验证结果一致

- [ ] **Step 4: 提交最终变更**

```bash
git add -A
git commit -m "feat: 完成长时间连续识别功能
- SpeechToText 支持自动重启连续识别
- Vue Composable 去重逻辑与 React Hook 同步
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 自检清单

- [ ] 设计文档中的每个修改点都有对应的 Task 和 Step
- [ ] 所有代码示例都是完整可运行的，无占位符
- [ ] 文件路径、字段名、方法签名在所有 Task 中保持一致
- [ ] `src/SpeechToText.ts` 的修改完整：`_restarting` 字段、`start()` 设置状态、`onstart` 重置状态、`onend` 自动重启
- [ ] `src/composables/useSpeechToText.ts` 的去重逻辑与 `src/hooks/useSpeechToText.ts` 一致
