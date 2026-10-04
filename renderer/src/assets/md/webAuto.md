# Electron WebView処理 DB駆動化 指示書

## 1. この依頼の目的

現在 renderer 内にハードコードされている WebView 操作処理を、既存の `web_automation_*` テーブルを使用したDB駆動方式へ変更してください。

目的は、今後以下の内容をソースコードを変更せずDB側から変更できるようにすることです。

- 対象URL
- CSSセレクタ
- 実行方式
- fetch / POST 設定
- DOM操作設定
- parser設定
- タイムアウト
- 実行順序
- 各種オプション
- サイト側JavaScript関数名

ただし、DBへJavaScriptコード全文を保存して `eval` するような構成にはしないでください。

既存アプリに存在する共通executorを使用し、

**DB = 処理定義**
**renderer = 汎用実行エンジン**

という構成を維持してください。


# 2. 既存DB構成

このプロジェクトでは、WebView自動処理を基本的に次の3テーブルで管理しています。

## web_automation_flows

処理全体を定義します。

主な項目：

- `app_key`
- `webview_key`
- `flow_key`
- `name`
- `description`
- `trigger_type`
- `target_url_pattern`
- `config_json`
- `is_active`
- `version`

`flow_key` が renderer から処理を呼び出す際の基本的な識別子です。


## web_automation_flow_steps

1つのflowに含まれる処理の実行順序を定義します。

主な項目：

- `flow_id`
- `rule_id`
- `step_order`
- `step_key`
- `step_type`
- `input_json`
- `config_json`
- `continue_on_error`
- `is_active`

実行時にrendererから渡された値は、

```text
{{childId}}
{{facilityId}}
{{date}}
{{textValue}}
```

などのテンプレート変数として `input_json` や rule の設定へ引き渡します。


## web_automation_rules

実際にWebView上で何をするかを定義します。

主な項目：

- `rule_key`
- `name`
- `category`
- `action_type`
- `target_url_pattern`
- `target_selector`
- `parser_type`
- `function_name`
- `config_json`
- `is_active`
- `sort_order`
- `version`

例えば、

```text
action_type = fetch
action_type = click
action_type = post
action_type = webview-fetch
```

など、既存executorが対応している実行方式を使用します。


# 3. 最初に確認すること

コードを変更する前に、添付されたファイルを解析して以下を整理してください。

### A. 現在ハードコードされている処理

以下を具体的に抽出してください。

- 処理開始関数
- rendererから渡されている引数
- 使用しているWebView
- 対象ドメイン
- 対象URL
- editor/inputのselector
- buttonのselector
- fetch URL
- POST URL
- HTTP method
- request body
- CSRF処理
- DOM操作
- MutationObserver
- retry処理
- timeout処理
- 成功判定
- エラー判定
- 戻り値

特に `executeJavaScript()` 内に直接書かれている値を確認してください。


### B. 既存DB駆動処理

添付した正常動作中のDB駆動処理を参考にしてください。

最低でも以下を確認してください。

```text
renderer
 ↓
flow_key指定
 ↓
flow取得
 ↓
flow_steps取得
 ↓
rule取得
 ↓
input_jsonのテンプレート展開
 ↓
action_typeに対応したexecutor
 ↓
WebView操作
 ↓
result
 ↓
rendererへ返却
```

新しい独自方式を作るのではなく、可能な限り既存方式へ合わせてください。


# 4. DBへ移すもの / rendererへ残すもの

## DBへ移すもの

原則として変更可能性のある設定値はDBへ移してください。

例：

```text
対象ドメイン
対象URL
CSS selector
selector候補
functionName
timeout
pollInterval
MutationObserver設定
入力フィールド
送信ボタンselector
fallback selector
response解析設定
```

例えば現在rendererに、

```javascript
const EDITOR_SELECTORS = [
  'textarea[name="search"]',
  'textarea[placeholder*="DeepSeek"]',
  'textarea',
  '[contenteditable="true"][role="textbox"]'
];
```

と書かれている場合、可能ならruleの `config_json` へ移します。

例：

```json
{
  "editorSelectors": [
    "textarea[name=\"search\"]",
    "textarea[placeholder*=\"DeepSeek\"]",
    "textarea",
    "[contenteditable=\"true\"][role=\"textbox\"]"
  ]
}
```


## rendererへ残すもの

以下のような汎用ロジックはrenderer側に残してください。

- WebView取得
- DBからflow/ruleを取得
- `{{variable}}` 展開
- executeJavaScript実行
- textareaへの値設定
- contenteditableへの値設定
- click処理
- MutationObserver処理
- fetch実行
- POST実行
- retry
- timeout
- 標準エラー処理
- 実行ログ保存

