# Electron プロンプト表示・編集権限パッチ

対象は添付された `PromptTab`, `hooks/usePrompt`, `store` を参照した差分です。

- APIの `company_id` / `staff_id` から会社共有・個人用を判定して表示します。
- 会社共有は認証済みアカウントの会社ロール `mentor` / `franchise_mentor` または全体 `admin` のみ編集可能です。
- 個人用は認証済み本人のみ編集可能です。
- 未登録時は `staffs.use_my_prompt` から種別を推定します。職員データが未ロードの場合は会社共有とみなすため、実運用ではスタッフ一覧のロード完了後に開いてください。
- 閲覧専用のテキストエリアを無効化します。初期化も編集可能なものに限定します。
- 保存時は `company_id` を追加送信します。**LaravelのUpsert APIがcompany_idを受け付け、認証済みユーザーに対して再認可することが前提です。**
- Laravelの取得APIが `company_id` を返さない場合、既存会社共有行を個人用と誤判定する可能性があります。APIレスポンスに `company_id` を必ず含めてください。
- APIレスポンスの `staff_id` と `company_id` が両方NULL/両方非NULLの場合は編集させないようLaravel側でも検証してください。
- `auth_me` から `company_id` が返らない場合、会社共有の編集は無効になります。認証情報を確認してください。
- このパッチはソース上の変更であり、アプリ全体のビルド・実API連携テストは未実施です。
