# 専門的支援ボタン：下書き保存 → 専門＋ 連動

## 閉じた状態

`ProfessionalSupportCheckPanel2` を参考に、専門的支援操作を1つのコンパクトUIへ統合しました。

- 左: `保存 N個 / 本日 済・未` ステータス
  - クリックで `runCheck()` を実行し再確認
- 中央: `専門的支援`（連動型）
- 右: 展開ボタン

従来 ChildAttendancePanel 下部にあった `ProfessionalSupportCheckPanel2` は重複するため削除しています。

## 連動型の処理

1. `addProfessionalSupportNewTab()` を実行
2. renderer が下書き保存完了結果を待つ
3. `{ ok: true, saved: true }` を受け取った場合のみ専門＋を自動実行
4. 専門＋(ID=55) の登録成功後に `runCheck()` でステータス再取得
5. `連動OK` を表示

`saveResult.saved !== true` の場合は、安全のため専門＋を実行しません。

## 展開状態

- `専門的支援`
  - 専門的支援だけを単体実行
  - 専門＋は自動実行しない
- `専門＋`
  - 専門的支援実施加算(ID=55)だけを単体実行

## 専門＋処理の共通化

専門＋のPOST処理は以下へ切り出しました。

`AttendanceActionSection/TestAddProfessional/function/addProfessionalSupport.js`

連動型・単体型の両方がこの関数を使用します。

## useTabs 側の必要条件

連動型を成立させるには `addProfessionalSupportNewTab()` が「タブを開いた時点」ではなく、下書き保存完了時に結果を返す必要があります。

成功例:

```js
{
  ok: true,
  saved: true,
  message: '下書きを保存しました'
}
```

失敗例:

```js
{
  ok: false,
  saved: false,
  error: '下書き保存に失敗しました'
}
```

`ProfessionalSupportButton` は `saved === true` の場合に限り、専門＋を続けて登録します。

## 2026-09-13 追加: 専門＋ 登録チェック

展開メニューに「登録チェック」ボタンを追加。

確認URL:
`https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail&f_id=${指定施設id}&date=${選択中の日付}`

対象児童の `tbody[id^="js_adding_list"]` を `name="c_id"` で特定し、
`adding[][55][id]` の hidden input、または「専門的支援実施加算」表示から登録済み判定する。

- 登録済み: ボタンが緑色になり「登録済み」
- 未登録: ボタンがオレンジ色になり「未登録」
- 確認前: 「登録チェック」


## 施設ID対応
登録チェック・専門＋登録とも、固定 `f_id=3` は使用せず、ChildAttendancePanelで選択中の `facilityId` を渡して使用します。

## 2026-09-13 追加修正: 専門＋ステータスを主表示

- 親パネルの主ステータスを「専門＋」登録状態へ変更。
- 表示例: `専門＋ 登録済み ID:46297` / `専門＋ 未登録` / `専門＋ 未確認`。
- 保存件数は補助表示として右側に `保存 2個` のように表示。
- 親ステータス部分をクリックすると専門＋登録確認を実行。
- 展開メニューの「登録チェック」も同じ確認処理を実行。
- 確認URLは固定 `f_id=3` ではなく、指定施設IDを使用。
  - `attendance.php?mode=detail&f_id=${facilityId}&date=${dateStr}`
- 専門＋単体登録・連動登録の成功後にも登録確認を実行し、登録IDまで再取得する。
