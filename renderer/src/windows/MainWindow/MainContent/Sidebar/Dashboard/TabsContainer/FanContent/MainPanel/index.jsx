import { FAN_CONTENT_PANELS, useAppState } from '@/AppStateContext'
import PersonalRecordManagerPanel2 from '@/components/common/hug_function/PersonalRecordManagerPanel2'
import AiContents from './AiContents'
import ChildKadai from './ChildKadai'

export default function MainPanel() {
  const { activeFanContentPanel, USE_AI } = useAppState()


  const aiNameMap = {
    gemini: 'Gemini',
    chatGPT: 'ChatGPT',
    ollama: 'Ollama',
    deepseek: 'DeepSeek',
    openrouter: 'OpenRouter',
  }

  const aiName = aiNameMap[USE_AI] || '未選択'

  const modeName =
    activeFanContentPanel === FAN_CONTENT_PANELS.AI_SUPPORT
      ? 'AI支援'
      : activeFanContentPanel === FAN_CONTENT_PANELS.CHILD_KADAI
        ? '児童課題'
        : activeFanContentPanel === FAN_CONTENT_PANELS.PERSONAL_RECORD
          ? '個人記録'
          : '未選択'

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden" aria-label="メインパネル">
      <header className="shrink-0 border-b border-gray-200 bg-gray-50 px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tracking-wide text-gray-500">モード</span>
            <span className="text-lg font-bold text-gray-900">{modeName}</span>
          </div>

          {activeFanContentPanel === FAN_CONTENT_PANELS.AI_SUPPORT && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-xs font-semibold tracking-wide text-gray-500">
                使用AI
              </span>
              <span className="truncate text-sm font-bold text-gray-800">
                {aiName}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white" role="tabpanel">
        {activeFanContentPanel === FAN_CONTENT_PANELS.AI_SUPPORT && (
          <AiContents />
        )}

        {activeFanContentPanel === FAN_CONTENT_PANELS.CHILD_KADAI && (
          <ChildKadai />
        )}

        {activeFanContentPanel === FAN_CONTENT_PANELS.PERSONAL_RECORD && (
          <PersonalRecordManagerPanel2 />
        )}
      </div>
    </section>
  )
}
