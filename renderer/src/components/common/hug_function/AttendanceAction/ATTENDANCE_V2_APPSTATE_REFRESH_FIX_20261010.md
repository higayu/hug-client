# Attendance V2 AppState反映修正（2026-10-10）

## 原因
`attendance_fetch_today_users` の再取得自体は成功していたが、`runAttendanceUpdate()` が `updateAppState({ attendanceData })` に依存していた。
呼び出し元から `updateAppState` / `dispatch` が渡されない経路では、再取得または AppStateContext 反映がスキップされる可能性があった。

## 修正
- `runAttendanceUpdate()` で `store.dispatch` をフォールバックとして使用。
- `attendanceSlice` の `setTableData` / `setExtractedData` を必ず更新。
- `AppStateContext.setAttendanceData()` と同じ `appStateSlice.setAttendanceData` を直接 dispatch。
- `enter.js` / `exit.js` の再取得条件から `opts.dispatch` 必須条件を削除。
- `updateAppState` 依存を削除。

## 結果
入室・退室のメールあり/なしに関係なく、V2アクション成功後の再取得結果が Redux の appState.attendanceData に反映され、AppStateContext の attendanceData も同じ値へ更新される。
