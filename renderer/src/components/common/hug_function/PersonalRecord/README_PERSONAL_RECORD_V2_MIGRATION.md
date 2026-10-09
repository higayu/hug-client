# 個人記録取得 WebAutomation V2 統一

## V2へ統一した取得経路
- PersonalRecordGetDayBtn
- PersonalRecordGetMonthBtn
- PersonalRecordCheckPanel / usePersonRecordCheck

## 共通取得処理
`PersonalRecord/PersonalRecordManagerPanel2/PersonSwitchPanel/fetchPersonalRecordV2.js`

実行順:
1. `personal_record_list_fetch`
2. HUG児童一覧から選択児童を特定して対象レコードを絞り込み
3. 日単位の場合は対象日でも絞り込み
4. `personal_record_detail_fetch`
5. V2の `recordStaffId / recordStaffName` を既存保存処理が期待する `recordStaff` 形式へ変換

## DB保存処理
変更していません。
既存の各 `postServiceRecordsToLocalApi()` をそのまま使用します。

## 削除した旧取得処理
`MonthControls/PersonalRecordGetMonthBtn/fetchPersonalRecord2/`

このZIP内では `@/utils/fetchPersonalRecord`、`fetchPersonalRecord2`、`getHugWebviewForCache`、直接の `webview.executeJavaScript()` を個人記録取得経路から除去済みです。
