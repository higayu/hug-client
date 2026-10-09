# GetTodayUsersChildren WebAutomation V2 移行

`useAttendanceFetch/index.js` は、旧来の以下の直接処理を呼ばなくなりました。

- `fetchAttendanceViaHugTab()`
- `extractColumnData()`
- `isHugLoggedIn()` による事前判定

代わりに以下だけを実行します。

```js
const result = await executeFlowV2(
  "attendance_fetch_today_users",
  {
    facilityId,
    dateStr,
  }
);
```

DB Flow が以下を担当します。

1. WebViewから出席表HTML取得
2. ログインページ判定
3. Renderer上でHTML解析
4. 児童ID・氏名・入室・退室・編集URL抽出
5. 完成データを返却

Renderer側にはRedux / AppState更新だけを残しています。

旧 `useAttendanceFetch/attendance/` 配下はV2動作確認中のロールバック用として残していますが、現在の `useAttendanceFetch/index.js` からは参照されません。
