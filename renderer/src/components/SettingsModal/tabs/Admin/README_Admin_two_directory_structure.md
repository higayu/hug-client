# Admin 二分割構成

`renderer/src/components/SettingsModal/tabs/Admin` を、管理対象ごとに下記の2ディレクトリへ分けました。

```txt
Admin
├─ index.jsx
├─ constants
│  └─ adminSections.js
├─ components
│  ├─ AdminHeader.jsx
│  └─ AdminSectionCards.jsx
├─ StaffManagement
│  ├─ index.jsx
│  ├─ Base
│  │  └─ index.jsx
│  ├─ Login
│  │  └─ index.jsx
│  ├─ components
│  │  ├─ StaffSectionTabs.jsx
│  │  └─ StaffSelector.jsx
│  ├─ constants
│  │  └─ staffSections.js
│  └─ hooks
│     └─ useStaffSelection.js
└─ WebAutomation
   ├─ index.jsx
   └─ AutomationRulesTab
      └─ index.jsx
```

## 役割

- `Admin/index.jsx`
  - 管理者判定
  - 「職員管理 / Web自動化」の大項目切替
- `StaffManagement`
  - 職員選択
  - 基本情報編集
  - ログイン情報編集
- `WebAutomation`
  - `web_automation_rules`
  - `web_automation_flows`
  - `web_automation_flow_steps`

## 適用方法

既存の下記ディレクトリを置き換えてください。

```txt
renderer/src/components/SettingsModal/tabs/Admin
```

古い下記ファイル・ディレクトリは、今回の構成では不要です。

```txt
Admin/AutomationRulesTab
Admin/Base
Admin/Login
```

新構成ではそれぞれ以下へ移動しています。

```txt
Admin/AutomationRulesTab -> Admin/WebAutomation/AutomationRulesTab
Admin/Base -> Admin/StaffManagement/Base
Admin/Login -> Admin/StaffManagement/Login
```
