ボタン共通化 修正内容
====================

1. 共通入口を追加
   renderer/src/components/common/hug_function/index.js

   今後は原則として以下から import できます。

   import {
     PersonalRecordButton,
     ProfessionalSupportCheckPanel,
     EditButton,
     EnterButton,
     LeaveButton,
   } from '@/components/common/hug_function'

2. SimpleBoard 内にあった PersonalRecordButton を移動
   移動先:
   renderer/src/components/common/hug_function/PersonalRecord/PersonalRecordButton

3. SimpleBoard 内にあった ProfessionalSupportCheckPanel 一式を移動
   移動先:
   renderer/src/components/common/hug_function/ProfessionalSupport/ProfessionalSupportCheckPanel

4. SimpleBoard/AttendanceRow は共通入口からのみ読み込むよう変更

5. SimpleBoard 内の以下の重複フォルダは削除
   - AttendanceRow/PersonalRecordButton
   - AttendanceRow/ProfessionalSupportCheckPanel

6. AttendanceAction 側の入室・退室・編集ボタンは既存実装をそのまま共通利用

注意:
このZIPは修正対象ファイル一式です。プロジェクトの renderer/src 以下へ上書きしてください。
