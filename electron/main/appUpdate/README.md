# 開発専用：強制ダウンロードとSHA-256検証

`main/appUpdate/` は前回の分割版をそのまま置き換えます。`main/appUpdate.js` が残っている場合は削除してください（Nodeの解決では同名 .js がフォルダより優先されます）。

`preload/devApi.js` も差し替えて **preload.bundle.cjs を再生成** してください。`preload/index.js` が読み込まれる開発構成でも同じAPIを使えます。古い bundle のままだと DevTools 側に新しいメソッドは出ません。

開発版 (`app.isPackaged === false`) で `npm run dev` を実行し、ログインしてからRendererのDevToolsコンソールで:

```js
window.api.forceDownloadLatestUpdateForDebug().then(console.log).catch(console.error)
```

通常の更新UIが「最新版です」と表示していてもダウンロード処理を実行します。既存のLaravel APIの `/app/version` と `/app/download/latest` を呼び出すため、Laravelの再アップロードは不要です。最新版が切り替わった瞬間の不一致に注意してください。

`main/appUpdate/download.js` は既存のSHA-256検証を維持します。SHA不一致時は Downloads に `.sha256-failed` を保存し、インストーラーとしては登録しません。失敗ファイルは実行しないでください。

注意: 新しい開発用IPCは `app.isPackaged` で登録されません。`preload/devApi.js` に公開したメソッドはパッケージ版で呼び出すとIPCエラーになります。ダウンロード後のインストールはしないでください。

既存コードからの呼び出しが可能なら `window.electronAPI.downloadLatestUpdate()` でも最新判定を経由せずダウンロードできます。上記の専用メソッドは開発用途を明確に区分するための追加です。
