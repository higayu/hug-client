# Sonner移行結果

Sonner 2.0.8を追加し、旧Context Providerを除去。42ファイルのimportを共通notifications.jsxへ変更。window.show*Toastも同じAPIに接続。呼び出しは53ファイル207箇所（toast-call-sites.md参照）。

AppのUnlockedAppにAppToasterを1つ置く。共通main.jsxを利用するmain / professionalSupport / information / phpMyAdminなど各renderer windowに1つずつ配置される。同じdocumentのPersonalRecordModal独立rootでは追加Toasterは不要。外部URLやdata URLを表示する補助ウィンドウは対象外。ウィンドウ間通知は自動共有しない。

右上20px・幅360px・既存の色・タイトルと本文と詳細の順序・詳細配列の真値抽出と改行・詳細スクロールを維持。既定時間は通常/success/info 3000ms、error 4000ms、warning 3500ms、結果5000ms。個別durationも維持。新object API、dismissToast、onClose（手動/自動終了の300ms後、引数なし、一度のみ）を追加。既存onCloseはProviderの削除処理にのみ使用されていた。useToastは安定した関数セットを返す互換関数でContextには依存しない。

変更点: 最大4件を展開表示（従来は全件縦並び）。Sonner標準のアニメーション・ホバー/ページ非表示時のタイマー停止を使用。z-indexは2147483646で既存モーダルより上、アプリロックより下。印刷非表示。ロック対象Appの内側に置き、hidden/inertを維持。

旧Toast.jsx・ToastContext.jsxと空ディレクトリを削除。残存参照なし。共通COLORS・画面固有のインライン表示は維持。Redux・main/preload・IPCには変更なし。

検証:

- npm install sonner: 成功、peer衝突なし。主要依存の更新なし。auditは57件（moderate 21 / high 34 / critical 2）を報告。監査修正は対象外。
- npm ls sonner react react-dom: Sonner 2.0.8、React/ReactDOM 18.3.1、依存関係正常。
- npm run build:renderer: 成功、500kB超chunk警告あり。
- node scripts/test-notifications.cjs: PASS。4種、本文と配列details、改行、モーダル前面での閉じる操作、自動/手動コールバック、個別時間と既定3000ms、連続発火、一括削除、印刷非表示。pageerrorなし。
- git diff --check: 実施。

Electron実機の起動、全ウィンドウ、保存/API/IPC・画面遷移・ロック中を含む全画面の回帰は未検証。

新規: notifications.jsx、AppToaster.jsx、AppToaster.css、scripts/test-notifications.cjs、本記録、toast-call-sites.md。

編集・削除ファイル一覧:

- hug-client-basic/package-lock.json
- hug-client-basic/package.json
- hug-client-basic/renderer/src/App.jsx
- hug-client-basic/renderer/src/components/FacilitySelector/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/Admin/StaffManagement/Login/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/components/WebAutomationInstruction.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/ConfigTab/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/PromptTab/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/StaffTab/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/UITab/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/UrlTab/index.jsx
- hug-client-basic/renderer/src/components/SettingsModal/tabs/WindowTab/index.jsx
- hug-client-basic/renderer/src/components/common/AiContents/GeminiContent/index.jsx
- hug-client-basic/renderer/src/components/common/AiContents/LaravelApiContent/PromptBox/parts/PersonalRecordPrompt/index.jsx
- hug-client-basic/renderer/src/components/common/AiContents/LaravelApiContent/index.jsx
- hug-client-basic/renderer/src/components/common/AiContents/OllamaContent/index.jsx
- hug-client-basic/renderer/src/components/common/AiContents/OpenRouterContent/index.jsx
- hug-client-basic/renderer/src/components/common/AiContents/common/PersonalRecordPrompt/index.jsx
- hug-client-basic/renderer/src/components/common/AiContents/parts/PersonalRecordPrompt/index.jsx
- hug-client-basic/renderer/src/components/common/Synchronization/AllSyncButton/index.jsx
- hug-client-basic/renderer/src/components/common/Synchronization/ChildrenUpdateButton/index.jsx
- hug-client-basic/renderer/src/components/common/Synchronization/DataBaseButton/index.jsx
- hug-client-basic/renderer/src/components/common/Synchronization/StaffChildrenUpdateButton/index.jsx
- hug-client-basic/renderer/src/components/common/Synchronization/StaffUpdateButton/index.jsx
- hug-client-basic/renderer/src/components/common/hug_function/GetTodayUsersChildren/useAttendanceFetch/index.js
- hug-client-basic/renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx
- hug-client-basic/renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx
- hug-client-basic/renderer/src/components/ui/CopyButton/index.jsx
- hug-client-basic/renderer/src/components/ui/DateSelect/index.jsx
- hug-client-basic/renderer/src/components/ui/MemoInputBox/index.jsx
- hug-client-basic/renderer/src/components/ui/WeekdaySelect/index.jsx
- hug-client-basic/renderer/src/hooks/useHugActions.js
- hug-client-basic/renderer/src/provider/ToastProvider/Toast.jsx
- hug-client-basic/renderer/src/provider/ToastProvider/ToastContext.jsx
- hug-client-basic/renderer/src/windows/MainWindow/Header/Tabs.jsx
- hug-client-basic/renderer/src/windows/MainWindow/Header/ToolsListNavi/SleepButton/index.jsx
- hug-client-basic/renderer/src/windows/MainWindow/Header/ToolsListNavi/index.jsx
- hug-client-basic/renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx
- hug-client-basic/renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx
- hug-client-basic/renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx
- hug-client-basic/renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx
- hug-client-basic/renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/UpdateManager/UpdateManagerTable/index.jsx
- hug-client-basic/renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/PersonalRecordSyncRunner.jsx
- hug-client-basic/renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/index.jsx
