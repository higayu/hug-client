import { useProfessionalSupportPanelData } from '@/hooks/useProfessionalSupportPanelData'
import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { FAN_CONTENT_PANELS, useAppState } from '@/AppStateContext'
import {
  selectSpaceActiveFanContentPanel,
  selectSpace,
} from '@/store/slices/simpleBoardSlice'
import {
  SavedPersonalRecord,
  PersonalRecordMgPanel,
  ProfessionalSupportManagerPanel,
  addProfessionalSupportListAction,
} from '@/components/common/hug_function'
import { useSimpleAttendanceRows } from '../../AttendanceTable/hooks/useSimpleAttendance'
import AiContents from '@/components/common/AiContents'
import ChildKadai from '@/components/common/ChildKadai'
import FanMenu from './FanMenu'

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
  const { USE_AI, appState, CURRENT_YMD, FACILITY_ID } = useAppState()
  const space = useSelector(selectSpace(spaceId))
  const supportPanelData = useProfessionalSupportPanelData(space?.childId)
  const attendanceRows = useSimpleAttendanceRows()
  const attendance = attendanceRows.find(
    (row) => String(row.childId) === String(space?.childId)
  )

  const activeFanContentPanel = useSelector(
    selectSpaceActiveFanContentPanel(spaceId)
  )
  const [activePromptKey, setActivePromptKey] = useState('personal')
  const [promptTabs, setPromptTabs] = useState(INITIAL_PROMPT_TABS)

  const aiNameMap = {
    gemini: 'Gemini',
    chatGPT: 'ChatGPT',
    ollama: 'Ollama',
    deepseek: 'DeepSeek',
    openrouter: 'OpenRouter',
    LaravelApi: 'Laravel API',
  }

  const aiName = aiNameMap[USE_AI] || '未選択'

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
      className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
      aria-label="メインパネル"
    >
      <header className="shrink-0 border-b border-gray-200 bg-gray-50 px-2 py-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="min-w-0 truncate text-lg font-bold text-slate-900">
              {space?.childId || '未取得'}: {space?.childName}
            </h2>
            <div className="flex shrink-0 flex-nowrap items-center gap-2">
              <PersonalRecordMgPanel
              selectedChildId={space?.childId}
              selectedChildName={space?.childName}
              expandDirection="down"
            />
              <ProfessionalSupportManagerPanel
                {...supportPanelData}
                className="shrink-0"
              facilityId={FACILITY_ID}
              currentYmd={CURRENT_YMD}
              selectedChildId={space?.childId}
              selectedChildName={space?.childName}
              enterTime={attendance?.enterTime}
              leaveTime={attendance?.leaveTime}
              isAbsent={attendance?.isAbsent}
              hasEntered={Boolean(attendance?.enterTime)}
              hasExited={Boolean(attendance?.leaveTime)}
              isUIEnabled={Boolean(space?.childId)}
              onOpenProfessionalSupportList={() =>
                addProfessionalSupportListAction(appState, space?.childId, space?.childName)
              }
              expandDirection="down"
              />
            </div>
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
          <SavedPersonalRecord spaceId={spaceId} />
        )}
      </div>

      {activeFanContentPanel === FAN_CONTENT_PANELS.AI_SUPPORT &&
        promptTabs.length > 0 && (
          <footer className="shrink-0 border-t border-gray-600 bg-gray-700">
            <div className="flex flex-wrap pl-20">
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
                    className={`min-w-[100px] px-3 py-3 text-sm font-medium transition-colors ${
                      activePromptKey === key ? activeClass : inactiveClass
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
      <div className="pointer-events-none absolute bottom-2 left-2 z-0">
        <FanMenu spaceId={spaceId} />
      </div>
    </section>
  )
}
