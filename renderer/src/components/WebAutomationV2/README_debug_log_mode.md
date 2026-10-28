# WebAutomation V2 Debugログ保存ポリシー

## 適用
1. DBバックアップ後、`sql/2026_10_28_add_debug_log_mode.sql` を一度実行。
2. `WebAutomationV2/executeFlowV2.js` を既存の同名ファイルに上書き（他の3ファイルは変更なし）。
3. **Laravel / Electron の既存ログ保存経路を確認**。添付にはこのコードが含まれないため、DBまでの保存は現物未検証。
4. 公開済みFlowの debug_log_mode に `always` または `failed_only` を設定。

## 仕様
- always: 成功時・失敗時の `webAutomationV2_executionLogFinish` に `debug` オブジェクトを添付。
- failed_only（既定）: 成功時は `debug` キー自体を送信せず、失敗時だけ添付。
- 開始/終了・結果・失敗ステータスなど、既存の実行履歴は変更しない。
- デバッグ内容は executionUuid, flowId/Key/Version, status, 日時, durationMs, 失敗時のエラー種別・メッセージ・stack。
- 入力の児童情報やHUGのHTMLをDebugに複製しない（機微情報の重複保存回避）。

## Laravel側で必要な確認・修正
- published Flow取得APIが `debug_log_mode` を応答の flow に含めているか。`select` に列を限定している場合は追加する。
- Electron preload/main の `webAutomationV2_executionLogFinish` が payload.debug をLaravelへ転送するか。
- Laravelの終了ログAPIが payload.debug を JSON化して `web_automation_execution_logs_v2.debug_json` に保存するか。
- サーバ側も `flow_id` から `debug_log_mode` を再取得して、success + failed_only なら debug_json=NULL とするのが安全。未指定の成功時に古いdebugが残らないようにする。
- finish呼び出し時に HTTPエラー等が発生してもこのExecutorは警告を出して処理を継続する既存仕様。

### 保存処理の参考（実コードへの適用は既存APIの構造に合わせる）
```php
$mode = DB::table('web_automation_flows_v2')->where('id', $log->flow_id)->value('debug_log_mode') ?? 'failed_only';
$shouldStore = $mode === 'always' || $status === 'failed';
$debugJson = $shouldStore && array_key_exists('debug', $payload)
    ? json_encode($payload['debug'], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE)
    : null;
// $log->debug_json = $debugJson; 既存の更新処理に組み込む。
```

## 注意
添付ファイルにLaravel Controller、Electron main/preloadが含まれていないため、**DBまでの完全動作はこのZIP単体では保証できません。**
`result_json` は既存仕様どおり保存され、巨大な実行結果の保存サイズは今回の変更では減らせません。
