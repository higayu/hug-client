import { Download } from 'lucide-react'
import { saveAs } from 'file-saver'

import CopyButton from '@/components/ui/CopyButton'
import { useToast } from '@/provider/ToastProvider/ToastContext.jsx'

import FULL_INSTRUCTION_TEXT from '@/assets/md/webAuto.md?raw'

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
        </p>

        {hasInstruction ? (
          <>
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

            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <details>
                <summary className="cursor-pointer select-none text-sm font-semibold text-gray-700">
                  指示書全文を表示
                </summary>

                <CodeBlock className="mt-3">
                  {FULL_INSTRUCTION_TEXT}
                </CodeBlock>
              </details>
            </section>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            指示書がありません。
          </p>
        )}
      </div>
    </details>
  )
}