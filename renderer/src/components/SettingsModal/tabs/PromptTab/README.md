# PromptTab 表示権限制御パッチ

- `item_id` 50 / 51 / 100 / 150 は認証済み `admin`, `mentor`, `franchise_mentor` のみに表示します。
- `staff`, `franchise_staff`、未認証、ロール未取得時は当該項目を描画せず、管理用 `scope: 'company'` APIも呼び出しません。
- 1〜4番の表示・編集ルールは維持します。
- 変更・初期化・保存の対象も表示可能な項目に限定します。
- Laravel API側の権限制御は引き続き必須です。

既存プロジェクトの `PromptTab/index.jsx` を同名ファイルで置き換えてください。`const.js` は前回のパッチ版を同梱しています。

注意: `usePrompt` が `scope: 'company'` をAPIまで転送するかは別途確認が必要です。
