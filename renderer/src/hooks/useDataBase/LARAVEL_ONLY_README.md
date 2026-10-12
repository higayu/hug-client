# useDataBase 実行経路のLaravel固定

- `index.js` の一括取得処理は `laravelApi.getAllTables()` だけを呼びます。MariaDB/SQLite APIのimport、接続確認、フォールバックの呼び出しを削除しました。
- `loadDataBase(options)` と `reloadData(options)` の公開インターフェースは維持しています。古い `forceDatabaseType` / `useAutoSwitching` オプションはDB選択に使用しません。
- `sql/mariadbApi.js`、`sql/sqliteApi.js`、`checkMariaDbConnection.js` の実装は保持。`databaseMode.js` のガードも維持。
- `database-type-changed` イベントはLaravelの再取得のみ実行します。
- `checkLaravelConnection.js` はSQLiteへのフォールバックを禁止したままです。

## 適用先
`renderer/src/hooks/useDataBase/` に統合してください。

## 注意
この変更は **useDataBaseからの処理経路のみ** 切断します。他のHookが直接MariaDB/SQLite用IPCを呼ぶこと、Main側IPC、DB選択画面までは停止しません。完全停止には各呼び出し元とMain IPCの別途変更が必要です。
