import { useMemo } from 'react'

import CopyButton from '@/components/ui/CopyButton'

const SUMMARY_TEXT = `Web自動化設定は、Admin/WebAutomation 配下で管理しています。
対象DBは web_automation_rules / web_automation_flows / web_automation_flow_steps の3テーブルです。
renderer は window.electronAPI の laravel_webAutomationRules_getAll / laravel_webAutomationRule_get / laravel_webAutomationRule_update / laravel_webAutomationFlows_getAll / laravel_webAutomationFlow_get を使います。
入退室処理は attendance_enter / attendance_leave Flowを取得し、Stepに紐づくRuleのconfig_jsonとStepのinput_jsonを使ってPOST内容を組み立てます。
Rule更新は config_json のJSON形式を崩さないこと、app_key と webview_key のScopeを合わせることが重要です。`

const FULL_INSTRUCTION_TEXT = `# Hug Banso Web自動化 管理画面の構成

## 目的
ChatGPTに修正相談するときは、この指示書を貼り付けてから、修正したい内容を伝えます。
この画面は管理者だけが使う想定で、web_automation_rules / web_automation_flows / web_automation_flow_steps を確認・編集するための画面です。

## 配置
renderer/src/components/SettingsModal/tabs/Admin/WebAutomation

主な構成:
- index.jsx
  - WebAutomation全体の入口です。
  - WebAutomationInstruction と AutomationRulesTab を表示します。
- components/WebAutomationInstruction.jsx
  - ChatGPTへ構成を伝えるための指示書コンポーネントです。
- AutomationRulesTab/index.jsx
  - Rules / Flows の取得、表示、Rule更新を担当します。

## DBテーブル

### web_automation_rules
1つの自動化処理の実体です。
主に onclick解析、POST先、POSTデータ生成ルール、DOM取得ルールなどを config_json に持ちます。

主な項目:
- app_key
- webview_key
- rule_key
- name
- category
- action_type
- target_url_pattern
- target_selector
- parser_type
- function_name
- config_json
- is_active
- sort_order
- version

### web_automation_flows
複数Stepを束ねるフローです。
入室なら attendance_enter、退室なら attendance_leave を使います。

主な項目:
- app_key
- webview_key
- flow_key
- name
- trigger_type
- target_url_pattern
- config_json
- is_active
- version

### web_automation_flow_steps
Flow内の実行順を管理します。
StepはRuleと紐づき、input_json で childId / facilityId / date / isMail などをRuleへ渡します。

主な項目:
- flow_id
- rule_id
- step_key
- step_order
- step_type
- name
- input_json
- config_json
- is_active

## 入退室で使うFlow

### attendance_enter
入室処理です。
StepからRuleへ以下の値を渡す想定です。

{
  "childId": "{{childId}}",
  "facilityId": "{{facilityId}}",
  "date": "{{date}}",
  "isMail": "{{isMail}}"
}

### attendance_leave
退室処理です。
StepからRuleへ以下の値を渡す想定です。

{
  "childId": "{{childId}}",
  "facilityId": "{{facilityId}}",
  "date": "{{date}}",
  "isMail": "{{isMail}}"
}

## rendererから使うelectronAPI

取得:
- window.electronAPI.laravel_webAutomationRules_getAll(params)
- window.electronAPI.laravel_webAutomationRule_get(ruleKey, params)
- window.electronAPI.laravel_webAutomationFlows_getAll(params)
- window.electronAPI.laravel_webAutomationFlow_get(flowKey, params)

更新:
- window.electronAPI.laravel_webAutomationRule_update(ruleKey, data, params)

params は基本的に以下です。
{
  app_key: "hug-banso-navi",
  webview_key: "*"
}

## 編集時の注意点

1. config_json は必ず正しいJSONにしてください。
2. app_key / webview_key のScopeが一致しないと取得できません。
3. Flowはこの画面では参照のみ、Ruleは更新可能です。
4. 入退室処理はメール通知あり/なしを isMail または mail_flg として扱います。
5. 既存の入退室が止まらないよう、renderer側の実行処理ではDB Flow取得失敗時に旧POSTへフォールバックする構成にしています。
6. main/preloadには Rules取得、Rule更新、Flows取得のIPC導線が必要です。

## ChatGPTへ依頼するときの例

以下の構成で修正してください。
- Admin/WebAutomation配下の管理画面です。
- web_automation_rules / web_automation_flows / web_automation_flow_steps を使います。
- Ruleは更新可能、Flowは参照のみです。
- rendererからは window.electronAPI.laravel_webAutomationRule_update を使って保存します。
- config_json はJSON形式を維持してください。

依頼内容:
ここに修正したい内容を書く。
`

function CodeBlock({ children }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-100">
      {children}
    </pre>
  )
}

export default function WebAutomationInstruction() {
  const fullText = useMemo(
    () => FULL_INSTRUCTION_TEXT,
    [],
  )

  return (
    <details className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-gray-800" open>
      <summary className="cursor-pointer select-none text-base font-semibold text-amber-900">
        ChatGPT修正用 指示書
      </summary>

      <div className="mt-3 space-y-4">
        <p className="text-sm leading-6 text-amber-900">
          Web自動化の編集機能をChatGPTに相談しながら修正するための説明です。
          相談時は下の要約、または全文をコピーして貼り付けてください。
        </p>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
            <span className="text-xs font-semibold text-blue-700">
              要約
            </span>
            <CopyButton
              text={SUMMARY_TEXT}
              title="要約をコピー"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 transition-opacity hover:opacity-75"
              fontStyle="text-blue-700"
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
            <span className="text-xs font-semibold text-blue-700">
              指示書全文
            </span>
            <CopyButton
              text={fullText}
              title="指示書全文をコピー"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 transition-opacity hover:opacity-75"
              fontStyle="text-blue-700"
            />
          </div>
        </div>

        <section className="rounded-lg border border-amber-200 bg-white p-3">
          <h4 className="mb-2 font-semibold text-gray-800">
            要約
          </h4>
          <CodeBlock>{SUMMARY_TEXT}</CodeBlock>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <h4 className="font-semibold text-gray-800">
              web_automation_rules
            </h4>
            <p className="mt-2 text-xs leading-5 text-gray-600">
              1つの自動化処理の実体です。onclick解析、POST設定、DOM取得などを
              config_jsonで管理します。この画面ではRuleを更新できます。
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <h4 className="font-semibold text-gray-800">
              web_automation_flows
            </h4>
            <p className="mt-2 text-xs leading-5 text-gray-600">
              複数Stepをまとめるフローです。入室はattendance_enter、退室はattendance_leaveを使います。
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <h4 className="font-semibold text-gray-800">
              web_automation_flow_steps
            </h4>
            <p className="mt-2 text-xs leading-5 text-gray-600">
              Flow内の順番とRuleへの入力値を管理します。input_jsonでchildId、date、isMailなどを渡します。
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-3">
          <h4 className="mb-2 font-semibold text-gray-800">
            rendererから必要なelectronAPI
          </h4>
          <CodeBlock>{`window.electronAPI.laravel_webAutomationRules_getAll(params)
window.electronAPI.laravel_webAutomationRule_get(ruleKey, params)
window.electronAPI.laravel_webAutomationRule_update(ruleKey, data, params)
window.electronAPI.laravel_webAutomationFlows_getAll(params)
window.electronAPI.laravel_webAutomationFlow_get(flowKey, params)`}</CodeBlock>
        </section>
      </div>
    </details>
  )
}
