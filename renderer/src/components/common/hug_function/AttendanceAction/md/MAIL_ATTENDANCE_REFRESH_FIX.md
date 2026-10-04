# メール通知あり入退室後の再取得修正

## 修正内容

1. 出席詳細GETにキャッシュバスター `_hug_refresh=Date.now()` を追加。
2. `fetch()` を `cache: "no-store"` + no-cache headers に変更。
3. RendererからHUG側メール通知モーダルの選択ボタンをクリックした後、対象児童の入室/退室結果が取得HTMLへ反映されるまで最大6回・500ms間隔で再取得。
4. 反映確認後にRedux / AppStateを更新。

## DB変更

この修正についてDB変更は不要です。
既存の `attendance_enter_with_mail` / `attendance_leave_with_mail` のフロー設定はそのまま利用します。