つまり、

```text
何を操作するか → DB

どう操作するか → 共通executor
```

にしてください。


# 5. 今回ChatGPTへ渡す必要があるファイル

DB駆動化を依頼するときは、原則として以下を添付します。


## 必須1：DB定義

現在の以下のテーブルを含むSQLを渡してください。

```text
web_automation_flows
web_automation_flow_steps
web_automation_rules
web_automation_execution_logs
```

できれば既存データも含めてください。

CREATE TABLEだけではなく、

**正常に動いている既存flow/rule/stepのINSERTデータも必要です。**


## 必須2：今回DB化するrendererコード

例えば、

```text
sendPromptToDeepSeek.js
sendPromptToChatGPT.js
sendPromptToGemini.js
```

など、現在実際に処理しているコードをすべて渡してください。

呼び出し元も必要です。

例えば、

```text
DeepSeekContent/index.jsx
PromptPanel
ProfessionalPrompt1
ProfessionalPrompt2
```

などです。


## 必須3：正常動作しているDB駆動処理

今回の実装方式の見本として、

```text
AttendanceAction
```

など、すでにDB駆動化済みで正常に動作しているものを渡してください。

これは非常に重要です。

ChatGPTが独自の設計を新しく作るのではなく、

**「このプロジェクトではどのようにDB駆動処理を書くのか」**

を判断するために使用します。


## 必須4：Web Automation共通実行処理

以下に該当するファイルも渡してください。

名称は実際のプロジェクトに合わせてください。

- flow取得処理
- rule取得処理
- flow step取得処理
- flow executor
- rule executor
- template変数展開処理
- executeJavaScript共通処理
- execution log保存処理


## 必須5：preload

DB情報をrendererへ公開しているpreload処理を渡してください。

例えば、

```javascript
contextBridge.exposeInMainWorld(...)
```

で

```text
web-automation-rules:list
web-automation-rules:get
web-automation-flows:list
web-automation-flows:get
```

などを公開している部分です。


## 必須6：main側IPC

DBアクセスを登録しているmain側処理を渡してください。

例えば、

```text
ipcMain.handle(...)
```

で、

```text
web-automation-rules:list
web-automation-rules:get
web-automation-flows:list
web-automation-flows:get
execution-logs:create
execution-logs:update
```

などを処理している箇所です。


# 6. ChatGPTに最初にやらせる解析

いきなりコードを書き換えないでください。

最初に、

## 現行処理

```text
UI
 ↓
renderer関数
 ↓
WebView
 ↓
対象サイト
```

## DB駆動化後

```text
UI
 ↓
flow_key
 ↓
DB flow
 ↓
flow_steps
 ↓
rule
 ↓
共通executor
 ↓
WebView
 ↓
対象サイト
```

を比較して提示してください。

そして、

### DBへ移す値

### rendererへ残す処理

### 新しく共通化する必要がある処理

### 既存executorだけで対応できる処理

を分類してください。


# 7. SQL作成ルール

DB登録SQLを作成してください。

ただし、可能な限りDBの固定IDを直接指定しないでください。

例えば、

```sql
flow_id = 25
rule_id = 31
```

のような依存は避けます。

基本的には、

```sql
SELECT id
FROM web_automation_flows
WHERE app_key = 'hug-banso-navi'
  AND webview_key = '*'
  AND flow_key = 'xxxx';
```

のようにキーからIDを取得してください。


# 8. 推奨SQL形式

以下のようにトランザクション化してください。

```sql
START TRANSACTION;
```

まずruleを登録します。

```sql
INSERT INTO web_automation_rules (
    app_key,
    webview_key,
    rule_key,
    name,
    category,
    action_type,
    target_url_pattern,
    target_selector,
    parser_type,
    function_name,
    config_json,
    is_active,
    sort_order,
    version
)
VALUES (
    'hug-banso-navi',
    '*',
    'example_rule',
    'サンプル処理',
    'example',
    'webview-execute',
    'https://example.com/*',
    NULL,
    NULL,
    NULL,
    JSON_OBJECT(),
    1,
    100,
    1
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category = VALUES(category),
    action_type = VALUES(action_type),
    target_url_pattern = VALUES(target_url_pattern),
    target_selector = VALUES(target_selector),
    parser_type = VALUES(parser_type),
    function_name = VALUES(function_name),
    config_json = VALUES(config_json),
    is_active = VALUES(is_active),
    version = version + 1;
```

次にrule IDを取得します。

```sql
SET @rule_id = (
    SELECT id
    FROM web_automation_rules
    WHERE app_key = 'hug-banso-navi'
      AND webview_key = '*'
      AND rule_key = 'example_rule'
    LIMIT 1
);
```

