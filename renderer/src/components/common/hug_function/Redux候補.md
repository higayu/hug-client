# `hug_function` 配下の Redux 依存解消候補

## 目的

`renderer/src/components/common/hug_function` を、Redux の構造や現在の画面状態に依存しない共通機能として扱えるようにする。

`PersonalRecordButton` と同様に、共通コンポーネントは必要な値と処理を props で受け取る。Redux の `useSelector` / `useDispatch` は、原則として FanContent、SimpleBoard、Header などの画面側コンテナへ移す。

最終的な確認条件は、次の検索結果が0件になること。

```text
rg "react-redux|@/store|store/store" renderer/src/components/common/hug_function
```

## 基本方針

- 表示に必要な値は `spaceId` ではなく、実際に利用する `selectedChildId`、`selectedChildName`、`currentYmd` などを props で渡す。
- Redux の状態更新は、`onLoaded`、`onStatusChange`、`onAttendanceUpdated` などの callback props で画面側へ通知する。
- 共通 hook は Redux selector を実行せず、引数として必要値を受け取る。
- Redux action を dispatch するだけの処理は、画面側コンテナまたは Redux 接続用 hook に移す。
- Redux store を直接 import する非React処理は、必要な状態・更新関数を引数で注入する。
- `spaceId` は画面側が Redux の対象枠を特定するために使い、共通コンポーネント内部では使わない。

## 優先度A：props 化しやすい UI コンポーネント

### `ProfessionalPlan/index.jsx`

現状：`spaceId` を受け取り、内部で `selectSpaceChildId(spaceId)` を実行している。

候補：

- `spaceId` を `selectedChildId` prop に置き換える。
- FanContent の `ProfessionalPrompt1` 側で Redux から児童IDを取得して渡す。
- Laravel API 版の `ProfessionalPrompt1` も同じ形にそろえる。

### `PersonSupportPlan/index.jsx`

現状：`spaceId` を受け取り、内部で児童IDを取得している。

候補：

- `selectedChildId` を props で受け取る。
- 通常版と Laravel API 版の `ChildNotesTabs` で Redux から取得して渡す。

### `WaitingListRegistration/index.jsx`

現状：`spaceId` がなければ `activeSpaceId` を使用し、対象 space 全体を内部で取得している。

候補：

- 実際に使用する `selectedChildId`、`selectedChildName`、その他必要値を個別の props にする。
- active space のフォールバックを廃止する。
- 現在、明確な外部利用箇所が検索できないため、未使用なら削除候補としても確認する。

### `ProfessionalSupport/ProfessionalSupportSearch/index.jsx`

現状：`selectFacilitys` を内部で実行している。

候補：

- `facilitys` を props で受け取る。
- 呼び出し元の `MainWindow/Header/ToolsListNavi` で Redux から取得する。

## 優先度B：チェックパネルとチェック用 hook

### `PersonalRecord/PersonalRecordCheckPanel/index.jsx`

現状：以下を内部で Redux から取得している。

- active space
- 対象児童ID・氏名
- 対象日
- 個人記録の確認状態

候補：

- `selectedChildId`
- `selectedChildName`
- `currentYmd`
- `registered`
- `recordCount`
- `checking`
- `onCheck`

上記を props で受け取る表示コンポーネントにする。呼び出し元の FanContent `CheckPanels` を Redux 接続コンテナにする。

### `PersonalRecord/PersonalRecordCheckPanel/usePersonRecordCheck/index.js`

現状：児童ID、施設ID、対象日を selector で取得し、結果を `recordStatusSlice` へ dispatch している。

候補：

- hook の引数を `{ selectedChildId, facilityId, currentYmd, onResult }` にする。
- hook 内の `useSelector` と `useDispatch` を削除する。
- `onResult` の中で dispatch する Redux 接続用 hook を FanContent 側に置く。
- またはチェック結果を呼び出し元へ返し、画面側で dispatch する。

### `ProfessionalSupport/ProfessionalSupportCheckPanel2/index.jsx`

現状：active space、児童ID、対象日、専門支援の確認状態を内部で取得している。

候補：

- `selectedChildId`、`currentYmd`、`registered`、`recordCount`、`checking`、`onCheck` を props 化する。
- FanContent の各呼び出し元で対象 space の値を Redux から取得する。

### `ProfessionalSupport/ProfessionalSupportCheckPanel2/useProfessionalSupportCheck2/index.js`

現状：active space、児童ID、施設ID、対象日を selector で取得し、確認結果を dispatch している。

候補：

- チェックに必要な値をすべて引数にする。
- 結果通知を callback にする。
- Redux 接続は FanContent 側に移す。

### `ProfessionalSupport/ProfessionalSupportCheckPanel/index.jsx`

現状：画面から児童IDや対象日は受け取っているが、確認状態だけ `recordStatusSlice` から取得している。

候補：

- `professionalSupportStatus` または `registered` / `recordCount` を props で受け取る。
- SimpleBoard の `AttendanceRow` 側で selector を実行する。
- 行数分の selector を置く場合は、行コンテナを分けるか、親テーブルで状態をまとめて取得する。

