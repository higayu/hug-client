# Renderer側 開発用強制ダウンロードボタン

置換先: `UpdateTab/index.jsx`

開発環境 (`import.meta.env.DEV`) で「最新版を強制ダウンロードして検証」ボタンを表示します。

前提: preload で `window.api.forceDownloadLatestUpdateForDebug()` が公開されていること。
main側では `app.isPackaged === false` でのみ `app-update:dev-force-download` IPCを登録してください。

通常のアップデートチェック・ダウンロード・インストーラー起動は維持しています。
デバッグ用ダウンロード結果ではインストールボタンを有効にしません。

不一致時の調査用ファイル保存はmain側が行います。renderer側で直接ファイル保存しません。
