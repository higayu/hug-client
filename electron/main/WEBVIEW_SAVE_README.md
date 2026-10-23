# WebView HTMLComplete 保存用Main・Preload経路

このZIPは添付のElectronアプリのMain・Preloadを修正しています。Rendererは未変更です。

## 変更ファイル
- `main/ipcHandlers.js`：IPC登録追加
- `main/webviewPageSaveIpc.js`：新規保存処理。送信元ウィンドウが所有するWebViewか確認
- `preload/index.js`：新しいブリッジ公開
- `preload/webviewPageSaveBridge.js`：新規ブリッジ
- `preload/preload.bundle.cjs`：実際に読み込まれる生成済みpreloadにも追加

## Rendererからの呼び出し
```js
const result = await window.electronWebviewPageSave.saveCompletePage(
  selectedWebview.getWebContentsId()
);
```
`selectedWebview` はRendererが管理している選択中のwebview要素を渡してください。全WebViewからの自動検索は行いません。

保存時にダイアログが開き、`HTMLComplete` 形式でHTMLと関連リソースを保存します。サイトによって動的通信や外部リソースの全ては取得できません。

## 注意
`preload/preload.bundle.cjs` はビルド生成物です。preloadを再ビルドする際は`preload/index.js`と`preload/webviewPageSaveBridge.js`から生成してください。
Electron実機動作は未検証です。`node --check` による構文確認のみ実施しています。
