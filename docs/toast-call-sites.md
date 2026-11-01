# Toast呼び出し元調査

50ファイル、196呼び出し。呼び出し内容は移行前後で維持。表にはタイトル・本文・詳細・種別・個別時間を含む実引数を記録。変数の内容は実行時に決定される。

| API | 種別 | 既定時間 | タイトル・詳細 | 閉じる処理 |
| --- | --- | --- | --- | --- |
| showToast | 引数 / info | 3000ms | options.title/details、object形式対応 | Sonnerで削除 |
| showSuccessToast | success | 3000ms | 完了 / 本文 | 同上 |
| showErrorToast | error | 4000ms | エラー / 本文 | 同上 |
| showWarningToast | warning | 3500ms | 確認 / 本文 | 同上 |
| showInfoToast | info | 3000ms | お知らせ / 本文 | 同上 |
| showResultToast | success引数でsuccess/error | 5000ms | title（既定:処理結果）/ message / details | 同上 |

既存onCloseの利用はProvider内部のstate削除のみ。新APIのonCloseは引数なしで手動終了・自動終了の300ms後に一度呼ぶ。

併発時: 従来は全件を縦並び、新実装は最大4件を展開表示し、残りをSonnerが管理。ホバー・ページ非表示中はSonnerの標準仕様で時間計測が一時停止する。

