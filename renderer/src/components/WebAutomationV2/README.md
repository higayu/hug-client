# WebAutomationV2 Renderer 共通Executor

`executeFlowV2(flowKey, input, options)` を共通入口として、LaravelのV2 Flow/Stepを実行する。

## 責務

- published Flow + active Steps取得
- execution context作成
- `{{variable}}` 展開
- step_order順実行
- retry / retry_delay_ms / timeout_ms
- condition_json / continue_on_error
- output_key保存
- Step単位Execution Log作成・更新
- run-flowによるFlow間呼び出し

DB内のJavaScript文字列はevalしない。`step_type` と strategy はRenderer側のホワイトリストに登録された処理のみ実行する。

## attendance

`createAttendanceRuntime()` がHUG固有処理を登録する。

```js
const runtime = createAttendanceRuntime({ dispatch, updateAppState })
await executeFlowV2('attendance_fetch_today_users', {
  facilityId,
  dateStr,
}, { runtime })
```

V2 FlowはLaravel API上で `published` のものだけ取得されるため、DBがdraftの間は既存処理を残して並行開発する。
