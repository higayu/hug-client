# WebView HTMLComplete 保存機能

Main: `main/ipcHandlers.js` → `main/webviewPageSaveIpc.js`
Preload: `preload/index.js` → `preload/webviewPageSaveBridge.js`
実際に読み込む `preload/preload.bundle.cjs` にも同じBridgeを反映済みです。将来preloadを再ビルドした際も `preload/index.js` から取り込まれます。

Renderer使用例:

```js
const webview = /* TaskWindowが選択中として保持するWebView */;
const result = await window.electronWebviewPageSave.saveCompletePage(webview.getWebContentsId());
console.log(result);
```

選択中WebViewの特定はRenderer側で行います。Main側はWebViewの所有元を検証します。キャンセル時は `{ canceled: true }` を返します。実際のElectronでの保存実行は未検証です。
