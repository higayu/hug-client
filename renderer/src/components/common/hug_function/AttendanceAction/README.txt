AttendanceAction 退室処理 修正版

対象:
renderer/src/components/common/hug_function/AttendanceAction/

差し替えファイル:
- performLeaveAction.js
- exit.js

修正内容:
1. sendLeaveMail(r_id,is_mail,c_id,f_id,4,linkage) を解析
2. ajax_attendance.php?action=getEnterTimeAndProvidingType を実行
3. ajax_extension.php に mode=detail_setting をPOST
4. ajax_attendance.php に data_list[...] 25項目をPHP配列形式でPOST
5. 値が空の項目もキーを省略せず送信
6. HTTP status / response body / POST entries をconsoleへ出力

注意:
このZIPは既存AttendanceAction全体を置換するものではありません。
既存の入室・欠席処理を残したまま、上記2ファイルを差し替えてください。
