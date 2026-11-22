# AI種別の権限制御

- 対象はhug-client-basic。Laravel認証済みのadmin / mentor / franchise_mentorだけがAI種別を選択できる。
- staff / franchise_staff、未認証、ロール未取得、認証確認中はLaravelApiを使用する。
- 共有設定はsrc/aiModePolicy.json。旧role_idやINIに記載されたロールを権限判定に使用しない。
- ReduxのルートReducerとselectUseAIの両方で実効値を補正する。設定の再読み込み、直接の状態更新、アカウント変更でも一般職員を別AIへ切り替えない。
- AI設定画面は一般職員にLaravel APIだけを表示し、変更・保存操作を提供しない。
- Mainプロセスは非LaravelモードをINIから返す／保存する前に、既存トークンでLaravelのauth/meを確認する。未認証・通信失敗・一般職員ならLaravelApiに補正する。
- 読み込み時は、未認証状態でも管理者が以前保存した選択をディスクから削除しない。実効値だけLaravelApiとして返す。管理者の認証が確認された後、Contextが再読み込みして保存済みの選択を復元する。
- 全体保存・個別更新では権限判定済みの値を保存する。一般職員の更新ではLaravelApiに固定する。他のINI項目は維持する。
- ini.json、ini.json.example、defaultIniのuseAIはLaravelApiが既定。実行時は既存ファイルの値だけで許可を判断しない。

検証：`node --test scripts/test-ai-mode-policy.cjs scripts/test-prompt-save-scope.cjs`

テストは認証レスポンス・一時INIで実行し、実際のアカウントやINI、Laravel APIへアクセスしない。
実アプリでは一般職員のログイン、INIに別AIを保存した状態での起動、管理者への切り替え、管理者から一般職員への切り替えを確認する。
