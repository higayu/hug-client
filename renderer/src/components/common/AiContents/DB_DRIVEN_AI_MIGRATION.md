# AI実行 DB駆動化

## 現行処理

- DeepSeek: renderer内で対象WebView・ドメイン・editor selector・送信ボタンselector・待機処理をハードコードし、`executeJavaScript()` で送信。
- ChatGPT: renderer内でChatGPT WebView探索、composer/editor/send button selector、入力・送信待機をハードコードし、`executeJavaScript()` で送信。
- Gemini: rendererからAPI URL、モデル候補、retry、request body、response parserをハードコードして `fetch()`。
- Ollama: rendererからURL補正、`/api/generate` / `/api/chat` のbody差分、response parserをハードコードして `fetch()`。
- OpenRouter: rendererからAPI URL、system prompt、request body、response parserをハードコードして `fetch()`。
- Laravel API: rendererから `promptKey` ごとに既存 `electronAPI` を選択して実行。

## DB駆動化後

```text
UI / PromptPanel
  -> sendPromptToXxx.js
  -> flow_key + runtime input
  -> web_automation_flows
  -> web_automation_flow_steps
  -> web_automation_rules
  -> executeAiAutomationFlow
  -> ai-webview-prompt / http-json / electron-api
  -> WebView または API
  -> web_automation_execution_logs
```

## DBへ移した設定

- AI対象ドメイン / URL
- composer / editor / send button selector
- selector候補順
- wait timeout / interval
- DeepSeek送信ボタンSVG fallback
- Geminiモデルfallback / retry対象status / API body / response path
- Ollama endpoint補正 / generate・chat body / response path
- OpenRouter system prompt / temperature / max_tokens / body / response path
- Laravel AIの promptKey route 定義

APIキー・入力本文・model・Ollama URLなど実行時に決まる値はDBへ固定していません。

## rendererへ残した処理

- Flow取得
- Flow / Step / Rule正規化
- テンプレート展開
- WebView探索
- textarea / input / contenteditableへの汎用入力
- send button探索 / click
- fetch / timeout / retry
- response path抽出
- Electron APIホワイトリスト実行
- execution log保存

## flow_key / rule_key

- `ai_deepseek_prompt_send`
- `ai_chatgpt_prompt_send`
- `ai_gemini_prompt_send`
- `ai_ollama_prompt_send`
- `ai_openrouter_prompt_send`
- `ai_laravel_prompt_send`

## action_type / executor

- DeepSeek / ChatGPT: `action_type=ai-prompt-send`, `executor=ai-webview-prompt`
- Gemini / Ollama / OpenRouter: `action_type=post`, `executor=http-json`
- Laravel AI: `action_type=execute-function`, `executor=electron-api`

## main / preload

変更不要です。

既存の以下を使用します。

- `laravel_webAutomationFlow_get`
- `laravel_webAutomationExecutionLog_create`
- `laravel_webAutomationExecutionLog_update`
- Laravel AI既存API

## 変更ファイル

変更:
- `AiContents/DeepSeekContent/send/sendPromptToDeepSeek.js`
- `AiContents/OpenAiContent/send/sendPromptToChatGPT.js`
- `AiContents/GeminiContent/send/sendPromptToGemini.js`
- `AiContents/OllamaContent/send/sendPromptToOllama.js`
- `AiContents/OpenRouterContent/send/sendPromptToOpenRouter.js`
- `AiContents/LaravelApiContent/send/sendPromptToLaravelApi.js`

新規:
- `AiContents/common/webAutomation/executeAiAutomationFlow.js`
- `ai_web_automation_db.sql`

変更不要:
- 各PromptBox / PromptPanel呼び出し側
- main
- preload

## 適用順

1. `ai_web_automation_db.sql` をDBへ実行。
2. rendererの `AiContents` を修正版へ置換。
3. Electronを再ビルド/再起動。
4. 各AIタブから送信。
5. `web_automation_execution_logs` に `flow_key` / `rule_key` / status が記録されることを確認。
6. DBのselectorやtimeoutを変更し、rendererを変更せず反映されることを確認。

