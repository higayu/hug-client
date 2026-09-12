import { useCallback, useState } from 'react'
import PersonalRecordManagerPanel2 from '@/components/common/hug_function/PersonalRecordManagerPanel2'
import AiContents from './AiContents'
import ChildKadai from './ChildKadai'

const TABS = [
  { id: 'ai', label: 'AI支援' },
  { id: 'child-kadai', label: '児童課題' },
  { id: 'personal-record', label: '個人記録' },
]

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
  const [activeTab, setActiveTab] = useState('ai')
  const [activePromptKey, setActivePromptKey] = useState('personal')
  const [promptTabs, setPromptTabs] = useState(INITIAL_PROMPT_TABS)

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
          'bg-white text-gray-900 hover:bg-gray-100',
      }
    })

    setPromptTabs(mergedTabs)
  }, [])

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
      aria-label="メインパネル"
    >
      <div
        className="shrink-0 flex gap-1 border-b border-gray-300 px-3"
        role="tablist"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t px-4 py-2 text-sm font-medium ${
                active
                  ? '-mb-px border border-b-white border-gray-300 bg-white text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
        role="tabpanel"
      >
        {activeTab === 'ai' && (
          <AiContents
            spaceId={spaceId}
            activePromptKey={activePromptKey}
            onPromptChange={setActivePromptKey}
            onPromptTabsChange={handlePromptTabsChange}
          />
        )}

        {activeTab === 'child-kadai' && (
          <ChildKadai spaceId={spaceId} />
        )}

        {activeTab === 'personal-record' && (
          <PersonalRecordManagerPanel2 spaceId={spaceId} />
        )}
      </div>

      {activeTab === 'ai' && promptTabs.length > 0 && (
        <footer className="shrink-0 border-t border-gray-600 bg-gray-700">
          <div className="flex flex-wrap">
            {promptTabs.map(
              ({
                key,
                label,
                activeClass = 'bg-sky-500 text-white',
                inactiveClass = 'bg-white text-gray-900 hover:bg-gray-100',
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
