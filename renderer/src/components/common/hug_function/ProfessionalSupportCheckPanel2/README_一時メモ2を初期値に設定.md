# 専門的支援モーダル - 一時メモ2を初期値に設定

変更内容:

1. `ProfessionalSupportCheckPanel2` で `useNote()` を使用。
2. 専門的支援ボタンを押した時、モーダルを開く前に `loadTemp(childId, proxy)` を実行。
3. 読み込んだ `memo2` を `ProfessionalSupportPostModal` の `initialContents` に渡す。
4. モーダルの「記録内容」テキストエリアは `initialContents` を初期値にする。

動作:

```text
専門的支援ボタン
  ↓
選択中児童の一時メモを取得
  ↓
memo2 を取得
  ↓
モーダル表示
  ↓
記録内容 = 一時メモ2
```

一時メモが存在しない場合は空文字で開きます。
