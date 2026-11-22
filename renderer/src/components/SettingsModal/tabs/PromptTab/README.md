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

## バージョン履歴

各プロンプトの「バージョン履歴を開く」から、20件ずつ履歴を確認できます。

- 履歴を選択すると本文・作成日時・作成者を表示します。
- 「この内容を編集欄に読み込む」は下書きへの反映だけです。下部の「保存」で新しい版になります。
- 「この版を復元」→「復元して保存」は、その内容を新しいバージョンとして使用します。
- 現在と同じ本文なら新しい版は増やしません。過去の履歴は変更・削除しません。
- 当該プロンプトに未保存の変更がある場合は復元を無効にします。他の項目の下書きは復元後も保持します。
- 履歴の閲覧はLaravelのAiPromptAccess::visible、保存・復元はcanEditで認可します。
- 保存・復元時はexpected_history_idを送信します。他の操作で最新版が変わっていた場合は409で拒否します。
- 履歴APIは /api/ai-prompts/{promptId}/histories（一覧）、/{historyId}（本文）、/{historyId}/restore（POST）です。
- 既存のai_prompts / ai_prompt_historiesを使用するため、追加SQLは不要です。ElectronのPreload変更後は再起動してください。

## 初期化の対象

「基本プロンプトを初期化」は基本プロンプトの見出し内に配置します。基本プロンプトのうち編集可能な項目だけを初期値へ戻します。会社共有専用プロンプトは初期化せず、編集中の内容も保持します。初期化だけではDBに保存されません。
