# メール通知あり入退室後の今日の利用者再取得

## 変更内容

メール通知ありの入室・退室では、HUG側メールモーダルの「通知する / 通知しない」を自動クリックした直後には成功扱いしません。

対象セル（enter{r_id} / leave{r_id}）から元の sendEnterMail / sendLeaveMail ボタンが消え、HUG側の画面更新が完了したことを MutationObserver で確認してから success を返します。

その後、既存の clickEnterButton / clickExitButton から runAttendanceUpdate() が実行されます。

runAttendanceUpdate() は GetTodayUsersChildren と同じ構成で、

- fetchAttendanceViaHugTab
- extractColumnData
- setTableData
- setExtractedData
- AppState.attendanceData 更新

を行います。

## 処理順

Rendererモーダルで通知選択
→ HUG本体の入室/退室ボタン click
→ HUGメールモーダル検知
→ 選択済み send_mail を自動 click
→ HUG側Ajax処理
→ 対象セルから元ボタンが消えるまで待機
→ 成功判定
→ runAttendanceUpdate()
→ 今日の利用者データを再取得・Redux/AppState更新

## タイムアウト

HUG側処理完了待ちは最大12秒です。
