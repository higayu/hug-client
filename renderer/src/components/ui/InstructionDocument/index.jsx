import { Download } from 'lucide-react'
import { saveAs } from 'file-saver'

import CopyButton from '@/components/ui/CopyButton'
import { useToast } from '@/provider/ToastProvider/ToastContext.jsx'

export default function InstructionDocument({
  title = '指示書',
  text,
  filename = 'instruction.md',
}) {
  const { showSuccessToast, showErrorToast } = useToast()
  const hasText = typeof text === 'string' && Boolean(text.trim())
  const buttonClass = 'inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100'

  const handleExport = () => {
    try {
      saveAs(new Blob([text], { type: 'text/markdown;charset=utf-8' }), filename)
      showSuccessToast('指示書の出力を開始しました')
    } catch (error) {
      console.error('[InstructionDocument] 出力エラー:', error)
      showErrorToast('指示書の出力に失敗しました')
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {hasText && (
          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={text}
              title="指示書全文をコピー"
              className={buttonClass}
              fontStyle="text-blue-700"
            />
            <button type="button" onClick={handleExport} className={buttonClass}>
              <Download size={16} aria-hidden="true" />
              Markdown出力
            </button>
          </div>
        )}
      </div>
      {hasText ? (
        <details>
          <summary className="cursor-pointer text-sm text-gray-600">指示書全文を表示</summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 text-xs leading-6 text-gray-700">
            {text}
          </pre>
        </details>
      ) : (
        <p className="text-sm text-gray-500">指示書がありません。</p>
      )}
    </section>
  )
}
