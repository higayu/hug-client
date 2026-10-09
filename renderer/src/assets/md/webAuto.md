# Electron WebAutomation V2 DB駆動化 指示書

## 1. この依頼の目的

現在 renderer 内にハードコードされている WebView 操作・HTML解析・業務処理を、
`web_automation_*_v2` テーブルを使用した **WebAutomation V2方式** へ移行してください。

目的は、今後のサイト仕様変更や業務ロジック変更に対して、

- Electronアプリを再ビルドしない
- exeを再配布しない
- DB側のFlow / 仮想JSファイルを更新するだけで全アプリへ反映する

ことです。

V2では、DBに「処理順」や「Rule」を細かく分割して保存する方式ではなく、

```text
1 Flow
  └─ 複数のJavaScriptファイル
```

をDBへ保存し、実行時にメモリ上の仮想モジュールとして復元して実行します。

基本構成は、

```text
DB = 業務処理本体・変更されやすい処理
Renderer = 共通実行基盤
WebView = サイト側処理実行環境
```

です。


# 2. 現在のV2 DB構成

現在のWebAutomation V2は、主に以下の4テーブルを使用します。

```text
web_automation_flows_v2
web_automation_files_v2
web_automation_flow_memos_v2
web_automation_execution_logs_v2
```

旧V1の

```text
web_automation_flows
web_automation_flow_steps
web_automation_rules
web_automation_execution_logs
```

は既存処理用として残っている場合があります。

V2へ移行する処理では、原則としてV2テーブルを使用してください。


## 2-1. web_automation_flows_v2

1つの業務処理全体を表します。

主な項目：

```text
id
app_key
flow_key
name
description
entry_file
entry_export
engine_version
config_json
input_schema_json
output_schema_json
timeout_ms
version
status
published_at
created_at
updated_at
```

重要項目：

### flow_key

Rendererから処理を呼び出す一意キーです。

例：

```text
attendance_fetch_today_users
```

Renderer側では、

```javascript
await executeFlowV2(
  "attendance_fetch_today_users",
  {
    facilityId,
    dateStr,
  }
);
```

のように呼び出します。


### entry_file

DBに保存されている複数JSファイルのうち、
最初に実行するファイルです。

例：

```text
index.js
```


### entry_export

entry_fileから呼び出すexportです。

通常は、

```text
default
```

を使用します。


### status

以下を使用します。

```text
draft
published
disabled
```

Electronアプリから通常実行する場合は、

```text
published
```

のみ取得してください。

`draft` は管理者が編集・確認するための状態です。


### version

Flowのバージョンを管理します。

例：

```text
attendance_fetch_today_users version 1
attendance_fetch_today_users version 2
```

アプリ実行時は、原則として最新の `published` versionを使用します。


# 2-2. web_automation_files_v2

Flowに属する仮想JavaScriptファイルを保存します。

主な項目：

```text
id
flow_id
file_path
file_type
source_text
module_type
config_json
content_hash
is_active
created_at
updated_at
```

例：

```text
attendance_fetch_today_users

index.js
fetch.js
parse.js
```

DB上では3行に分けて保存します。

実行時に物理ファイルへ書き出すのではなく、
`moduleLoader.js` がメモリ上の仮想モジュールとして構築します。


## source_text

JavaScriptファイル全文を保存します。

V2では、業務処理単位のJSファイルをDBへ保存することを許可します。

ただし、アプリ本体のElectron固有処理や、認証情報・秘密情報を直接source_textへ埋め込まないでください。


## module_type

現在は原則として、

```text
commonjs
```

を使用します。

仮想モジュール間では、

```javascript
const { fetchAttendanceHtml } = await require("./fetch");
const { extractColumnData } = await require("./parse");
```

のように参照します。


# 2-3. web_automation_flow_memos_v2

Flowごとの運用メモを保存します。

主な項目：

```text
id
flow_id
memo
sort_order
is_active
created_at
updated_at
```

用途例：

```text
HUGのHTML構造変更履歴
selector変更理由
仕様上の注意事項
調査メモ
一時対応内容
```

Flowのversionごとに別メモを保持できます。


# 2-4. web_automation_execution_logs_v2

V2 Flowの実行結果を保存します。