| 呼び出し元 | API | 実引数 |
| --- | --- | --- |
| renderer/src/components/common/AiContents/common/PersonalRecordPrompt/index.jsx:136 | showSuccessToast | showSuccessToast("一時メモをAI入力欄へ移しました") |
| renderer/src/components/common/AiContents/common/PersonalRecordPrompt/index.jsx:197 | showInfoToast | showInfoToast( `${aiName} に送信中…` ) |
| renderer/src/components/common/AiContents/common/PersonalRecordPrompt/index.jsx:222 | showSuccessToast | showSuccessToast( `${aiName} に送信しました` ) |
| renderer/src/components/common/AiContents/common/PersonalRecordPrompt/index.jsx:240 | showErrorToast | showErrorToast( `${aiName} への送信に失敗しました` ) |
| renderer/src/components/common/AiContents/GeminiContent/index.jsx:20 | showErrorToast | showErrorToast("GEMINI_API_KEY が設定されていません") |
| renderer/src/components/common/AiContents/GeminiContent/index.jsx:24 | showInfoToast | showInfoToast("Gemini API に送信中…") |
| renderer/src/components/common/AiContents/GeminiContent/index.jsx:41 | showSuccessToast | showSuccessToast("Gemini API の応答を取得しました") |
| renderer/src/components/common/AiContents/GeminiContent/index.jsx:45 | showErrorToast | showErrorToast("Gemini API の送信に失敗しました") |
| renderer/src/components/common/AiContents/LaravelApiContent/index.jsx:16 | showInfoToast | showInfoToast("Laravel API に送信中…") |
| renderer/src/components/common/AiContents/LaravelApiContent/index.jsx:37 | showSuccessToast | showSuccessToast("Laravel API の応答を取得しました") |
| renderer/src/components/common/AiContents/LaravelApiContent/index.jsx:41 | showErrorToast | showErrorToast("Laravel API の送信に失敗しました") |
| renderer/src/components/common/AiContents/LaravelApiContent/PromptBox/parts/PersonalRecordPrompt/index.jsx:182 | showInfoToast | showInfoToast( `${aiName} に送信中…` ) |
| renderer/src/components/common/AiContents/LaravelApiContent/PromptBox/parts/PersonalRecordPrompt/index.jsx:209 | showSuccessToast | showSuccessToast( `${aiName} に送信しました` ) |
| renderer/src/components/common/AiContents/LaravelApiContent/PromptBox/parts/PersonalRecordPrompt/index.jsx:227 | showErrorToast | showErrorToast( `${aiName} への送信に失敗しました` ) |
| renderer/src/components/common/AiContents/OllamaContent/index.jsx:19 | showInfoToast | showInfoToast("Ollama に送信中…") |
| renderer/src/components/common/AiContents/OllamaContent/index.jsx:36 | showSuccessToast | showSuccessToast("Ollama の応答を取得しました") |
| renderer/src/components/common/AiContents/OllamaContent/index.jsx:40 | showErrorToast | showErrorToast("Ollama の送信に失敗しました: " + error.message) |
| renderer/src/components/common/AiContents/OpenRouterContent/index.jsx:20 | showErrorToast | showErrorToast("OPEN_ROUTER_API_KEY が設定されていません") |
| renderer/src/components/common/AiContents/OpenRouterContent/index.jsx:24 | showInfoToast | showInfoToast("OpenRouter API に送信中…") |
| renderer/src/components/common/AiContents/OpenRouterContent/index.jsx:41 | showSuccessToast | showSuccessToast("OpenRouter API の応答を取得しました") |
| renderer/src/components/common/AiContents/OpenRouterContent/index.jsx:45 | showErrorToast | showErrorToast("OpenRouter の送信に失敗しました") |
| renderer/src/components/common/AiContents/parts/PersonalRecordPrompt/index.jsx:180 | showInfoToast | showInfoToast( `${aiName} に送信中…` ) |
| renderer/src/components/common/AiContents/parts/PersonalRecordPrompt/index.jsx:205 | showSuccessToast | showSuccessToast( `${aiName} に送信しました` ) |
| renderer/src/components/common/AiContents/parts/PersonalRecordPrompt/index.jsx:223 | showErrorToast | showErrorToast( `${aiName} への送信に失敗しました` ) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/actions/absence.js:72 | showSuccessToast | window.showSuccessToast?.( "✅ 欠席モーダルを開きました", 2000 ) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/actions/absence.js:92 | showErrorToast | window.showErrorToast?.( `❌ 欠席モーダル表示失敗\n${message}`, 3000 ) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/actions/enter.js:158 | showSuccessToast | window.showSuccessToast?.(result.statusMessage, 3000) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/actions/enter.js:171 | showErrorToast | window.showErrorToast?.(`❌ 入室処理失敗\n${err.message}`, 3000) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/actions/exit.js:207 | showSuccessToast | window.showSuccessToast?.(result.statusMessage, 3000) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/actions/exit.js:220 | showErrorToast | window.showErrorToast?.(`❌ 退室処理失敗\n${err.message}`, 3000) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/attendanceTable/fetchAttendanceTableData/index.js:28 | showInfoToast | window.showInfoToast("📥 データ取得中...", 2000) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/attendanceTable/fetchAttendanceTableData/index.js:41 | showSuccessToast | window.showSuccessToast(`✅ データ取得完了\n行数: ${result.rowCount}`, 3000) |
| renderer/src/components/common/hug_function/AttendanceAction/attendance/attendanceTable/fetchAttendanceTableData/index.js:58 | showErrorToast | window.showErrorToast(`❌ データ取得失敗\n${error.message}`, 4000) |
| renderer/src/components/common/hug_function/GetTodayUsersChildren/useAttendanceFetch/index.js:100 | showInfoToast | showInfoToast( "📥 利用者データ取得中..." ) |
| renderer/src/components/common/hug_function/GetTodayUsersChildren/useAttendanceFetch/index.js:196 | showInfoToast | showInfoToast( `✅ 利用者データを抽出・保存しました。\n行数: ${ attendanceData.rowCount }` ) |
| renderer/src/components/common/hug_function/GetTodayUsersChildren/useAttendanceFetch/index.js:249 | showInfoToast | showInfoToast( "⚠️ HUGにログインしてから利用者データを取得してください" ) |
| renderer/src/components/common/hug_function/GetTodayUsersChildren/useAttendanceFetch/index.js:253 | showInfoToast | showInfoToast( `❌ エラー: ${errorMessage}` ) |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx:16 | showSuccessToast | showSuccessToast( posted === 1 ? "個人記録を保存しました" : `${posted}件の個人記録を保存しました` ) |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx:21 | showErrorToast | showErrorToast("個人記録の保存に失敗しました") |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx:84 | showErrorToast | showErrorToast("個人記録の取得に失敗しました") |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx:151 | showErrorToast | showErrorToast("個人記録の取得・保存でエラーが発生しました") |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:19 | showSuccessToast | showSuccessToast( posted === 1 ? "個人記録を保存しました" : `${posted}件の個人記録を保存しました` ) |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:27 | showErrorToast | showErrorToast("個人記録の保存に失敗しました") |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:107 | showErrorToast | showErrorToast("年月の形式が不正です") |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:132 | showErrorToast | showErrorToast("個人記録の取得に失敗しました") |
| renderer/src/components/common/hug_function/PersonalRecord/SavedPersonalRecord/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:214 | showErrorToast | showErrorToast( "個人記録の取得・保存でエラーが発生しました" ) |
| renderer/src/components/common/hug_function/Plan/PersonSupportPlan/index.jsx:14 | showInfoToast | window.showInfoToast?.("個別支援計画を取得しました", 2500) |
| renderer/src/components/common/hug_function/Plan/PersonSupportPlan/index.jsx:17 | showInfoToast | window.showInfoToast?.(`取得・保存エラー: ${error.message}`, 4000) |
| renderer/src/components/common/hug_function/Plan/ProfessionalPlan/index.jsx:13 | showInfoToast | window.showInfoToast?.("専門支援計画を取得し、メモ（notes2）を保存しました", 2500) |
| renderer/src/components/common/hug_function/Plan/ProfessionalPlan/index.jsx:16 | showInfoToast | window.showInfoToast?.(`取得・保存エラー: ${error.message}`, 4000) |
| renderer/src/components/common/Synchronization/AllSyncButton/index.jsx:505 | showErrorToast | showErrorToast?.('施設を選択してください。') |
| renderer/src/components/common/Synchronization/AllSyncButton/index.jsx:513 | showErrorToast | showErrorToast?.(message) |
| renderer/src/components/common/Synchronization/AllSyncButton/index.jsx:523 | showInfoToast | showInfoToast?.( '職員→児童→個人記録一覧→個人記録詳細→Laravel保存の順で実行します', 3000, ) |
| renderer/src/components/common/Synchronization/AllSyncButton/index.jsx:562 | showSuccessToast | showSuccessToast?.( [ '個人記録の更新が完了しました', `職員: ${staffResult.fetchedCount}件`, `児童: ${childrenResult.targetCount}件`, `個人記録保存: ${personalRecordResult.savedCount}件`, ].join(' / '), 6000, ) |
| renderer/src/components/common/Synchronization/AllSyncButton/index.jsx:586 | showErrorToast | showErrorToast?.( `個人記録の更新は「${phase}」で停止しました: ${message}`, ) |
| renderer/src/components/common/Synchronization/ChildrenUpdateButton/index.jsx:30 | showInfoToast | showInfoToast( "HUGから児童データを取得しています", 2000, ) |
| renderer/src/components/common/Synchronization/ChildrenUpdateButton/index.jsx:130 | showResultToast | showResultToast({ title: "HUG児童同期 完了", message: `${targetCount}件の児童データを同期しました`, details: [ `施設ID: ${facilityIdNum}`, `対象児童数: ${targetCount}件`, `紐付け追加: ${linkInserted}件`, `紐付け削除: ${linkDeleted}件`, deleteCandidates > 0 ? `削除候補: ${deleteCandidates}件` : "", `対象日: ${result.target_date &#124;&#124; "-"}`, responseSummary ? `DB応答:\n${responseSummary}` : "", ].filter(Boolean), duration: 7000, }) |
| renderer/src/components/common/Synchronization/ChildrenUpdateButton/index.jsx:163 | showResultToast | showResultToast({ title: "HUG児童同期 エラー", message: "児童データを同期できませんでした", details: errorDetails, success: false, duration: 7000, }) |
| renderer/src/components/common/Synchronization/DataBaseButton/index.jsx:22 | showInfoToast | showInfoToast("再取得OK") |
| renderer/src/components/common/Synchronization/DataBaseButton/index.jsx:24 | showErrorToast | showErrorToast("再取得できませんでした") |
| renderer/src/components/common/Synchronization/DataBaseButton/index.jsx:28 | showErrorToast | showErrorToast("エラー") |
| renderer/src/components/common/Synchronization/StaffChildrenUpdateButton/index.jsx:182 | showInfoToast | showInfoToast( 'HUGの職員・児童データを一括同期しています', 2000, ) |
| renderer/src/components/common/Synchronization/StaffChildrenUpdateButton/index.jsx:200 | showResultToast | showResultToast({ title: 'HUG一括同期 完了', message: '職員・児童データの同期が完了しました', details: [ `職員取得件数: ${staffResult.fetchedCount}件`, staffResult.totalCount != null ? `HUG職員登録件数: ${staffResult.totalCount}件` : '', `児童対象件数: ${childrenResult.targetCount}件`, `児童紐付け追加: ${childrenResult.linkInserted}件`, `児童紐付け削除: ${childrenResult.linkDeleted}件`, childrenResult.deleteCandidates > 0 ? `児童削除候補: ${childrenResult.deleteCandidates}件` : '', `児童対象日: ${childrenResult.targetDate}`, ].filter(Boolean), duration: 8000, }) |
| renderer/src/components/common/Synchronization/StaffChildrenUpdateButton/index.jsx:233 | showResultToast | showResultToast({ title: 'HUG一括同期 エラー', message: '職員・児童データの一括同期を完了できませんでした', details: errorDetails, success: false, duration: 8000, }) |
| renderer/src/components/common/Synchronization/StaffUpdateButton/index.jsx:56 | showInfoToast | showInfoToast( 'HUGから職員データを取得しています', 2000, ) |
| renderer/src/components/common/Synchronization/StaffUpdateButton/index.jsx:120 | showResultToast | showResultToast({ title: 'HUG職員同期 完了', message: `${result.fetched_count}件の職員データを同期しました`, details: [ result.total_count != null ? `HUG登録件数: ${result.total_count}件` : '', `取得件数: ${result.fetched_count}件`, responseSummary ? `DB応答:\n${responseSummary}` : '', ].filter(Boolean), duration: 7000, }) |
| renderer/src/components/common/Synchronization/StaffUpdateButton/index.jsx:141 | showResultToast | showResultToast({ title: 'HUG職員同期 エラー', message: '職員データを同期できませんでした', details: error?.message &#124;&#124; String(error), success: false, duration: 7000, }) |
| renderer/src/components/FacilitySelector/index.jsx:154 | showInfoToast | showInfoToast( '❌ 設定フォルダーを開く機能が見つかりません', ) |
| renderer/src/components/FacilitySelector/index.jsx:169 | showInfoToast | showInfoToast( '📁 設定フォルダーを開きました', ) |
| renderer/src/components/FacilitySelector/index.jsx:181 | showInfoToast | showInfoToast( `❌ 設定フォルダーを開けませんでした: ${ result?.error &#124;&#124; '不明なエラー' }`, ) |
| renderer/src/components/FacilitySelector/index.jsx:193 | showInfoToast | showInfoToast( '❌ 設定フォルダーを開く際にエラーが発生しました', ) |
| renderer/src/components/FacilitySelector/index.jsx:264 | showInfoToast | showInfoToast(TITLE) |
| renderer/src/components/SettingsModal/tabs/Admin/StaffManagement/Login/index.jsx:25 | showErrorToast | showErrorToast('ログインIDを入力してください。') |
| renderer/src/components/SettingsModal/tabs/Admin/StaffManagement/Login/index.jsx:30 | showErrorToast | showErrorToast('パスワードは8文字以上で入力してください。') |
| renderer/src/components/SettingsModal/tabs/Admin/StaffManagement/Login/index.jsx:35 | showErrorToast | showErrorToast('確認用パスワードが一致しません。') |
| renderer/src/components/SettingsModal/tabs/Admin/StaffManagement/Login/index.jsx:63 | showSuccessToast | showSuccessToast('ログイン情報を更新しました。') |
| renderer/src/components/SettingsModal/tabs/Admin/StaffManagement/Login/index.jsx:65 | showErrorToast | showErrorToast(error?.message &#124;&#124; 'ログイン情報の更新に失敗しました。') |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:214 | showErrorToast | showErrorToast(message) |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:241 | showSuccessToast | showSuccessToast(`V2 Flowを再読み込みしました。(${items.length}件)`) |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:247 | showErrorToast | showErrorToast(message) |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:289 | showErrorToast | showErrorToast(e?.message ?? 'Flow詳細の取得に失敗しました。') |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:376 | showErrorToast | showErrorToast('V2管理用Flow更新APIがpreloadに公開されていません。') |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:389 | showErrorToast | showErrorToast(`JSON形式が不正です: ${e.message}`) |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:397 | showErrorToast | showErrorToast(`${file.file_path &#124;&#124; '新規ファイル'} の config_json が不正です。`) |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:404 | showErrorToast | showErrorToast(`メモ #${invalidMemoIndex + 1} のタイトルは1〜255文字で入力してください。`) |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:450 | showSuccessToast | showSuccessToast(`V2 Flow「${flowForm.flow_key}」を保存しました。`) |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/AutomationRulesTab/index.jsx:453 | showErrorToast | showErrorToast(e?.message ?? 'V2 Flowの保存に失敗しました。') |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/components/WebAutomationInstruction.jsx:34 | showErrorToast | showErrorToast('出力する指示書がありません') |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/components/WebAutomationInstruction.jsx:46 | showSuccessToast | showSuccessToast('指示書の出力を開始しました') |
| renderer/src/components/SettingsModal/tabs/Admin/WebAutomation/components/WebAutomationInstruction.jsx:49 | showErrorToast | showErrorToast('指示書の出力に失敗しました') |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:300 | showErrorToast | showErrorToast(result?.error &#124;&#124; 'デバッグフラグの更新に失敗しました') |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:320 | showSuccessToast | showSuccessToast(`デバッグモードを${newValue ? '有効' : '無効'}にしました`) |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:325 | showErrorToast | showErrorToast(error?.message &#124;&#124; 'デバッグフラグの更新に失敗しました') |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:334 | showErrorToast | showErrorToast('自分に登録されている施設を選択してください') |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:462 | showErrorToast | showErrorToast( 'API設定は保存しましたが、データの再取得に失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:470 | showSuccessToast | showSuccessToast( 'API設定を保存し、データを再読み込みしました' ) |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:485 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'API設定の保存に失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:538 | showErrorToast | showErrorToast('ini.jsonは初期化しましたが、データの再取得に失敗しました') |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:540 | showSuccessToast | showSuccessToast('ini.jsonを初期値に戻しました') |
| renderer/src/components/SettingsModal/tabs/ApiTab/index.jsx:544 | showErrorToast | showErrorToast(error?.message &#124;&#124; 'ini.jsonの初期化に失敗しました') |
| renderer/src/components/SettingsModal/tabs/ConfigTab/index.jsx:175 | showErrorToast | showErrorToast( 'Config.jsonは保存しましたが、データの再取得に失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/ConfigTab/index.jsx:183 | showSuccessToast | showSuccessToast( 'Config.jsonを保存し、データを再読み込みしました' ) |
| renderer/src/components/SettingsModal/tabs/ConfigTab/index.jsx:198 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'Config.jsonの保存に失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx:188 | showSuccessToast | showSuccessToast( 'URLをクリップボードにコピーしました' ) |
| renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx:214 | showSuccessToast | showSuccessToast( 'URLをクリップボードにコピーしました' ) |
| renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx:218 | showErrorToast | showErrorToast( fallbackError?.message &#124;&#124; 'URLのコピーに失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx:296 | showSuccessToast | showSuccessToast( '機能設定を保存しました' ) |
| renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx:305 | showErrorToast | showErrorToast( error?.message &#124;&#124; '機能設定の保存に失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx:335 | showSuccessToast | showSuccessToast( '機能設定を再読み込みしました' ) |
| renderer/src/components/SettingsModal/tabs/FeaturesTab/index.jsx:344 | showErrorToast | showErrorToast( error?.message &#124;&#124; '機能設定の再読み込みに失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/PromptTab/index.jsx:52 | showSuccessToast | showSuccessToast( 'データベースからプロンプトを再読み込みしました。' ) |
| renderer/src/components/SettingsModal/tabs/PromptTab/index.jsx:62 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'プロンプトの取得に失敗しました。' ) |
| renderer/src/components/SettingsModal/tabs/PromptTab/index.jsx:97 | showSuccessToast | showSuccessToast( 'プロンプトを初期値に戻しました。保存するとデータベースに反映されます。' ) |
| renderer/src/components/SettingsModal/tabs/PromptTab/index.jsx:137 | showSuccessToast | showSuccessToast( 'プロンプトをデータベースに保存しました。' ) |
| renderer/src/components/SettingsModal/tabs/PromptTab/index.jsx:146 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'プロンプトの保存に失敗しました。' ) |
| renderer/src/components/SettingsModal/tabs/StaffTab/index.jsx:332 | showErrorToast | showErrorToast( 'スタッフが選択されていません。', ) |
| renderer/src/components/SettingsModal/tabs/StaffTab/index.jsx:342 | showErrorToast | showErrorToast( 'スタッフ名を入力してください。', ) |
| renderer/src/components/SettingsModal/tabs/StaffTab/index.jsx:353 | showErrorToast | showErrorToast( '少なくとも1つの施設を選択してください。', ) |
| renderer/src/components/SettingsModal/tabs/StaffTab/index.jsx:464 | showSuccessToast | showSuccessToast( '職員情報を更新しました。', ) |
| renderer/src/components/SettingsModal/tabs/StaffTab/index.jsx:478 | showErrorToast | showErrorToast( error?.response?.data ?.message &#124;&#124; error?.message &#124;&#124; '職員情報の更新に失敗しました。', ) |
| renderer/src/components/SettingsModal/tabs/UITab/index.jsx:242 | showSuccessToast | showSuccessToast( 'UI設定を保存しました' ) |
| renderer/src/components/SettingsModal/tabs/UITab/index.jsx:251 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'UI設定の保存に失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/UITab/index.jsx:281 | showSuccessToast | showSuccessToast( 'UI設定を再読み込みしました' ) |
| renderer/src/components/SettingsModal/tabs/UITab/index.jsx:290 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'UI設定の再読み込みに失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/UrlTab/index.jsx:77 | showSuccessToast | showSuccessToast('URL設定を保存しました') |
| renderer/src/components/SettingsModal/tabs/UrlTab/index.jsx:81 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'URL設定の保存に失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/UrlTab/index.jsx:104 | showSuccessToast | showSuccessToast('URL設定を再読み込みしました') |
| renderer/src/components/SettingsModal/tabs/UrlTab/index.jsx:108 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'URL設定の再読み込みに失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/WindowTab/index.jsx:178 | showSuccessToast | showSuccessToast( 'ウィンドウ設定を保存しました' ) |
| renderer/src/components/SettingsModal/tabs/WindowTab/index.jsx:187 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'ウィンドウ設定の保存に失敗しました' ) |
| renderer/src/components/SettingsModal/tabs/WindowTab/index.jsx:217 | showSuccessToast | showSuccessToast( 'ウィンドウ設定を再読み込みしました' ) |
| renderer/src/components/SettingsModal/tabs/WindowTab/index.jsx:226 | showErrorToast | showErrorToast( error?.message &#124;&#124; 'ウィンドウ設定の再読み込みに失敗しました' ) |
| renderer/src/components/ui/CopyButton/index.jsx:55 | showSuccessToast | showSuccessToast("コピーしました") |
| renderer/src/components/ui/CopyButton/index.jsx:58 | showErrorToast | showErrorToast("コピーに失敗しました") |
| renderer/src/components/ui/DateSelect/index.jsx:41 | showInfoToast | showInfoToast( `📅 日付を ${selectedDate} に設定しました` ) |
| renderer/src/components/ui/InstructionDocument/index.jsx:19 | showSuccessToast | showSuccessToast('指示書の出力を開始しました') |
| renderer/src/components/ui/InstructionDocument/index.jsx:22 | showErrorToast | showErrorToast('指示書の出力に失敗しました') |
| renderer/src/components/ui/WeekdaySelect/index.jsx:59 | showInfoToast | showInfoToast( `📅 曜日を ${weekdayObj.label_jp} に設定しました` ) |
| renderer/src/hooks/useHugActions.js:122 | showErrorToast | showErrorToast('❌ WebViewが見つかりません') |
| renderer/src/hooks/useHugActions.js:130 | showErrorToast | showErrorToast('❌ URLが取得できませんでした') |
| renderer/src/hooks/useHugActions.js:140 | showSuccessToast | showSuccessToast(`✅ URLをコピーしました\n${shortUrl}`) |
| renderer/src/hooks/useHugActions.js:148 | showErrorToast | showErrorToast('❌ WebViewが見つかりません') |
| renderer/src/hooks/useHugActions.js:161 | showSuccessToast | showSuccessToast('✅ URLをクリップボードにコピーしました（フォールバック）') |
| renderer/src/hooks/useHugActions.js:165 | showErrorToast | showErrorToast('❌ URLのコピーに失敗しました') |
| renderer/src/utils/ToDayChildrenList/attendancePageHandler.js:127 | showInfoToast | showInfoToast(`✅ 利用者データを抽出・保存しました。\n行数: ${attendanceData.rowCount &#124;&#124; "不明"}`) |
| renderer/src/utils/ToDayChildrenList/attendancePageHandler.js:129 | showInfoToast | showInfoToast("⚠️ データ抽出に失敗しました（テーブルは取得済み）") |
| renderer/src/utils/ToDayChildrenList/attendancePageHandler.js:132 | showInfoToast | showInfoToast(`⚠️ 取得失敗: ${result?.error &#124;&#124; "不明なエラー"}`) |
| renderer/src/utils/ToDayChildrenList/attendancePageHandler.js:136 | showInfoToast | showInfoToast(`❌ エラー: ${error.message}`) |
| renderer/src/utils/ToDayChildrenList/_fetchAttendanceTableData.js:51 | showInfoToast | window.showInfoToast("📥 データ取得中...", 2000) |
| renderer/src/utils/ToDayChildrenList/_fetchAttendanceTableData.js:117 | showSuccessToast | window.showSuccessToast(`✅ データ取得完了\n行数: ${tableHTML.rowCount}`, 3000) |
| renderer/src/utils/ToDayChildrenList/_fetchAttendanceTableData.js:133 | showErrorToast | window.showErrorToast(`❌ データ取得失敗\n${error.message}`, 4000) |
| renderer/src/windows/MainWindow/Header/Tabs.jsx:29 | showSuccessToast | showSuccessToast('アクティブを切り替える') |
| renderer/src/windows/MainWindow/Header/ToolsListNavi/index.jsx:47 | showInfoToast | showInfoToast( result ? '🧹 キャッシュ削除完了！' : '⚠ キャッシュの削除に失敗しました', ) |
| renderer/src/windows/MainWindow/Header/ToolsListNavi/index.jsx:58 | showInfoToast | showInfoToast( '⚠ キャッシュの削除に失敗しました', ) |
| renderer/src/windows/MainWindow/Header/ToolsListNavi/SleepButton/index.jsx:22 | showErrorToast | showErrorToast(error?.message &#124;&#124; 'ロックに失敗しました') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx:15 | showSuccessToast | showSuccessToast( posted === 1 ? "個人記録を保存しました" : `${posted}件の個人記録を保存しました` ) |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx:20 | showErrorToast | showErrorToast("個人記録の保存に失敗しました") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx:78 | showErrorToast | showErrorToast("個人記録の取得に失敗しました") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/DayControls/PersonalRecordGetDayBtn/index.jsx:141 | showErrorToast | showErrorToast("個人記録の取得・保存でエラーが発生しました") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:18 | showSuccessToast | showSuccessToast( posted === 1 ? "個人記録を保存しました" : `${posted}件の個人記録を保存しました` ) |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:26 | showErrorToast | showErrorToast("個人記録の保存に失敗しました") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:103 | showErrorToast | showErrorToast("年月の形式が不正です") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:126 | showErrorToast | showErrorToast("個人記録の取得に失敗しました") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/AiInquiry/MainContainer/Pages/PersonalRecordPage/PersonSwitchPanel/MonthControls/PersonalRecordGetMonthBtn/index.jsx:204 | showErrorToast | showErrorToast( "個人記録の取得・保存でエラーが発生しました" ) |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:509 | showErrorToast | showErrorToast('選択児童IDを取得できません') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:523 | showErrorToast | showErrorToast('入室ボタン情報がありません') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:562 | showErrorToast | showErrorToast(res?.error &#124;&#124; '入室に失敗しました') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:576 | showErrorToast | showErrorToast(String(error?.message &#124;&#124; error)) |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:595 | showErrorToast | showErrorToast('選択児童IDを取得できません') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:610 | showErrorToast | showErrorToast('退室ボタン情報がありません') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:649 | showErrorToast | showErrorToast(res?.error &#124;&#124; '退室に失敗しました') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:663 | showErrorToast | showErrorToast(String(error?.message &#124;&#124; error)) |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:682 | showErrorToast | showErrorToast('選択児童IDを取得できません') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:696 | showErrorToast | showErrorToast('欠席ボタン情報がありません') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:715 | showSuccessToast | showSuccessToast('欠席モーダルを開きました') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:717 | showErrorToast | showErrorToast(res?.error &#124;&#124; '欠席モーダル表示に失敗しました') |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/FanContent/SelectChildren/TodayChildrenList/ChildAttendancePanel/index.jsx:721 | showErrorToast | showErrorToast(String(error?.message &#124;&#124; error)) |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx:232 | showErrorToast | showErrorToast("API設定が未選択です") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx:238 | showErrorToast | showErrorToast("施設IDが取得できません") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx:244 | showErrorToast | showErrorToast("職員IDが取得できません") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx:250 | showErrorToast | showErrorToast("曜日IDが取得できません") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx:266 | showSuccessToast | showSuccessToast("追加完了しました") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx:278 | showErrorToast | showErrorToast("失敗しました") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/InsertChildren/ChildrenTableList/index.jsx:284 | showErrorToast | showErrorToast("失敗しました") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/UpdateManager/UpdateManagerTable/index.jsx:281 | showInfoToast | showInfoToast(`${payloads.length}件を更新しました。`) |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/UpdateManager/UpdateManagerTable/index.jsx:285 | showErrorToast | showErrorToast(error?.message &#124;&#124; "一括更新に失敗しました。") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/UpdateManager/UpdateManagerTable/index.jsx:323 | showInfoToast | showInfoToast("削除しました。") |
| renderer/src/windows/MainWindow/MainContent/Sidebar/NomalMode/Dashboard/TabsContainer/UpdateManager/UpdateManagerTable/index.jsx:327 | showErrorToast | showErrorToast(error?.message &#124;&#124; "削除に失敗しました。") |
| renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/index.jsx:131 | showInfoToast | showInfoToast?.( '支援加算の再取得後に、個人記録を更新します', 3000, ) |
| renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/index.jsx:157 | showSuccessToast | showSuccessToast?.( '支援加算と個人記録の更新が完了しました。', 5000, ) |
| renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/index.jsx:164 | showErrorToast | showErrorToast?.(message) |
| renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/PersonalRecordSyncRunner.jsx:488 | showErrorToast | showErrorToast?.('施設を選択してください。') |
| renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/PersonalRecordSyncRunner.jsx:496 | showErrorToast | showErrorToast?.(message) |
| renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/PersonalRecordSyncRunner.jsx:506 | showInfoToast | showInfoToast?.( '職員(V2)→児童(V2)→個人記録一覧(V2)→詳細(V2)→Laravel保存の順で実行します', 3000, ) |
| renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/PersonalRecordSyncRunner.jsx:536 | showSuccessToast | showSuccessToast?.( [ '個人記録の更新が完了しました', `職員: ${staffResult.fetchedCount}件`, `児童: ${childrenResult.targetCount}件`, `個人記録保存: ${personalRecordResult.savedCount}件`, ].join(' / '), 6000, ) |
| renderer/src/windows/ProfessionalSupportWindow/LeftPanel/ProfessionalSupportAndPersonalRecordSyncButton/PersonalRecordSyncRunner.jsx:559 | showErrorToast | showErrorToast?.( `個人記録の更新は「${phase}」で停止しました: ${message}`, ) |
