# ExpandableLabelPanel

React / Tailwind CSS。既存の ExpandableManagerPanel とは独立したコンポーネントです。

```jsx
import ExpandableLabelPanel from './ExpandableLabelPanel'

<ExpandableLabelPanel label="メニュー" expandDirection="down" className="w-48">
  <div className="p-2 text-white">任意のコンテンツ</div>
</ExpandableLabelPanel>
```

Props: label, className, buttonClassName, panelClassName, disabled, expandDirection (up/down, default up), children.


## 自動閉鎖

展開領域の有効なボタンをクリックすると閉じます。`closeOnButtonClick={false}` で無効化できます。個別のボタンまたは親要素に `data-keep-panel-open` を指定すると閉じません。
