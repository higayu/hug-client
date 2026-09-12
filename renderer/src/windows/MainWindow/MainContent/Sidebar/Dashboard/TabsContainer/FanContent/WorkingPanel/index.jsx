import { useCallback, useState } from 'react'
import { FAN_CONTENT_PANELS, useAppState } from '@/AppStateContext'
import PersonalRecordManagerPanel2 from '@/components/common/hug_function/PersonalRecordManagerPanel2'
import AiContents from './AiContents'
import ChildKadai from './ChildKadai'
import DeleteChilledSpaceBtn from './DeleteChilledSpaceBtn'

const INITIAL_PROMPT_TABS = [
  {
    key: 'personal',
    label: '個人',
    activeClass: 'bg-green-500 text-white',
    inactiveClass: 'bg-white text-gray-900 hover:bg-green-100',
  },
  {
    key: 'professional1',
    label: '専門的支援1',
    activeClass: 'bg-purple-300 text-purple-950',
    inactiveClass: 'bg-white text-gray-900 hover:bg-purple-100',
  },
  {
    key: 'professional2',
    label: '専門的支援2',
    activeClass: 'bg-purple-600 text-white',
    inactiveClass: 'bg-white text-gray-900 hover:bg-purple-100',
  },
]

export default function MainPanel({ spaceId }) {
  const { activeFanContentPanel, USE_AI } = useAppState()
  const [activePromptKey, setActivePromptKey] = useState('personal')
  const [promptTabs, setPromptTabs] = useState(INITIAL_PROMPT_TABS)

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

  const handlePromptTabsChange = useCallback((tabs) => {
    const mergedTabs = tabs.map((tab) => {
      const style = INITIAL_PROMPT_TABS.find(
        (item) => item.key === tab.key
      )

      return {
        ...tab,
        activeClass:
          style?.activeClass ?? 'bg-sky-500 text-white',
        inactiveClass:
          style?.inactiveClass ??
          'bg-gray-200 text-gray-900 hover:bg-gray-300',
      }
    })

    setPromptTabs(mergedTabs)
  }, [])

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
      aria-label="メインパネル"
    >
      <header className="shrink-0 border-b border-gray-200 bg-gray-50 px-2 py-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tracking-wide text-gray-500">
              モード
            </span>
            <span className="text-lg font-bold text-gray-900">
              {modeName}
            </span>
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
          <DeleteChilledSpaceBtn spaceId={spaceId} />
        </div>
      </header>

      <div
        className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
        role="tabpanel"
      >
        {activeFanContentPanel === FAN_CONTENT_PANELS.AI_SUPPORT && (
          <AiContents
            spaceId={spaceId}
            activePromptKey={activePromptKey}
            onPromptChange={setActivePromptKey}
            onPromptTabsChange={handlePromptTabsChange}
          />
        )}

        {activeFanContentPanel === FAN_CONTENT_PANELS.CHILD_KADAI && (
          <ChildKadai spaceId={spaceId} />
        )}

        {activeFanContentPanel === FAN_CONTENT_PANELS.PERSONAL_RECORD && (
          <PersonalRecordManagerPanel2 spaceId={spaceId} />
        )}
      </div>

      {activeFanContentPanel === FAN_CONTENT_PANELS.AI_SUPPORT &&
        promptTabs.length > 0 && (
          <footer className="shrink-0 border-t border-gray-600 bg-gray-700">
            <div className="flex flex-wrap">
              {promptTabs.map(
                ({
                  key,
                  label,
                  activeClass = 'bg-sky-500 text-white',
                  inactiveClass = 'bg-gray-200 text-gray-900 hover:bg-gray-300',
                }) => (
                  <button
                    key={key}
                    type="button"
                    className={`min-w-[100px] px-3 py-2 text-sm font-medium transition-colors ${
                      activePromptKey === key
                        ? activeClass
                        : inactiveClass
                    }`}
                    onClick={() => setActivePromptKey(key)}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </footer>
        )}
    </section>
  )
}
