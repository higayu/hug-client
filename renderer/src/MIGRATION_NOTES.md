# Renderer role移行

- `role_id` 数値判定を廃止し、認証ユーザーの `role_code` と `staff_company_roles` で表示を制御。
- `staffs.role_id` を職員基本情報更新ペイロードから削除。権限変更はFilamentから行う。
- `admin` は全社、`mentor` / `franchise_admin` は `staff_company_roles` に明示された会社のみ職員管理可能。
- 会社不明・会社を跨ぐ職員は管理対象外（安全側）。
- DB全件取得に4テーブル追加。SQLiteデータに4テーブルがない場合は空配列のため会社別管理権限は付与されない。
- Laravel側で権限と対象施設を必ず再検証すること。
- `SettingsModal` の `useSettingsModal` および `ModalPortal` は元ZIPに含まれないため別途維持。
