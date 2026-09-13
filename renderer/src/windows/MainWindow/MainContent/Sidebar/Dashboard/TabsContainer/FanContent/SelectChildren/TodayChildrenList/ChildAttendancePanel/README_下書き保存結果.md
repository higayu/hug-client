# 専門的支援パネル移行整理

専門的支援関連の UI と処理は以下へ一本化済みです。

`renderer/src/components/common/hug_function/ProfessionalSupportCheckPanel2/index.jsx`

ChildAttendancePanel 側は `AttendanceActionSection/index.jsx` から
`ProfessionalSupportCheckPanel2` を1回だけ表示し、以下の状態だけ props で渡します。

- spaceId
- facilityId
- isAbsent
- hasEntered
- hasExited
- isUIEnabled
- isStop
- loadingAction

旧実装として ChildAttendancePanel 配下に残っていた以下は削除しました。

- `AttendanceActionSection/ProfessionalSupportButton.jsx`
- `AttendanceActionSection/ProfessionalSupportButton/`
- `AttendanceActionSection/TestAddProfessional/`

これにより、専門的支援・専門＋・登録確認・ステータスの実装場所が二重化しません。
