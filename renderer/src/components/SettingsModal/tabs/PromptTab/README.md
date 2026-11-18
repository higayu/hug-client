# PromptTab 表示権限制御パッチ

- `item_id` 50 / 51 / 100 / 150 は認証済み `admin`, `mentor`, `franchise_mentor` のみに表示します。
- `staff`, `franchise_staff`、未認証、ロール未取得時は当該項目を描画せず、管理用 `scope: 'company'` APIも呼び出しません。
- 1〜4番の表示・編集ルールは維持します。
- 変更・初期化・保存の対象も表示可能な項目に限定します。
- Laravel API側の権限制御は引き続き必須です。

既存プロジェクトの `PromptTab/index.jsx` を同名ファイルで置き換えてください。`const.js` は前回のパッチ版を同梱しています。

`usePrompt`は会社共有専用項目の保存時に`scope: 'company'`をAPIへ転送します。

## 保存APIのscope

- 1〜4番の会社共有プロンプトは`company_id`を指定し、`scope`は送信しません。
- 50/51/100/150番の会社共有専用項目は`company_id`と`scope: 'company'`を指定します。
- Laravelの`scope=company`は専用項目の管理モードです。通常の会社共有保存に指定すると、adminでも422で拒否されます。
- admin/mentor/franchise_mentorの編集権限はLaravelの`AiPromptAccess::canEdit`で引き続き検証します。