基本的に、

```text
1 executeFlowV2()
=
1 execution log
```

です。

主な項目：

```text
execution_uuid
app_key
flow_id
flow_key
flow_version
entry_file
entry_export
input_json
result_json
debug_json
status
error_code
error_message
started_at
finished_at
duration_ms
created_at
```

ログは14日以上前のものを定期削除します。

現在の定期削除対象は、

```text
web_automation_execution_logs_v2
```

です。


# 3. V2共通実行基盤

Renderer側の共通実行基盤は以下です。

```text
renderer/
└─ src/
   └─ components/
      └─ WebAutomationV2/
         ├─ executeFlowV2.js
         ├─ moduleLoader.js
         ├─ helpers.js
         ├─ index.js
         └─ runtime/
```

`runtime/` は物理ファイル保存先ではありません。

DB上の複数ファイルをメモリ上で仮想的に復元して実行するための概念上の領域です。


# 4. executeFlowV2 の基本動作

基本フロー：

```text
UI / 個別機能
↓
executeFlowV2(flowKey, input)
↓
Preload
↓
Main
↓
Laravel API
↓
最新published Flow取得
↓
Flowに属するfiles[]を一括取得
↓
Rendererへ返却
↓
moduleLoaderで仮想モジュール構築
↓
entry_file実行
↓
必要に応じてWebView処理
↓
Renderer側処理
↓
最終result
↓
個別機能へ返却
↓
Redux / AppState
```

個別機能側は、できる限り次の程度にしてください。

```javascript
const result =
  await executeFlowV2(
    "attendance_fetch_today_users",
    {
      facilityId,
      dateStr,
    }
  );
```

個別機能側に、

```text
対象URL
selector
HTML解析ロジック
fetch処理
WebView操作
```

を再度ハードコードしないでください。


# 5. DBへ移すもの

V2では、対象業務に固有の処理は原則としてDBの仮想JSファイルへ移します。

例：

```text
対象URL
query parameter
fetch設定
POST設定
selector
DOM解析
HTML解析
サイト固有のJavaScript関数呼び出し
MutationObserver
retry
timeout
成功判定
失敗判定
レスポンス整形
業務処理の実行順
```

例えば、

```text
index.js
fetch.js
parse.js
```

のように役割ごとに分割して保存して構いません。


# 6. Renderer / exe側へ残すもの

Electron固有の共通基盤はexe側に残します。

例：

```text
executeFlowV2
Flow Bundle取得
moduleLoader
仮想require解決
WebView取得
executeJavaScript
Laravel API通信
JWT認証
execution log送信
標準timeout
標準エラー処理
Redux / AppState更新
```

つまり、

```text
何をするか
→ DB

どうDBファイル群を読み込み・安全に実行するか
→ WebAutomationV2共通基盤
```

です。


# 7. helpers の利用

DB側JavaScriptからElectron固有機能へ直接依存しすぎないよう、
共通 `helpers` を使用します。

例：

```javascript
helpers.getHugWebview()
helpers.executeInWebview()
helpers.executeFunctionInWebview()
```

DB側コードで、

```javascript
document.querySelector("webview")
```

などを直接行ってWebViewを探さないでください。

WebView取得方法が変わっても、helpers側だけ変更すれば済む構成にします。


# 8. 仮想モジュールの基本形式

例：

## index.js

```javascript
const {
  fetchAttendanceHtml
} = await require("./fetch");

const {
  extractColumnData
} = await require("./parse");

module.exports = async function execute({
  input,
  helpers,
  config,
  flow,
}) {
  const raw =
    await fetchAttendanceHtml({
      input,
      helpers,
      config,
    });

  const extracted =
    await extractColumnData(
      raw.html,
      config
    );

  return {
    ...raw,
    extracted,
  };
};
```


## fetch.js

WebView内で実行すべき処理を担当します。

```javascript
exports.fetchAttendanceHtml =
  async function ({
    input,
    helpers,
    config,
  }) {

    return helpers.executeFunctionInWebview({
      functionText: "...",
      args: [input, config],
    });
  };
```


## parse.js

Renderer側でHTML解析などを行います。

