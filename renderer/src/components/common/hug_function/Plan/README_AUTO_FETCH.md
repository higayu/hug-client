# 支援計画の未登録時自動取得

変更ファイル: `Plan/PlanNotesPanel/index.jsx`

- `notes` (個別は children.notes、専門は children.notes2) が空文字または空白のみで、`notesLoaded=true` の場合にコンポーネント初期化・児童切替時に WebAutomation V2 を実行します。
- `notes=null` / `undefined` は未読込として取得しません。親のDB読込が非同期の場合、読込完了まで `notesLoaded={false}` としてください。
- 自動取得成功時は既存の保存関数を利用し、`loadDataBase` と `onUpdated` を呼びます。手動更新ボタンは維持します。
- 同一コンポーネント内の同一児童・施設・計画種別では自動リトライしません。手動ボタンで再実行できます。
- 同時に複数パネルが表示された際の重複取得は実行中Promiseを共有して抑止します。
- `updateControl` が独自UIの場合も自動取得処理は有効です。

## 親コンポーネントでの使用例

```jsx
<PlanNotesPanel
  type="individual"
  childId={child.id}
  facilityId={facilityId}
  notes={child.notes}
  notesLoaded={!isChildLoading}
  loadDataBase={loadDataBase}
  onUpdated={(markdown) => { /* 親の notes 表示を更新 */ }}
/>

<PlanNotesPanel
  type="professional"
  childId={child.id}
  facilityId={facilityId}
  notes={child.notes2}
  notesLoaded={!isChildLoading}
  loadDataBase={loadDataBase}
  onUpdated={(markdown) => { /* 親の notes2 表示を更新 */ }}
/>
```

**注意**: 親側で `notes` の初期値を `''` にして非同期ロードしている場合、ロード完了前に自動取得される恐れがあります。`notesLoaded` を正しく渡すか、ロード中は `notes={null}` としてください。

**注意**: ZIPに親コンポーネントは含まれていません。実環境の親側で props を確認し、ビルドとHUGログイン状態での動作テストを行ってください。
