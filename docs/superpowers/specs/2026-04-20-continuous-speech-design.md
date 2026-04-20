# 长时间连续语音识别设计

## 问题

Chrome 的 Web Speech API 在 `continuous: true` 模式下，并非保持一个开放连接，而是每次识别一段语音后自然触发 `onend`，然后需要重新调用 `start()` 才能继续。当前代码在 `onend` 时直接结束，导致识别几秒后中断，无法长时间连续识别。

## 修改范围

### 1. `src/SpeechToText.ts` — 核心类

**新增私有字段：**
- `_restarting: boolean` — 防止 `start()` 调用过程中 `onend` 触发时误判

**修改 `onend` 事件处理器：**
```
onend 触发时：
  - 如果是用户主动 stop()（_manualStop = true）→ 正常结束，清除状态
  - 如果是 continuous 模式且不是 restart 状态 → 自动调用 recognition.start() 重新开始
```

**修改 `start()` 方法：**
- 调用 `recognition.start()` 前设置 `_restarting = true`，start() 成功后设置 `_restarting = false`

### 2. `src/composables/useSpeechToText.ts` — Vue Composable

**问题：** 当前 Vue Composable 没有去重逻辑，直接 `transcript.value += text`，会导致重复内容。

**修复：** 同步 React Hook 的去重逻辑：
- 使用 `lastInterimRef` 跟踪上一次的临时结果
- 当最终结果来时，检查是否以上一次的临时内容开头，如果是则移除临时内容再追加

## 数据流

```
用户点击开始 → start()
  ↓
recognition.start()
  ↓
识别一段语音 → onresult(final) → 追加到 transcript
  ↓
识别结束 → onend
  ↓
continuous && !_manualStop && !_restarting → recognition.start()（自动重启）
  ↓
重复直到用户点击停止
```

## 状态机

| 状态 | `_manualStop` | `_restarting` | `continuous` | onend 行为 |
|------|--------------|---------------|-------------|-----------|
| 用户正常停止 | true | - | - | 结束，不重启 |
| 连续识别中 | false | false | true | 自动重启 |
| 识别出错/结束 | false | true | - | 不重启（start 成功后会重置） |

## 风险与边界

1. **循环重启失控**：如果浏览器一直触发 onend 但 start() 失败，会导致死循环。需要检查 `onerror` 中是否也需要处理自动重启的情况。

2. **Safari 兼容性**：Safari 对 continuous 模式支持不完整，自动重启逻辑在 Safari 上可能无效。但当前 demo 主要使用 Chrome，此修改不影响 Safari 的基础功能。

3. **Vue 去重逻辑与 React 一致性**：React Hook 的去重逻辑已写入 CLAUDE.md，应保持同步。