```javascript
exports.extractColumnData =
  async function (
    html,
    config
  ) {
    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        html,
        "text/html"
      );

    // HTML解析

    return {
      success: true,
      data: [],
    };
  };
```


# 9. ファイル間の実行順

V2では、実行順をStepテーブルへ保存しません。

JavaScript自身が処理順を持ちます。

例えば、

```javascript
const raw =
  await fetchAttendanceHtml(...);

const parsed =
  await extractColumnData(
    raw.html
  );

return parsed;
```

と書けば、

```text
WebViewでHTML取得
↓
RendererでHTML解析
↓
完成データをreturn
```

という順番になります。

つまり、

```text
web_automation_steps_v2
web_automation_parsers_v2
web_automation_scripts_v2
```

のような分割テーブルは現在のV2では使用しません。


# 10. 今日の利用者取得の現在のV2例

flow_key：

```text
attendance_fetch_today_users
```

仮想ファイル：

```text
attendance_fetch_today_users
├─ index.js
├─ fetch.js
└─ parse.js
```

処理：

```text
GetTodayUsersChildren
↓
useAttendanceFetch
↓
executeFlowV2(
  "attendance_fetch_today_users",
  {
    facilityId,
    dateStr
  }
)
↓
DB Flow取得
↓
index.js / fetch.js / parse.js取得
↓
メモリ上で仮想モジュール構築
↓
index.js実行
↓
fetch.js
  → HUG WebView
  → attendance.php取得
  → table HTML取得
↓
parse.js
  → HTML解析
  → 児童ID
  → 氏名
  → 入室
  → 退室
  → edit_id
  → edit_s_id
  → edit_url
↓
result
↓
Redux
↓
AppState
```

個別機能側は、HTML取得や解析処理を持たない状態を目標にしてください。


# 11. Laravel API

V2実行用API：

```text
GET   /api/web-automation-v2/flows
GET   /api/web-automation-v2/flows/{flowKey}
POST  /api/web-automation-v2/execution-logs
PATCH /api/web-automation-v2/execution-logs/{id}
```

通常のFlow取得APIは、

```text
status = published
```

のみ返してください。

一般ユーザーが `draft` を取得できる構成にしないでください。


# 12. V2管理者API

管理者用API：

```text
GET   /api/web-automation-v2/admin/flows
GET   /api/web-automation-v2/admin/flows/{id}
PATCH /api/web-automation-v2/admin/flows/{id}
GET   /api/web-automation-v2/admin/execution-logs
```

管理者APIでは、

```text
Flow本体
files[]
deleted_file_ids[]
memos[]
deleted_memo_ids[]
```

を扱います。

更新時はLaravel側でDBトランザクションを使用してください。

途中で失敗した場合に、

```text
Flowだけ更新
JSファイルだけ更新
Memoだけ更新
```

のような不整合が起きないようにしてください。


# 13. Laravel側の権限

V2管理機能は管理者のみ編集可能にします。

Laravel側でも必ず、

```php
$staff->isAdmin()
```

等で確認してください。

Renderer側でボタンを非表示にするだけでは不十分です。

以下は管理者以外から変更不可にしてください。

```text
Flow
source_text
Files
Memos
status
version
published / draft
```


# 14. HTTPS / 認証

Electron → Laravel API通信はHTTPSを使用してください。

Laravel APIはJWT等の既存認証経路を使用します。

DBの `source_text` は実行可能コードなので、

```text
未認証アクセス
一般ユーザーによる編集
直接公開APIからの更新
```

を許可しないでください。


# 15. published / draft 運用

推奨運用：

```text
管理者がdraftを作成
↓
Filesを編集
↓
動作確認
↓
publishedへ変更
↓
全Electronアプリが次回取得時から新versionを使用
```

仕様変更時にexe更新は不要です。

ただし、

```text
executeFlowV2
moduleLoader
helpers
Preload API
Main IPC
Electron権限
```

など、共通実行基盤そのものを変更する場合はアプリ更新が必要です。


# 16. version管理

同じ `flow_key` でも複数versionを保持できます。

例：

```text
attendance_fetch_today_users v1
attendance_fetch_today_users v2
```

新versionを公開したあと問題が発生した場合、
以前のversionを再度publishedへ戻せる運用を想定してください。


# 17. content_hash

