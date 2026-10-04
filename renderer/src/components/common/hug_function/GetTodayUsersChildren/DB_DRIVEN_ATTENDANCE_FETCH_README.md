# attendance_fetch_today_users DB駆動化

## 変更内容

`GetTodayUsersChildren` の現在の動作を維持したまま、今日の利用者取得を既存DB Flowへ接続しました。

使用する既存Flow:

- flow_key: `attendance_fetch_today_users`
- step_key: `fetch_today_users`
- rule_key: `attendance_fetch_today_users`

## DBから参照する設定

- request.url
- request.method
- request.credentials
- request.query
- loginCheck
- table.primarySelector / fallbackSelector / bodySelector
- columns.childInfo / enter / leave
- child.idQueryParameter / nameSelector
- attendance.timePattern

## Rendererに残すもの

- HUGログイン確認 (`isHugLoggedIn`)
- HUGキャッシュ用WebView取得
- WebView内でのfetch/DOMParser実行
- Redux / AppState保存
- 60秒自動取得
- Toast
- 二重取得防止

## 互換性

取得結果の既存形式は維持しています。

```text
{ ok, html, rowCount, className, pageTitle, pageUrl }
```

抽出結果も下流互換のため、以下のキー名は変更していません。

```text
children_id
children_name
column1Html
column5
column5Html
column6
column6Html
```

## DB変更

既存の `auto(4).sql` に必要なFlow / Step / Rule定義が存在するため、実行用SQL変更は不要です。
