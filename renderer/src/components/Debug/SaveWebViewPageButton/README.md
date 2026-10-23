# SaveWebViewPageButton

既存のMain / Preload側に `webview:save-complete-page` と `window.electronWebviewPageSave.saveCompletePage(webContentsId)` が登録されていることを前提としたReactコンポーネントです。

```jsx
import SaveWebViewPageButton from './components/SaveWebViewPageButton'

export default function DeveloperTools() {
  return <SaveWebViewPageButton />
}
```

`SaveWebViewPageButton.jsx` を適切な `src/components/` などに配置してください。

- 画面上で表示されている最初の `<webview>` を対象とし、非表示の常駐WebViewを除外します。
- Mainの保存ダイアログから `.html` を選ぶと、HTMLComplete形式でHTMLと関連ファイルを保存します。
- ダイアログは人間の操作を待つため、参考コードの5秒タイムアウトは使用していません。
- 保存成功時に `onSaved(result)`、失敗時に `onError(error)` を呼び出せます。
- HTMLCompleteはネットワークログやJavaScript実行履歴を保証しません。調査で必要なら別途記録してください。
