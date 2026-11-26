# 支援計画取得 WebAutomation V2 移行パッチ

1. `web_automation_plan_flows.sql` を、既存 V2 テーブルがある対象DBに適用してください（DBバックアップ後）。同じ flow_key/version=1 の場合は上書きされます。
2. `renderer/` 以下を既存rendererに上書きしてください。
3. 旧 `Plan/PersonSupportPlan/function/hug_post_list.js` と `hug_get_detail.js` は新経路では不要です。**既存プロジェクト側から削除**してください。
4. DBへの保存は個別 `notes`、専門 `notes2` のまま。HUG取得に失敗した場合は保存しません。
5. プロジェクト側で build と実WebViewログイン状態での動作確認を行ってください（このZIPにはpackage.json等は含みません）。
6. 公開済みFlowは `person_support_plan_fetch` と `professional_plan_fetch` です。WebView上の取得スクリプトはSQLに入っています。

`PersonSupportPlan` / `ProfessionalPlan` は `childId`, `facilityId`, `loadDataBase`, `onUpdated` をpropsで受け取ります。`PlanNotesPanel` が既存のAppState/Reduxから取得し、子コンポーネントへpropsで渡します。

## PlanNotesPanel 開閉制御

- `isExpanded`: 親から制御する開閉状態（boolean）。省略時は内部 state。
- `defaultExpanded`: 非制御時の初期値（既定 true）。
- `onExpandedChange(next)`: 開閉操作時の通知。制御時は親で state を更新する。
- 折りたたみ中も計画の自動取得と更新ボタンは従来どおり動作する。
- テキストの最大高さは従来どおり max-h-64。
