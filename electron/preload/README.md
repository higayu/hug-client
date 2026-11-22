# 修正内容

`npm run dev` 時に `--dev` / `--debug` が Electron の process.argv にないとPreloadのAPIが公開されない問題を解消。

- `preload/devApi.js`: `window.api.forceDownloadLatestUpdateForDebug` を公開（Main IPCが本番時に登録されないため、パッケージ版では実行不可）。
- `preload/preload.bundle.cjs`: 同じ修正を反映。
- 他のPreloadファイルは維持。

配置先は実プロジェクトの `electron/preload/` 等、現在使っているPreloadフォルダ。Electron Mainで実際に指定している preload パスを必ず確認。`main/appUpdate/index.js` は `!app.isPackaged` のときだけ `app-update:dev-force-download` を登録する版が必要。

Electronを完全終了して `npm run dev` 再起動後、DevToolsで `typeof window.api?.forceDownloadLatestUpdateForDebug` を確認（function）。