flowを登録します。

```sql
INSERT INTO web_automation_flows (
    app_key,
    webview_key,
    flow_key,
    name,
    description,
    trigger_type,
    target_url_pattern,
    config_json,
    is_active,
    version,
    created_at,
    updated_at
)
VALUES (
    'hug-banso-navi',
    '*',
    'example_flow',
    'サンプルフロー',
    'DB駆動によるサンプル処理',
    'manual',
    'https://example.com/*',
    JSON_OBJECT(),
    1,
    1,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    trigger_type = VALUES(trigger_type),
    target_url_pattern = VALUES(target_url_pattern),
    config_json = VALUES(config_json),
    is_active = VALUES(is_active),
    version = version + 1,
    updated_at = NOW();
```

flow IDを取得します。

```sql
SET @flow_id = (
    SELECT id
    FROM web_automation_flows
    WHERE app_key = 'hug-banso-navi'
      AND webview_key = '*'
      AND flow_key = 'example_flow'
    LIMIT 1
);
```

flow stepを登録します。

```sql
INSERT INTO web_automation_flow_steps (
    flow_id,
    rule_id,
    step_order,
    step_key,
    name,
    step_type,
    input_json,
    config_json,
    continue_on_error,
    is_active,
    created_at,
    updated_at
)
VALUES (
    @flow_id,
    @rule_id,
    10,
    'execute_example',
    'サンプル処理実行',
    'rule',
    JSON_OBJECT(
        'textValue', '{{textValue}}'
    ),
    JSON_OBJECT(),
    0,
    1,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    rule_id = VALUES(rule_id),
    step_key = VALUES(step_key),
    name = VALUES(name),
    step_type = VALUES(step_type),
    input_json = VALUES(input_json),
    config_json = VALUES(config_json),
    continue_on_error = VALUES(continue_on_error),
    is_active = VALUES(is_active),
    updated_at = NOW();
```

最後に、

```sql
COMMIT;
```

してください。


# 9. SQL作成時の重要事項

既存DBには、

```text
UNIQUE(app_key, webview_key, flow_key)
```

```text
UNIQUE(app_key, webview_key, rule_key)
```

```text
UNIQUE(flow_id, step_order)
```

があります。

そのため、それを前提にSQLを作ってください。

既存データがある場合に重複INSERTで失敗しないSQLにしてください。


# 10. config_jsonの設計

意味のある単位でJSONを構造化してください。

悪い例：

```json
{
  "selector1": "...",
  "selector2": "...",
  "selector3": "...",
  "value1": "...",
  "value2": "..."
}
```

できるだけ、

```json
{
  "editor": {
    "selectors": [],
    "type": "textarea-or-contenteditable"
  },
  "sendButton": {
    "selectors": [],
    "fallback": "svg-path"
  },
  "wait": {
    "timeoutMs": 10000,
    "intervalMs": 100
  }
}
```

のように役割ごとに整理してください。


# 11. 実行時入力値

処理実行時にしか分からない値をDBへ固定しないでください。

例えば、

```text
児童ID
施設ID
日付
入力文章
recordId
sendMail
year
month
```

などです。

これらはrendererから、

```javascript
{
  childId,
  facilityId,
  date,
  textValue
}
```

のようにflowへ渡します。

DB側では、

```json
{
  "childId": "{{childId}}",
  "facilityId": "{{facilityId}}",
  "date": "{{date}}",
  "textValue": "{{textValue}}"
}
```

のように参照してください。


# 12. flow / step / rule の設定優先順位

既存コードを調査し、

```text
flow.config_json
step.config_json
rule.config_json
```

をマージしている場合は、その優先順位を必ず確認してください。

勝手に優先順位を変更しないでください。

例えば同じ

```text
detectMailDialog
```

が複数階層に存在する場合、

実際のexecutorがどの値を採用するかを確認してからSQLを作ってください。


# 13. renderer側の目標形

最終的に個別機能側では、できるだけ次の程度にしてください。

```javascript
export async function sendSomething({
  textValue,
}) {
  return executeWebAutomationFlow({
    flowKey: 'xxxx',
    input: {
      textValue,
    },
  });
}
```

個別機能側へ、

```javascript
const selectors = [...]
const timeout = 10000
const targetUrl = ...
```

などを再度ハードコードしないでください。


# 14. ただし無理にDB化しないこと

既存executorでは表現できず、新しい汎用機能を追加する必要がある場合は、

DBへ巨大なJavaScript文字列を保存するのではなく、

renderer側の共通executorへ新しい実行タイプを追加してください。

例えば、