`web_automation_files_v2.content_hash` には、
可能であれば `source_text` のSHA-256を保存します。

用途：

```text
改ざん・不整合確認
キャッシュ判定
変更確認
デバッグ
```

Laravel側で保存時に自動算出する方式を推奨します。


# 18. main / preload のV2実行API

Rendererから使用するV2実行API：

```javascript
window.electronAPI.webAutomationV2_getFlowBundle(...)
window.electronAPI.webAutomationV2_executionLogStart(...)
window.electronAPI.webAutomationV2_executionLogFinish(...)
```

Main側ではLaravel APIへ接続します。

V1 APIが残っているプロジェクトでは、
V1を壊さずV2を並行して使用してください。


# 19. main / preload のV2管理API

設定モーダル管理者タブ用：

```javascript
window.electronAPI.laravel_webAutomationV2Flows_getAll(...)
window.electronAPI.laravel_webAutomationV2Flow_get(...)
window.electronAPI.laravel_webAutomationV2Flow_update(...)
window.electronAPI.laravel_webAutomationV2ExecutionLogs_getAll(...)
```

互換API名が存在する場合：

```javascript
window.electronAPI.webAutomationV2_adminFlowsGetAll(...)
window.electronAPI.webAutomationV2_adminFlowGet(...)
window.electronAPI.webAutomationV2_adminFlowUpdate(...)
window.electronAPI.webAutomationV2_adminExecutionLogsGetAll(...)
```

既に最新V2 IPCが存在する場合、
同じ用途の別IPCを追加しないでください。


# 20. 管理画面

管理画面：

```text
renderer/src/components/SettingsModal/tabs/Admin/WebAutomation
```

現在のV2管理画面は以下を扱います。

```text
Flows
Files
Memos
Logs
```

旧V2の、

```text
Rules
Steps
Parsers
```

前提の画面を残さないでください。


# 21. SQL作成ルール

V2登録SQLは原則としてトランザクション化してください。

```sql
START TRANSACTION;
```

完了時：

```sql
COMMIT;
```

固定AUTO_INCREMENT IDを根拠なく指定しないでください。

Flow登録後、

```sql
SET @flow_id = LAST_INSERT_ID();
```

またはキー検索で `flow_id` を取得してください。


# 22. 照合順序

現在のDBでは、
DB既定照合順序とV2テーブルの照合順序が異なる場合があります。

V2登録SQLの冒頭では原則として、

```sql
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
```

を指定してください。

変数も必要に応じて、

```sql
SET @app_key =
    CONVERT('hug-banso-navi' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_key =
    CONVERT('attendance_fetch_today_users' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;
```

としてください。

MariaDBで、

```text
Illegal mix of collations
```

を起こさないSQLにしてください。


# 23. DB登録SQLの基本形

例：

```sql
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';

START TRANSACTION;

SET @app_key =
    CONVERT('hug-banso-navi' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_key =
    CONVERT('example_flow' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_version = 1;

INSERT INTO web_automation_flows_v2 (
    app_key,
    flow_key,
    name,
    description,
    entry_file,
    entry_export,
    engine_version,
    config_json,
    timeout_ms,
    version,
    status,
    published_at
)
VALUES (
    @app_key,
    @flow_key,
    'サンプルFlow',
    'サンプル',
    'index.js',
    'default',
    1,
    JSON_OBJECT(),
    30000,
    @flow_version,
    'draft',
    NULL
);

SET @flow_id = LAST_INSERT_ID();

INSERT INTO web_automation_files_v2 (
    flow_id,
    file_path,
    file_type,
    source_text,
    module_type,
    content_hash,
    is_active
)
VALUES (
    @flow_id,
    'index.js',
    'javascript',
    'module.exports = async function (...) { ... };',
    'commonjs',
    SHA2(
      'module.exports = async function (...) { ... };',
      256
    ),
    1
);

COMMIT;
```

初回登録とversion追加を混同しないでください。

既存versionを消してよいのか、
新versionとして追加するのかを必ず確認してください。


# 24. 実行時入力値

実行時にしか分からない値をDBへ固定しないでください。

例：

```text
childId
facilityId
dateStr
recordId
sendMail
year
month
textValue
```

Rendererから、

