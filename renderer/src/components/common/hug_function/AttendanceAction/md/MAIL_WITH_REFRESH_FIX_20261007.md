# メールあり入退室後の再取得修正（2026-10-07）

## 症状
入室・退室のメール通知あり処理で、HUG側のメール通知モーダル選択まで成功し、
実行ログも success になるが、その後の「今日の利用者」再取得結果がRendererへ反映されないことがあった。

## 原因
- 通知選択後の主経路は `mailDialogAction === "select"` 分岐を通らず、通常の `performEnterAction` / `performLeaveAction` 経路を通っていた。
- 通常経路の再取得は `opts.dispatch` が渡された場合だけ実行されていたため、呼び出し元によって再取得自体がスキップされた。
- メールありでも再取得が1回だけの経路があり、HUG側Ajax/DB更新の反映より先に古いHTMLを取得する可能性があった。

## 修正
- `opts.dispatch` が無い場合は `store.dispatch` を使用し、再取得を必ず実行する。
- `attendance_enter_with_mail` / `attendance_leave_with_mail` では対象児童の更新状態を確認しながら再取得する。
- 500ms間隔、最大10回まで確認する。
- 入室では column5、退室では column6 が時刻表示へ変わる、または該当ボタンが消えるまで待つ。

## 修正ファイル
- attendance/actions/enter.js
- attendance/actions/exit.js

DB変更は不要。
