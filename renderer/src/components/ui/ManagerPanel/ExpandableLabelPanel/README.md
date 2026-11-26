# ExpandableLabelPanel

React / Tailwind CSS。既存の ExpandableManagerPanel とは独立したコンポーネントです。

```jsx
import ExpandableLabelPanel from './ExpandableLabelPanel'

<ExpandableLabelPanel label="メニュー" expandDirection="down" className="w-48">
  <div className="p-2 text-white">任意のコンテンツ</div>
</ExpandableLabelPanel>
```

Props: label, className, buttonClassName, panelClassName, disabled, expandDirection (up/down, default up), children.