```javascript
await executeFlowV2(
  flowKey,
  {
    childId,
    facilityId,
    dateStr,
  }
);
```

として渡します。

DB側JSでは、

```javascript
input.childId
input.facilityId
input.dateStr
```

として参照します。


# 25. DB側JSで避けるもの

以下は原則として避けてください。

```text
@/ 形式のVite alias import
ビルド時にしか存在しないimport
Electron Main APIへの直接アクセス
秘密鍵・API Keyの埋め込み
物理ファイルへの一時書き出し
renderer/srcへの実ファイル生成
```

DB側ファイル間参照は、

```javascript
await require("./fetch")
await require("./parse")
```

のような仮想requireを使用します。


# 26. DOMParserについて

Renderer側のDB JavaScriptでHTML解析する場合、

```javascript
const parser = new DOMParser();
```

を使用できます。

そのため、

```text
WebView
→ HTML取得
→ Renderer
→ DOMParserで解析
```

という処理をDB側仮想JSのみで構成できます。


# 27. WebView処理

WebView内でサイトCookieやDOMが必要な処理は、
`helpers.executeFunctionInWebview()` 等を使用します。

例：

```javascript
const webviewFunction = async (config) => {
  const response =
    await fetch(
      config.url,
      {
        credentials: "include",
      }
    );

  return {
    html:
      await response.text(),
  };
};

const result =
  await helpers.executeFunctionInWebview({
    functionText:
      webviewFunction.toString(),
    args: [config],
  });
```

WebView処理とRenderer処理を別テーブルStepで管理する必要はありません。

同じ仮想Flow内のJavaScriptが順番を管理します。


# 28. ログ

V2処理は、

```text
web_automation_execution_logs_v2
```

へ記録してください。

最低限、

```text
execution_uuid
flow_key
flow_version
entry_file
entry_export
input_json
result_json
status
error_code
error_message
started_at
finished_at
duration_ms
```

を保存します。

失敗時には、
ユーザーが原因を追える `error_message` を必ず返してください。


# 29. ログの定期削除

Laravelでは、

```text
app:clean-web-automation-logs
```

で、

```text
web_automation_execution_logs_v2
```

の14日以上前のログを削除します。

例：

```php
$deletedCount =
    DB::table(
        'web_automation_execution_logs_v2'
    )
    ->where(
        'started_at',
        '<=',
        now()->subDays(14)
    )
    ->delete();
```

スケジュール例：

```php
Schedule::command(
    'app:clean-web-automation-logs'
)
    ->dailyAt('03:30')
    ->withoutOverlapping();
```


# 30. 修正前に必ず確認するもの

V2移行を依頼されたら、コードを書き換える前に以下を確認してください。

### A. 現行Rendererコード

```text
処理開始関数
引数
戻り値
WebView
URL
fetch
POST
selector
DOM解析
HTML解析
MutationObserver
retry
timeout
成功判定
失敗判定
Redux更新
AppState更新
```

### B. 既存WebAutomationV2

```text
renderer/src/components/WebAutomationV2
executeFlowV2
moduleLoader
helpers
```

### C. Main / Preload

```text
webAutomationV2_getFlowBundle
executionLogStart
executionLogFinish
```

### D. Laravel V2

```text
Route
Controller
Model
Filament
Flow
Files
Memos
Logs
```

### E. DB

```text
web_automation_flows_v2
web_automation_files_v2
web_automation_flow_memos_v2
web_automation_execution_logs_v2
```


# 31. ChatGPTへ渡すファイル

V2化を依頼するときは、可能な限り以下を渡してください。

## 必須1：対象Rendererコード

今回V2化する処理一式。

呼び出し元も必要です。


## 必須2：WebAutomationV2共通基盤

```text
renderer/src/components/WebAutomationV2
```


## 必須3：Main / Preload

V2 IPC関連。


## 必須4：Laravel V2

```text
Route
Controller
Models
Filament Resources
```


## 必須5：DB SQL

少なくとも、

```text
web_automation_flows_v2
web_automation_files_v2
web_automation_flow_memos_v2
web_automation_execution_logs_v2
```

の構造が分かるSQL。


## 必須6：既に正常動作しているV2 Flow

