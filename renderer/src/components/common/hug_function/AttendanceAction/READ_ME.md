AttendanceAction DB駆動化 / 常時実行ログ化
2026-10-01

■ 主な変更
1. メール通知あり入室/退室も executeAttendanceNativeFlow() に統一
   - attendance_enter_with_mail
   - attendance_leave_with_mail
   これによりメールあり/なし4経路すべてが web_automation_flows -> flow_steps -> rules を取得して実行する。

2. web_automation_execution_logs をデバッグモードに関係なく保存
   - 開始: running
   - 正常終了: success
   - 例外: failed
   - execution_uuid で同一実行を追跡
   ログAPI保存失敗だけではHUGの入退室処理を止めない。

3. WebView DOM操作設定をDBへ移動
   Rule config_json から以下を読み取る。
   - execute
   - functionName
   - cellIdPrefix
   - selectorTemplate
   - reloadAttendanceDetailBeforeExecute
   - detectMailDialog
   - mailDialogSelector
   - mailDialogButtonSelector
   - mailDialogTimeoutMs
   - attendanceActionCompletionTimeoutMs

4. main / preload
   現行コードですでに以下が公開・登録済みのため追加修正不要。
   - laravel_webAutomationFlow_get
   - laravel_webAutomationExecutionLog_create
   - laravel_webAutomationExecutionLog_update

■ 適用順
1. renderer 修正版を反映
2. attendance_web_automation_db_migration_20261001.sql をDBへ適用
3. 入室/退室（通知あり/なし）を各1回テスト
4. web_automation_execution_logs を execution_uuid / started_at DESC で確認
