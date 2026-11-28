ChatGPT送信処理修正版（2026-10-31）

原因:
 common/PersonalRecordPrompt/index.jsx で textValue を作っているのに、sendPrompt({ prompt, message, promptKey }) として渡していた。
 一方 sendPromptToChatGPT は textValue を必要とするため、undefined となり空テキスト判定された。

対応:
 1. common/PersonalRecordPrompt/index.jsx: sendPrompt({ textValue, promptKey }) に修正。
 2. 前回のエラーログ改善版 executeFlowV2.js と sendPromptToChatGPT.js を同梱。

ファイルを同じ相対パスに上書きしてください。
（ログ出力の改善版を既に適用している場合も、同じ内容なので上書き可能です。）
