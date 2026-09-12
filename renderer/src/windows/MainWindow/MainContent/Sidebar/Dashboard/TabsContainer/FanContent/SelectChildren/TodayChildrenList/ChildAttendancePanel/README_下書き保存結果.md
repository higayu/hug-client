# 専門的支援：下書き保存結果対応

## 追加・変更内容

- `ProfessionalSupportButton/function/saveProfessionalSupportDraft.js`
  - HUGのWebView内で「下書きとして保存する」をクリック
  - POST後の `did-stop-loading` を待つ
  - 遷移後DOMを確認して `{ ok: true/false }` を返す

- `handleProfessionalSupportClick.js`
  - `addProfessionalSupportNewTab()` の戻り値を `await` して呼び出し元へ返す

- `ProfessionalSupportButton/index.jsx`
  - 処理結果を受け取れる `async` 実装に変更
  - `saved: true/false` が返された場合は画面にも結果表示

## useTabs側での組み込み例

このZIPには `@/hooks/useTabs` 本体が含まれていないため、専門的支援用WebViewを取得できる箇所で次のように呼び出してください。

```js
import { saveProfessionalSupportDraft } from '.../ProfessionalSupportButton/function/saveProfessionalSupportDraft'

const saveResult = await saveProfessionalSupportDraft(professionalSupportWebview)

return {
  ok: saveResult.ok,
  saved: saveResult.ok,
  ...saveResult,
}
```

これにより `ProfessionalSupportButton` 側で下記のように結果を受け取れます。

```js
{
  ok: true,
  saved: true,
  message: '下書きを保存しました'
}
```

または

```js
{
  ok: false,
  saved: false,
  error: '下書き保存の完了を確認できませんでした'
}
```

## 注意

添付されたソースには `useTabs` の実装ファイルが含まれていないため、そこへの直接組み込みだけは未実施です。
