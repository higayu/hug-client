# WorkingPanel AiContents - AI入力の分離

AIに送信するテキストを以下の単位で分離します。

- 日付
- 児童ID
- 種別
  - personal
  - professional1

## 修正対象

- PersonalRecordPrompt/index.jsx
- ProfessionalPrompt1/index.jsx
- store/slices/aiChatSlice.js

## キー対応

- 個人記録: `AI_CHAT_TEXT_KEYS.PERSONAL`
- 専門的支援: `AI_CHAT_TEXT_KEYS.PROFESSIONAL_1`

これにより同じ日付・同じ児童でも個人記録と専門的支援のテキストエリアが互いに上書きされません。
