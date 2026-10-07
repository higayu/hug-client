# Renderer 入退室修正 2026-10-07

## 修正対象
AttendanceAction/attendance/_shared/webview.js

## 修正内容
- 同じ出席詳細URLでも必ず `webview.reload()` する
- reload/src変更前に `did-finish-load` 監視を開始する
- `did-finish-load` 後に対象日と出席表テーブルのDOM生成完了を確認する
- 読み込み失敗と15秒タイムアウトを明示する
- DB側の `reloadAttendanceDetailBeforeExecute=true` の意図とRenderer挙動を一致させる

## DB側前提
- attendance_enter_no_mail / attendance_leave_no_mail: detectMailDialog=false, reloadAttendanceDetailBeforeExecute=true
- attendance_enter_with_mail / attendance_leave_with_mail: detectMailDialog=true, reloadAttendanceDetailBeforeExecute=true

## 今日の利用者取得
`attendance_fetch_today_users` はfetchで最新HTMLを取得する別処理のため、今回のDOM同期修正対象ではありません。
