# メール通知確認の一本化

Renderer側の通知確認UIは `MailNotificationModal.jsx` のみ使用します。
`attendance/helpers/mailDialog.js` が独自DOMモーダルを生成する経路は削除しました。

処理順:
1. Rendererの入室/退室ボタンをクリック
2. HUG WebView内の実入室/退室ボタンを `button.click()`
3. HUG本体が `#addtend_dialog_mail` を表示
4. Rendererが検知して React `MailNotificationModal` を表示
5. 「通知する/通知しない」を選択
6. RendererからWebView内の `.send_mail_button[data-send_mail="1|0"]` の実DOMを `click()`
7. HUG本体の既存イベントハンドラが AttendanceSave を実行

HUG側の関数をRendererから直接呼び出しません。
