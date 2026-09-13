# 専門的支援: ページ編集方式 → rendererモーダル + POST方式

## 変更内容

`ProfessionalSupportCheckPanel2` の閉じた状態の「専門的支援」ボタンを押したとき、
HUG の `record_proceedings.php?mode=edit` タブを開いてページを書き換える方式を使用しません。

新しい処理:

1. renderer 上に入力モーダルを表示
2. 実施日、開始/終了時刻、記録項目名、記録内容を確認/入力
3. 既存 HUG webview のログインセッションで登録フォームを GET
4. GETしたフォームから最新の `csrf_token_from_client` を取得
5. `record_proceedings.php` に `multipart/form-data` で下書きPOST
6. 下書き成功後のみ、従来の「専門＋」(ID=55) を自動登録
7. 専門＋登録確認・専門的支援ステータス確認を実行

## 追加ファイル

- `ProfessionalSupportPostModal.jsx`
- `postProfessionalSupportDraft.js`

## 主なPOST値

- `mode=regist`
- `draft_flg=draft`
- `id=insert`
- `adding_children_id=55`
- `c_id_list[0][id]=児童ID`
- `c_id_list[0][f_id]=施設ID`
- `c_id_list[0][s_id]=1`
- `recorder=ログインスタッフID`
- `interview_date=選択中の日付`
- `interview_staff[]=ログインスタッフID`
- `customize[title][]=記録`
- `customize[contents][]=rendererモーダルで入力した内容`

CSRFトークンを固定値にはせず、送信直前にHUGの登録フォームから取得します。

## 注意

この修正版では `ProfessionalSupportCheckPanel2` の「専門的支援」ボタンは
`addProfessionalSupportNewTab()` を呼ばなくなります。
専門的支援一覧ボタンは従来の `useTabs` をそのまま使用します。
