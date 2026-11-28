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


## 支援計画の開閉

ChildNotesTabs は PlanNotesPanel の開閉に対応します。初期状態は閉じています。
`defaultExpanded={true}` で初期展開、`isExpanded` と `onExpandedChange(next, noteKey)` で親から制御できます。
非制御時は notes / notes2 ごとに開閉状態を保持します。折りたたみは表示のみで、既存のメモ通知・取得処理は変更しません。
先に Plan_expandable_notes.zip の PlanNotesPanel を適用してください。
