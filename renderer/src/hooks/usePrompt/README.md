# usePrompt 修正パッチ

- `getActiveAiPrompts({ databaseType, staffId, itemId, scope: "company" })` の `scope` をLaravel IPCまで転送します。
- `item_id=51` を `F_SOAIP2` として正規化します。画面側のキー名も一致させてください。
- 会社共有プロンプトの保存時に `companyId` が正の整数か検証します。
- `scope` 未指定の場合は従来の取得APIペイロードを維持します。
- 権限の最終判定はLaravel API側で行ってください。
- Electronの実機テストは未実施です。
