# ProfessionalSupportWindow LeftPanel 一括更新 V2移行

`PersonalRecordSyncRunner.jsx` のHUG取得処理をWebAutomation V2へ変更。

実行順:

1. `staff_fetch` V2
2. `children_fetch` V2
3. `personal_record_list_fetch` V2
4. `personal_record_detail_fetch` V2
5. 既存 `UpsertServiceRecordsBulk` でLaravel保存

旧 `fetchStaffData.js` / `fetchChildrenData.js` / `personalRecord.js` / `fetchPersonalRecordDetails.js` は比較・ロールバック用として残しているが、`PersonalRecordSyncRunner.jsx` の通常経路からは参照しない。
