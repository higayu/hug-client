# web_automation_rules Renderer 受信

## AppStateContext から利用

```js
const {
  webAutomationRules,
  webAutomationRulesByKey,
  webAutomationRulesMeta,
  webAutomationRulesLoading,
  webAutomationRulesError,

  loadWebAutomationRules,
  loadWebAutomationRule,
  getWebAutomationRule,
} = useAppState()
```

### 一覧取得

```js
await loadWebAutomationRules()
```

カテゴリ指定:

```js
await loadWebAutomationRules({
  category: 'attendance',
})
```

### rule_key 指定

```js
const result = await loadWebAutomationRule(
  'attendance_enter'
)
```

Redux キャッシュのみ参照:

```js
const rule = getWebAutomationRule(
  'attendance_enter'
)
```

強制再取得:

```js
await loadWebAutomationRule(
  'attendance_enter',
  { force: true }
)
```

## Redux selector を直接使う場合

```js
import { useSelector } from 'react-redux'
import {
  selectWebAutomationRuleByKey,
} from '@/store/slices/webAutomationRuleSlice'

const enterRule = useSelector(
  selectWebAutomationRuleByKey(
    'attendance_enter'
  )
)
```
