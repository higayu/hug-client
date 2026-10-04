import { Download } from 'lucide-react'
import { saveAs } from 'file-saver'

import CopyButton from '@/components/ui/CopyButton'
import { useToast } from '@/provider/ToastProvider/ToastContext.jsx'

// webAuto.md をこのコンポーネントと同じフォルダに配置する想定
import FULL_INSTRUCTION_TEXT from '@/assets/md/webAuto.md?raw'

const SUMMARY_TEXT = `Web自動化設定は、Admin/WebAutomation 配下で管理しています。
対象DBは web_automation_rules / web_automation_flows / web_automation_flow_steps の3テーブルです。
renderer は window.electronAPI の laravel_webAutomationRules_getAll / laravel_webAutomationRule_get / laravel_webAutomationRule_update / laravel_webAutomationFlows_getAll / laravel_webAutomationFlow_get を使います。
DB駆動処理は Flow → FlowStep → Rule の順に取得し、Stepのinput_jsonで実行時入力を渡し、Ruleのconfig_jsonに従って共通executorで実行します。
Rule更新は config_json のJSON形式を崩さないこと、app_key と webview_key のScopeを合わせることが重要です。`

const BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100'

function CodeBlock({ children, className = '' }) {
  return (
    <pre
      className={`max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-950 p-3 text-xs leading-6 text-slate-100 ${className}`}
    >
      {children}
    </pre>
  )
}

export default function WebAutomationInstruction({
  title = 'ChatGPT修正用 指示書',
  filename = 'webAuto.md',
}) {
  const { showSuccessToast, showErrorToast } = useToast()

  const hasInstruction =
    typeof FULL_INSTRUCTION_TEXT === 'string' &&
    Boolean(FULL_INSTRUCTION_TEXT.trim())

  const handleExport = () => {
    if (!hasInstruction) {
      showErrorToast('出力する指示書がありません')
      return
    }

    try {
      saveAs(
        new Blob([FULL_INSTRUCTION_TEXT], {
          type: 'text/markdown;charset=utf-8',
        }),
        filename,
      )
      showSuccessToast('指示書の出力を開始しました')
    } catch (error) {
      console.error('[WebAutomationInstruction] 出力エラー:', error)
      showErrorToast('指示書の出力に失敗しました')
    }
  }

  return (
    <details
      className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-gray-800"
      open
    >
      <summary className="cursor-pointer select-none text-base font-semibold text-amber-900">
        {title}
      </summary>

      <div className="mt-3 space-y-4">
        <p className="text-sm leading-6 text-amber-900">
          Web自動化のDB駆動化や修正をChatGPTへ依頼するときに使用する指示書です。
          要約だけをコピーすることも、完全版をコピー・Markdown出力することもできます。
        </p>

        <div className="flex flex-wrap gap-2">
          <CopyButton
            text={SUMMARY_TEXT}
            title="要約をコピー"
            className={BUTTON_CLASS}
            fontStyle="text-blue-700"
          />

          {hasInstruction && (
            <>
              <CopyButton
                text={FULL_INSTRUCTION_TEXT}
                title="指示書全文をコピー"
                className={BUTTON_CLASS}
                fontStyle="text-blue-700"
              />

              <button
                type="button"
                onClick={handleExport}
                className={BUTTON_CLASS}
              >
                <Download size={16} aria-hidden="true" />
                Markdown出力
              </button>
            </>
          )}
        </div>

        <section className="rounded-lg border border-amber-200 bg-white p-3">
          <h4 className="mb-2 font-semibold text-gray-800">要約</h4>
          <CodeBlock>{SUMMARY_TEXT}</CodeBlock>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <h4 className="font-semibold text-gray-800">
              web_automation_rules
            </h4>
            <p className="mt-2 text-xs leading-5 text-gray-600">
              1つの自動化処理の実体です。対象URL、selector、action_type、
              parser、config_jsonなど、実際のWebView操作定義を管理します。
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <h4 className="font-semibold text-gray-800">
              web_automation_flows
            </h4>
            <p className="mt-2 text-xs leading-5 text-gray-600">
              複数Stepをまとめる処理全体の入口です。rendererからは基本的に
              flow_keyを指定して処理を開始します。
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <h4 className="font-semibold text-gray-800">
              web_automation_flow_steps
            </h4>
            <p className="mt-2 text-xs leading-5 text-gray-600">
              Flow内の実行順とRuleへの入力値を管理します。input_jsonで
              childId、facilityId、date、textValueなどを渡します。
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

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-gray-800">指示書全文</h4>
              <p className="mt-1 text-xs text-gray-500">
                webAuto.md の内容をそのまま表示しています。
              </p>
            </div>

            {hasInstruction && (
              <div className="flex flex-wrap gap-2">
                <CopyButton
                  text={FULL_INSTRUCTION_TEXT}
                  title="指示書全文をコピー"
                  className={BUTTON_CLASS}
                  fontStyle="text-blue-700"
                />

                <button
                  type="button"
                  onClick={handleExport}
                  className={BUTTON_CLASS}
                >
                  <Download size={16} aria-hidden="true" />
                  Markdown出力
                </button>
              </div>
            )}
          </div>

          {hasInstruction ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-gray-600">
                指示書全文を表示
              </summary>
              <CodeBlock className="mt-3">
                {FULL_INSTRUCTION_TEXT}
              </CodeBlock>
            </details>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              指示書がありません。
            </p>
          )}
        </section>
      </div>
    </details>
  )
}
