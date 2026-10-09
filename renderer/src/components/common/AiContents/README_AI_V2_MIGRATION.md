# AI WebAutomation V2 移行

## V2化対象
- ai_deepseek_prompt_send
- ai_chatgpt_prompt_send
- ai_gemini_prompt_send
- ai_ollama_prompt_send
- ai_openrouter_prompt_send
- ai_laravel_prompt_send

## DB
`DB/ai_remaining6_v2_all.sql` を実行してください。

各Flowは `web_automation_flows_v2` に published version=1 として追加/更新し、
`web_automation_files_v2` に `index.js` / `runtime.js` を登録します。

## Renderer
`AiContents/common/webAutomation/executeAiAutomationFlow.js` をV2ブリッジへ変更しました。
各プロバイダの `sendPromptTo*.js` の公開API・戻り値は維持しています。

## 実行方式
- DeepSeek / ChatGPT: AI WebView操作
- Gemini / Ollama / OpenRouter: HTTP JSON
- Laravel: 既存 preload Electron API

## 機密入力
APIキー・textValue・prompt・message はV2実行ログへ本文を保存しません。
Rendererメモリの一時Mapへ置き、Flow実行時だけ仮想JSから参照し、終了時に削除します。
ログ側には文字数メタ情報と一時キーのみが渡ります。