### `ProfessionalSupport/ProfessionalSupportCheckPanel/useProfessionalSupportCheck2/index.js`

現状：施設IDと対象日を Redux から取得し、結果を dispatch している。

候補：

- `facilityId` と `currentYmd` を引数化する。
- Redux 更新を `onResult` callback に置き換える。

## 優先度C：個人記録管理パネル

### `PersonalRecord/PersonalRecordManagerPanel2/index.jsx`

現状：対象児童IDを selector で取得し、読み込んだサービス記録を `databaseSlice` へ dispatch している。

候補：

- `selectedChildId` と `serviceRecords` を props で受け取る。
- 更新は `onServiceRecordsChange` で通知する。
- FanContent `WorkingPanel` 側を Redux 接続コンテナにする。
- 子コンポーネントへ `spaceId` を渡す構造も、児童ID・記録データを渡す構造へ変更する。

### `PersonalRecord/PersonalRecordLaravelLoader/index.jsx`

現状：取得結果を `setServiceRecord` で直接 dispatch している。

候補：

- `onLoaded(records)` prop を追加する。
- データ取得だけを担当し、保存先を Redux に限定しない。

### `PersonalRecord/PersonalRecordManagerPanel2/ListBox_Text/index.jsx`

現状：児童IDとサービス記録を内部で selector から取得している。

候補：

- `selectedChildId` と `serviceRecords` を props で受け取る。
- 親の `PersonalRecordManagerPanel2` から引き渡す。

### `PersonalRecordGetDayBtn/index.jsx`

対象：

```text
PersonalRecordManagerPanel2/PersonSwitchPanel/DayControls/
PersonalRecordGetDayBtn/index.jsx
```

現状：`spaceId` から児童IDを selector で取得している。

候補：

- `selectedChildId` を props で受け取る。
- 日単位取得の結果は callback で親へ返す。

### `PersonalRecordGetMonthBtn/index.jsx`

対象：

```text
PersonalRecordManagerPanel2/PersonSwitchPanel/MonthControls/
PersonalRecordGetMonthBtn/index.jsx
```

現状：`spaceId` から児童IDを selector で取得している。

候補：

- `selectedChildId` を props で受け取る。
- 月単位取得の結果は callback で親へ返す。

## 優先度D：共通データ取得 hook

### `GetTodayUsersChildren/useAttendanceFetch/index.js`

現状：取得結果を `attendanceSlice` の `setExtractedData` と `setTableData` へ直接 dispatch している。

候補：

- hook は取得結果を返すか、`onFetched({ extractedData, tableData })` を呼ぶ。
- Dashboard/FanContent/SimpleBoard の接続層で dispatch する。
- 複数画面で同じ attendance state を共有する必要があるかを先に確認する。

## 優先度E：Redux store を直接参照する入退室処理

対象：

```text
AttendanceAction/attendance/actions/enter.js
AttendanceAction/attendance/actions/exit.js
AttendanceAction/attendance/flow/attendanceNativeFlow.js
AttendanceAction/attendance/_shared/webview.js
AttendanceAction/attendance/update/runAttendanceUpdate.js
```

現状：React コンポーネント外から Redux store を直接参照、または Redux action を直接利用している。

候補：

- 処理開始時点で必要な state を `attendanceContext` のような引数へまとめる。
- 更新処理は `onAttendanceUpdated`、`onExtractedDataChange` などの callback として注入する。
- webview 操作と Redux 更新を分離する。
- `runAttendanceUpdate` は Redux action を生成・dispatch するのではなく、更新後データを返す純粋な処理へ寄せる。
- FanContent と SimpleBoard が同じ入退室処理を利用できる状態を維持する。

この範囲は影響が大きいため、UI の props 化と同じ変更に混ぜず、別段階で実施する。

## 推奨実施順

1. `ProfessionalPlan`、`PersonSupportPlan`、`ProfessionalSupportSearch`
2. PersonalRecord / ProfessionalSupport のチェックパネル
3. `PersonalRecordManagerPanel2` と子コンポーネント
4. `GetTodayUsersChildren/useAttendanceFetch`
5. AttendanceAction の store 直接参照
6. 全呼び出し元の動作確認後、`hug_function` 配下の Redux import が0件か確認

## 動作確認項目

- FanContent が上下2枠のとき、それぞれ正しい児童を参照する。
- 非アクティブ側のボタンを操作しても active space の児童へ切り替わらない。
- SimpleBoard の各行が、その行の児童IDを利用する。
- 個人記録・専門支援の確認結果が正しい児童と日付へ保存される。
- 日・月単位の個人記録取得後に一覧が更新される。
- 入室・退室後に FanContent と SimpleBoard の表示が同期する。
- 児童未選択時に API 呼び出しや誤った Redux 更新が発生しない。

## 対象ファイル数

2026-10-01 時点の検索では、`react-redux` または `@/store` / store 直接参照を含むファイルは21件。

`PersonalRecordButton` は Redux 非依存化済みのため、以後の修正例として扱う。
