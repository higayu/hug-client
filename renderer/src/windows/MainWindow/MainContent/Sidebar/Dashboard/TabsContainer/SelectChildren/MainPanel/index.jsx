import { useState } from 'react'
import PersonalRecordManagerPanel2 from '@/components/common/hug_function/PersonalRecordManagerPanel2'
import AiContents from './AiContents'
import ChildKadai from './ChildKadai'

const TABS = [
  { id: 'ai', label: 'AI支援' },
  { id: 'child-kadai', label: '児童課題' },
  { id: 'personal-record', label: '個人記録' },
]

const INITIAL_PROMPT_TABS = [
  { key: 'personal', label: '個人' },
  { key: 'professional1', label: '専門的支援1' },
  { key: 'professional2', label: '専門的支援2' },
]

export default function MainPanel() {
  const [activeTab, setActiveTab] = useState('ai')
  const [activePromptKey, setActivePromptKey] = useState('personal')
  const [promptTabs, setPromptTabs] = useState(INITIAL_PROMPT_TABS)

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
            activePromptKey={activePromptKey}
            onPromptChange={setActivePromptKey}
            onPromptTabsChange={setPromptTabs}
          />
        )}
        {activeTab === 'child-kadai' && <ChildKadai />}
        {activeTab === 'personal-record' && <PersonalRecordManagerPanel2 />}
      </div>

      {activeTab === 'ai' && promptTabs.length > 0 && (
        <footer className="shrink-0 border-t border-gray-600 bg-gray-700">
          <div className="flex flex-wrap">
            {promptTabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`min-w-[100px] px-3 py-2 text-sm transition-colors ${
                  activePromptKey === key
                    ? 'bg-sky-400 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-blue-400 hover:text-white'
                }`}
                onClick={() => setActivePromptKey(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </footer>
      )}
    </section>
  )
}
