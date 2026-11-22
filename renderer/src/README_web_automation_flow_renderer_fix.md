# web_automation_flows 入退室DB Flow実行対応

## 目的

入室・退室処理を、固定の `nyushituInWebview` / `taishitsuFromOnclickInWebview` 直接実行だけではなく、DB の以下3テーブルから Flow / Step / Rule を取得して実行する形へ変更します。

- `web_automation_flows`
- `web_automation_flow_steps`
- `web_automation_rules`

## 変更概要

### 追加

以下に Flow 実行ランタイムを追加しました。

- `attendance/flow/attendancePostFlow.js`

この中で以下を実行します。

1. `window.electronAPI.laravel_webAutomationFlow_get(flowKey, { app_key, webview_key })` でDB Flowを取得
2. Flow内の active な Step を `step_order` 順に整理
3. Step に紐づく Rule の `config_json` を解析
4. HUG onclick の `sendEnterMail(...)` / `sendLeaveMail(...)` を Rule 設定に従って解析
5. `data_list[...]` を組み立て
6. HUG webview 内で `ajax/ajax_attendance.php` へPOST

### 修正

以下を修正しました。

- `attendance/perform/performEnterAction.js`
- `attendance/perform/performLeaveAction.js`
- `attendance/post/postAttendanceInWebview.js`

`performEnterAction` / `performLeaveAction` は、まずDB Flow経由で実行します。
失敗した場合は、既存の互換POSTへフォールバックします。

## 対象経路

今回のZIPでは、以下の両方に効くように、実際に参照されているパスを修正しています。

- `ChildAttendancePanel`
- `SimpleBoard/AttendanceRow` → `useSimpleAttendance`

また、重複して存在していた以下の共通系にも同じ修正を反映しています。

- `src/components/common/hug_function/AttendanceAction/attendance`
- `src/utils/attendance`

## 実行時確認

入室または退室ボタン実行時、Consoleに以下が出ればDB Flow経由です。

```txt
[AttendancePostFlow] POST dataList:
```

以下が出る場合は、DB Flow取得またはRule解析に失敗し、旧POSTへフォールバックしています。

```txt
[performEnterAction] web_automation_flows 実行失敗。互換POSTへフォールバックします。
[performLeaveAction] web_automation_flows 実行失敗。互換POSTへフォールバックします。
```

## 前提

main / preload 側に以下が必要です。

```js
window.electronAPI.laravel_webAutomationFlow_get
```

DB側には以下の Flow が必要です。

- `attendance_enter`
- `attendance_leave`

