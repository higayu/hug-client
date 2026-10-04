# ProfessionalSupportManagerPanel 構成

`ProfessionalSupportManagerPanel` は、専門的支援の保存・保存状況確認・一覧表示・専門＋確認/登録をまとめた操作パネルです。

## ファイル分割

- `index.jsx`
  - UIと状態の組み立て
- `checks/professionalSupportRecordCheck.js`
  - 本日の専門的支援記録判定、表示ラベル生成
- `checks/professionalSupportPlusCheck.js`
  - 専門＋確認/登録の純粋な実行処理
- `useProfessionalSupportPlusCheck/`
  - 専門＋の確認状態・登録状態・確認→未登録時のみ登録→再確認のUI連携
- `useProfessionalSupportStatusCheck/`
  - 保存済み件数と本日分の確認
- `professionalSupportWebAutomation.js`
  - DB駆動WebAutomation実行
- `postProfessionalSupportDraft.js`
  - 専門的支援保存処理
- `ProfessionalSupportPostModal.jsx`
  - 保存入力モーダル
- `professionalList.js`
  - 専門的支援一覧を開くhelper

DB Flow / Ruleの内容は変更していません。
