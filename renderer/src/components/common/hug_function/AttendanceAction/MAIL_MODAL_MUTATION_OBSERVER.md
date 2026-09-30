# 入退室メール通知モーダル連動（MutationObserver版）

## メール通知ありの処理順

1. Renderer の入室/退室ボタンを押す。
2. `hasMail === true` の場合、HUG側ボタンはまだ押さず `MailNotificationModal` を表示する。
3. Renderer で「通知する」または「通知しない」を選択する。
4. 選択値を `mailFlg`（通知する=1 / 通知しない=0）として保持する。
5. HUG WebView 内で MutationObserver を開始する。
6. MutationObserver 開始後に HUG 本体の入室/退室ボタンを `button.click()` する。
7. HUG 本来の `sendEnterMail(...)` / `sendLeaveMail(...)` が動作し、`#addtend_dialog_mail` が表示される。
8. MutationObserver が DOM追加または style/class/aria-hidden の変更を検知する。
9. Rendererで選択済みの値に対応する `.send_mail_button[data-send_mail="1|0"]` を自動クリックする。
10. HUG本来の後続処理が完了した後、Rendererの出席データを更新する。

## 重要

- HUG側の入室/退室ボタンは必ずクリックする。
- `ajax_attendance.php` への直接POSTでメールあり処理を代替しない。
- HUG側モーダルを「一定時間ごとに探す」ポーリング方式ではなく、ボタンクリック前からMutationObserverで監視する。
- `#addtend_dialog_mail` があらかじめDOMに存在してjQuery UIが表示状態だけ変更する場合にも対応するため、`attributes: true` で `style`, `class`, `aria-hidden` も監視する。
- タイムアウトは10秒。検知できない場合は成功扱いにせずエラーを返す。
