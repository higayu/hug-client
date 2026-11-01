# Sonner移行結果

## 配置と調査

Sonner 2.0.8を追加。独自Context ProviderをAppから除去し、UnlockedApp内のSuspenseと同階層にAppToasterを1つ設置。main / professionalSupport / information（informationWindow）/ phpMyAdminは共通main.jsxから起動するため、各Electron rendererに1つずつ配置される。外部URL・data URLの補助ウィンドウはReactアプリを使用せず対象外。別ウィンドウへ通知を自動転送しない。

PersonalRecordModalのcreateRootは同じdocument内の独立マウントであり、既存の持続的なインライン状態表示を使用する。Sonnerはdocument内の共通ストアを利用でき、Toasterの追加は通知の重複になるため不要。

他のToastライブラリ・通知専用Redux state・main/preloadからの旧Toast直接呼び出しは見つからなかった。window.show*Toastを使用する既存モジュールはAppToasterのeffectで互換接続。

## 対応仕様

右上20px、幅360px（狭い画面では画面幅-40px）、色定数、標準タイトル、title→message→detailsの順序、配列の真値抽出・改行、詳細の192pxスクロール、個別durationを維持。通常通知3000ms、error便利関数4000ms、warning3500ms、結果5000ms。閉じるボタンの日本語ラベルを維持。新しいobject APIとdismissToastも追加。

旧onCloseはProvider内の削除処理だけに使用されていた。新APIは手動・自動終了で引数なしのonCloseを300ms後に一度呼ぶ。アニメーション自体はSonner標準。プログラム削除時の処理はSonnerのonDismissに従う。

同時通知は最大4件を展開表示する仕様へ変更（旧実装は全件縦並び）。Sonner標準のホバー・ページ非表示中のタイマー停止を採用。z-indexは2147483646で既存モーダル（10000010等）より上、アプリロック（2147483647）より下。印刷時は非表示。Toasterをロック対象のApp内部に置き、ロック時の非表示・inertを維持する。

44ファイルのhook importを変更。useToastは同じ安定した関数セットを返す互換関数として維持し、Context依存はない。window API利用箇所を合わせて50ファイル196呼び出しをSonnerへ接続。詳細はtoast-call-sites.mdを参照。

## 検証

- npm install sonner: 成功、peer衝突なし。主要依存のバージョン変更なし。npm auditは49件（low 2 / moderate 8 / high 36 / critical 3）を報告。監査修正は今回の範囲外。
- npm ls sonner react react-dom: Sonner 2.0.8 / React・ReactDOM 18.3.1、peer衝突なし。
- npm run build:renderer: 成功。500kB超chunkの警告あり。
- node scripts/test-notifications.cjs: 成功。実ブラウザで4種・本文と配列details・改行CSS・モーダルより前面のクリック・手動と自動onClose・個別150msと既定3000ms・連続5通知・一括削除・印刷非表示・安定した互換APIを検証。pageerrorなし。
- git diff --check: 実施。

Electron実機の起動、実際の保存/API/IPC操作、画面遷移、全別ウィンドウ、ロック中の操作、既存画面全体の回帰は未検証。旧Toast.jsxとToastContext.jsxはアプリからの参照がないことを確認し、削除済み。他の画面固有のインライン状態表示は維持。

## 変更ファイル

新規:

- renderer/src/utils/notifications.jsx
- renderer/src/components/common/AppToaster.jsx
- renderer/src/components/common/AppToaster.css
- scripts/test-notifications.cjs
- docs/toast-call-sites.md
- docs/toast-migration.md

編集:

- package-lock.json
- package.json
- renderer/src/App.jsx
- renderer/src/AppStateContext/useAppInitializer/useAppInitialization.js
- renderer/src/components/FacilitySelector/index.jsx
- renderer/src/components/SettingsModal/tabs/Admin/StaffManagement/Login/index.jsx
- renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx
- renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/components/WebAutomationInstruction.jsx
- renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx
- renderer/src/components/SettingsModal/tabs/ConfigTab/index.jsx
- renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx
- renderer/src/components/SettingsModal/tabs/PromptTab/index.jsx
- renderer/src/components/SettingsModal/tabs/StaffTab/index.jsx
- renderer/src/components/SettingsModal/tabs/UITab/index.jsx
- renderer/src/components/SettingsModal/tabs/UrlTab/index.jsx
- renderer/src/components/SettingsModal/tabs/WindowTab/index.jsx
- renderer/src/components/common/AiContents/GeminiContent/index.jsx
- renderer/src/components/common/AiContents/LaravelApiContent/PromptBox/parts/PersonalRecordPrompt/index.jsx
- renderer/src/components/common/AiContents/LaravelApiContent/index.jsx
- renderer/src/components/common/AiContents/OllamaContent/index.jsx
- renderer/src/components/common/AiContents/OpenRouterContent/index.jsx
- renderer/src/components/common/AiContents/common/PersonalRecordPrompt/index.jsx
- renderer/src/components/common/AiContents/parts/PersonalRecordPrompt/index.jsx
- renderer/src/components/common/Synchronization/AllSyncButton/index.jsx
- renderer/src/components/common/Synchronization/ChildrenUpdateButton/index.jsx
- renderer/src/components/common/Synchronization/DataBaseButton/index.jsx
- renderer/src/components/common/Synchronization/StaffChildrenUpdateButton/index.jsx
- renderer/src/components/common/Synchronization/StaffUpdateButton/index.jsx
- renderer/src/components/common/hug_function/GetTodayUsersChildren/useAttendanceFetch/index.js
- renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx
- renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx
- renderer/src/components/ui/CopyButton/index.jsx
- renderer/src/components/ui/DateSelect/index.jsx
- renderer/src/components/ui/InstructionDocument/index.jsx
- renderer/src/components/ui/MemoInputBox/index.jsx
- renderer/src/components/ui/WeekdaySelect/index.jsx
- renderer/src/hooks/useHugActions.js
- renderer/src/windows/MainWindow/Header/Tabs.jsx
- renderer/src/windows/MainWindow/Header/ToolsListNavi/SleepButton/index.jsx
- renderer/src/windows/MainWindow/Header/ToolsListNavi/index.jsx
- renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx
- renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx
- renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx
- renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx
- renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/UpdateManager/UpdateManagerTable/index.jsx
- renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/PersonalRecordSyncRunner.jsx
- renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/index.jsx

削除:

- renderer/src/provider/ToastProvider/Toast.jsx
- renderer/src/provider/ToastProvider/ToastContext.jsx

空になったToastProviderディレクトリも削除。
