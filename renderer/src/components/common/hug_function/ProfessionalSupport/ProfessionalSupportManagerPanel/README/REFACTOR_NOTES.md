# ProfessionalSupportManagerPanel リファクタリング

## 名称変更

- ProfessionalSupportManagerPanel -> ProfessionalSupportManagerPanel
- useProfessionalSupportCheck2 -> useProfessionalSupportStatusCheck

`ProfessionalSupportManagerPanel` は確認だけでなく、以下を担当するため ManagerPanel とした。

- 専門的支援の下書き/保存
- 保存件数・本日分の確認
- 専門的支援一覧を開く
- 専門＋の登録確認
- 専門＋の未登録時登録
- 専門＋登録後の再確認

## 確認処理の分割

### checks/professionalSupportRecordCheck.js

- interviewDate の YYYY-MM-DD 正規化
- 本日分の専門的支援記録の有無判定
- 本日の表示ラベル生成

### useProfessionalSupportStatusCheck/

- 保存済み件数取得
- 本日分件数集計
- recordStatusSlice 更新
- useSpeDate 更新

### checks/professionalSupportPlusCheck.js

- 専門＋登録済み確認
- 専門＋登録
- 確認 -> 未登録時のみ登録 -> 再確認

### useProfessionalSupportPlusCheck/

- 確認中/登録中 state
- 登録済み state / registrationId
- actionMessage との連携
- 上記 checks のUI向けラッピング

## 維持したもの

- DB WebAutomation Flow / Rule
- professionalSupportWebAutomation.js のDB駆動方式
- postProfessionalSupportDraft.js
- ProfessionalSupportPostModal.jsx
- props型の共通コンポーネント構造
