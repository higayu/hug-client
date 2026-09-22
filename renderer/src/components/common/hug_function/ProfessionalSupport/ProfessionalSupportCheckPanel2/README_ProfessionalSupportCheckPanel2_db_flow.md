# ProfessionalSupportCheckPanel2 DB Flow化

## 変更概要

`renderer/src/components/common/hug_function/ProfessionalSupport/ProfessionalSupportCheckPanel2` 内の固定実装を、DB の `web_automation_flows` / `web_automation_flow_steps` / `web_automation_rules` から設定取得して実行する形へ差し替えました。

## DB Flow化した機能

- 専門的支援の下書き/保存POST
  - Flow: `professional_support_draft_save`
  - Rule: `professional_support_draft_post`

- 専門的支援の保存済み件数確認
  - Flow: `professional_support_use_days_check`
  - Rule: `professional_support_use_days_check`

- 専門＋の単体登録
  - Flow: `professional_support_plus_register`
  - Rule: `professional_support_plus_register`

- 専門＋の登録確認
  - Flow: `professional_support_plus_registration_check`
  - Rule: `professional_support_plus_registration_check`

## 追加/更新ファイル

- `professionalSupportWebAutomation.js`
  - DB Flow取得とHUG WebView内実行の共通処理

- `postProfessionalSupportDraft.js`
  - 固定URL/固定POSTを廃止し、`professional_support_draft_save` Flowから設定取得して実行

- `useProfessionalSupportCheck2/fetchHook1/fetchProfessionalCheck/index.js`
  - 固定検索POSTを廃止し、`professional_support_use_days_check` Flowから設定取得して実行

- `index.jsx`
  - 専門＋登録/登録確認をDB Flow版へ差し替え

## SQL

`professional_support_web_automation_upsert.sql` を phpMyAdmin のSQLタブで実行してください。

このSQLで、必要な Rule / Flow / Step を追加・更新します。

## 事前条件

renderer から以下が使える必要があります。

```js
window.electronAPI.laravel_webAutomationFlow_get(flowKey, {
  app_key: 'hug-banso-navi',
  webview_key: '*',
})
```

## 注意

HUG側のURL、セレクタ、POST項目が変わった場合は、コード修正ではなく `web_automation_rules.config_json` の編集で対応できる構成です。