```text
ai-prompt-send
dom-input-and-click
wait-for-element
click
fetch
post
```

のような汎用executorです。

そしてDBから、

```json
{
  "editorSelectors": [],
  "sendButtonSelectors": []
}
```

を渡してください。


# 15. ログ

DB駆動処理は既存の

```text
web_automation_execution_logs
```

へ実行結果を保存してください。

最低限、

```text
execution_uuid
flow_id
flow_key
flow_step_id
step_key
rule_id
rule_key
webview_id
target_url
action_type
input_json
result_json
debug_json
status
error_code
error_message
started_at
finished_at
duration_ms
```

を既存方式に合わせて保存してください。

既存ログ処理がある場合、新しい独自ログ方式は作らないでください。


# 16. 修正後の確認

以下を確認してください。

1. DBに必要なflow/rule/stepが存在する
2. rendererからflow_keyで取得できる
3. stepのrule_idが正しく紐付いている
4. input変数が展開される
5. 対象WebViewが正しい
6. 対象URLチェックが機能する
7. DOM selectorがDBから取得される
8. 処理成功結果がrendererへ戻る
9. 失敗時に理由が分かる
10. execution_logsへ記録される
11. DBのselectorを変更するとrendererを変更せず反映される


# 17. 最終的に提出するもの

以下をすべて作成してください。

### 1. 現状分析

現在のハードコード処理がどのように動いているか。


### 2. DB駆動化設計

```text
UI
→ renderer
→ flow
→ flow_steps
→ rule
→ executor
→ WebView
```

の流れ。


### 3. DB登録SQL

そのまま実行できる完全なSQL。


### 4. renderer修正版

今回変更が必要なファイルをすべて修正。


### 5. main/preload修正版

必要な場合のみ変更。

既存IPCで足りる場合は変更しない。


### 6. 新規共通executor

既存executorでは対応できない場合のみ作成。


### 7. 変更ファイル一覧

```text
変更:
- xxx.js
- xxx.jsx

新規:
- xxx.js

変更不要:
- preload.js
- main.js
```

という形で提示。


### 8. 動作確認方法

具体的な確認手順。


# 18. 禁止事項

以下は行わないでください。

- 正常動作している既存DB駆動処理を全面的に作り直す
- DBのAUTO_INCREMENT IDを根拠なく決め打ちする
- DBへ巨大なJavaScriptコード全文を保存する
- `eval` を前提にする
- rendererとDBへ同じselectorを二重定義する
- 既存IPCがあるのに別IPCを新設する
- 既存executorがあるのに同じ処理を再実装する
- DB化したはずの設定値をrendererへ残す
- 現在正常に動作している処理を推測だけで変更する


# 19. 今回の具体的な依頼

今回DB駆動化したい対象は以下です。

【ここに対象を書く】

例：

```text
DeepSeekへのプロンプト送信処理
```

現在の実装：

【対象ファイルを添付】

正常に動いているDB駆動実装：

【AttendanceActionなどを添付】

DB：

【web_automation関連テーブルを含むSQLを添付】

main/preload/共通executor：

【関連コードを添付】


まずコードを書き換える前に、

1. 現行処理
2. DBへ移す設定
3. rendererへ残す処理
4. 使用するflow_key
5. 使用するrule_key
6. 必要なaction_type
7. 既存executorで対応可能か
8. main/preload変更の必要性
9. 作成するSQLの概要

を整理して提示してください。

その分析後、実際のSQLと修正版コードを作成してください。

# 20. 管理画面の配置と renderer API

## 管理画面の配置

Web自動化の管理画面は以下に配置しています。

```text
renderer/src/components/SettingsModal/tabs/Admin/WebAutomation
```

この画面は、Web自動化設定の確認・編集と、ChatGPTへ渡すDB駆動化指示書のコピー／Markdown出力に使用します。


## renderer から使用する electronAPI

Web自動化のRule / Flowを取得・更新するときは、既存の以下のAPIを使用します。

### Rule

```javascript
window.electronAPI.laravel_webAutomationRules_getAll(params)
window.electronAPI.laravel_webAutomationRule_get(ruleKey, params)
window.electronAPI.laravel_webAutomationRule_update(ruleKey, data, params)
```

### Flow

```javascript
window.electronAPI.laravel_webAutomationFlows_getAll(params)
window.electronAPI.laravel_webAutomationFlow_get(flowKey, params)
```

基本的なscopeは以下です。

```javascript
const params = {
  app_key: 'hug-banso-navi',
  webview_key: '*',
}
```

既存APIで対応できる場合、新しいIPCや別APIを追加しないでください。

main / preload を変更する前に、上記APIと既存のWeb自動化共通処理で対応できないか確認してください。
