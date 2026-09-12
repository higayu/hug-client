main/parts/handlers/laravelAuthHandler/
├── index.js                          # メインハンドラー
├── auth/
│   ├── index.js                      # 認証エクスポート
│   ├── utils.js                      # 共通ユーティリティ
│   ├── authenticated.js              # 認証付き実行
│   ├── login.js                      # ログイン
│   ├── me.js                         # 認証中スタッフ
│   ├── logout.js                     # ログアウト
│   └── fetchAllTables.js             # 全テーブル取得
├── tempNotes/
│   ├── index.js                      # 一時メモエクスポート
│   ├── utils.js                      # 一時メモ共通
│   ├── fetch.js                      # 一時メモ取得
│   └── save.js                       # 一時メモ保存
└── procedures/
    ├── index.js                      # プロシージャエクスポート
    ├── call.js                       # 汎用プロシージャ
    ├── registerFacilityChildren.js   # 児童データ同期
    ├── syncHugStaffs.js              # 職員データ同期
    ├── upsertServiceRecord.js        # サービス記録保存
    └── upsertManagers2.js            # マネージャー設定保存