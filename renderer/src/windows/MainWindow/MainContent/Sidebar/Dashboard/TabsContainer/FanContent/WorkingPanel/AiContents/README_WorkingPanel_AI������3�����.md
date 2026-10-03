# WorkingPanel AiContents - AI入力3分割

AIに送信するテキストを以下の単位で分離します。

- 日付
- 児童ID
- 種別
  - personal
  - professional1
  - professional2

## 修正対象

- PersonalRecordPrompt/index.jsx
- ProfessionalPrompt1/index.jsx
- ProfessionalPrompt2/index.jsx
- store/slices/aiChatSlice.js

## キー対応

- 個人記録: `AI_CHAT_TEXT_KEYS.PERSONAL`
- 専門的支援1: `AI_CHAT_TEXT_KEYS.PROFESSIONAL_1`
- 専門的支援2: `AI_CHAT_TEXT_KEYS.PROFESSIONAL_2`

これにより同じ日付・同じ児童でも3つのテキストエリアが互いに上書きされません。