可能であれば、
`attendance_fetch_today_users` 等の正常動作中V2を参考として渡してください。


# 32. ChatGPTに最初にやらせる解析

いきなり修正しないでください。

まず、

```text
現行処理
↓
V2化後
```

を比較してください。

最低限、

```text
1. 現行処理
2. DBへ移す処理
3. exe側へ残す処理
4. flow_key
5. 仮想ファイル構成
6. entry_file
7. helpersで必要な機能
8. Main/Preload変更の必要性
9. Laravel変更の必要性
10. SQLの概要
```

を整理してください。


# 33. V2化後の目標形

個別機能側：

```javascript
const result =
  await executeFlowV2(
    "example_flow",
    input
  );
```

DB：

```text
example_flow
├─ index.js
├─ fetch.js
├─ parse.js
└─ 必要に応じてその他.js
```

共通側：

```text
executeFlowV2
↓
Flow Bundle取得
↓
moduleLoader
↓
entry_file
↓
result
```


# 34. 禁止事項

以下は行わないでください。

- V2なのに新たにFlow → Step → Rule方式を作る
- `web_automation_steps_v2` を追加する
- `web_automation_parsers_v2` を復活させる
- `web_automation_scripts_v2` を別途追加する
- DB仮想JSを物理ファイルとしてrenderer/srcへ書き出す
- app.asar内へ実行時ファイルを書き込む
- DB側JSでVite alias importを前提にする
- 同じselectorやURLをRendererとDBへ二重定義する
- 既存V2 IPCがあるのに同じ用途の別IPCを作る
- 管理者以外がsource_textを変更できるAPIを作る
- 通常実行APIからdraft Flowを返す
- V1処理を理由なく削除する
- DB AUTO_INCREMENT IDを根拠なく決め打ちする
- 本番DBの既存versionを確認せずDELETEする
- 正常動作中の処理を推測だけで変更する


# 35. 最終的に提出するもの

V2化作業では、必要に応じて以下を提出してください。

### 1. 現状分析

現在の処理フロー。


### 2. V2設計

```text
UI
→ executeFlowV2
→ DB Flow Bundle
→ moduleLoader
→ entry_file
→ WebView / Renderer処理
→ result
```


### 3. DB登録SQL

そのまま実行可能なSQL。


### 4. DB仮想JSファイル

例：

```text
index.js
fetch.js
parse.js
```


### 5. Renderer修正版

個別機能を `executeFlowV2()` 呼び出しへ変更。


### 6. Main / Preload修正版

必要な場合のみ。


### 7. Laravel修正版

必要な場合のみ。


### 8. 変更ファイル一覧

例：

```text
変更:
- xxx.js

新規:
- xxx.js

変更不要:
- preload.js
```


### 9. 動作確認方法

具体的な確認手順。


# 36. 今回の具体的な依頼テンプレート

今回V2化したい対象：

```text
【ここに対象を書く】
```

現在の実装：

```text
【対象Rendererファイルを添付】
```

WebAutomationV2：

```text
【renderer/src/components/WebAutomationV2 を添付】
```

Main / Preload：

```text
【関連ファイルを添付】
```

Laravel：

```text
【Route / Controller / Model / Filamentを添付】
```

DB：

```text
【V2関連テーブルを含むSQLを添付】
```

参考になる正常動作中V2：

```text
【attendance_fetch_today_users等を添付】
```

まずコードを書き換える前に、

```text
1. 現行処理
2. DBへ移す処理
3. exeへ残す処理
4. 使用するflow_key
5. 仮想JSファイル構成
6. entry_file / entry_export
7. helpersで必要な機能
8. Main / Preload変更の必要性
9. Laravel変更の必要性
10. 作成するSQLの概要
```

を提示してください。

その分析後、
SQL・DB仮想JS・Renderer修正版を作成してください。


# 37. 重要な設計方針

WebAutomation V2の目的は、

```text
サイト仕様変更
↓
管理者がDB上のFlow / JSファイルを変更
↓
published
↓
各Electronアプリが次回実行時に取得
↓
アプリ再配布なしで反映
```

です。

したがって、

```text
変更頻度が高い業務処理
→ DB

共通実行基盤
→ Electronアプリ
```

という境界を崩さないでください。
