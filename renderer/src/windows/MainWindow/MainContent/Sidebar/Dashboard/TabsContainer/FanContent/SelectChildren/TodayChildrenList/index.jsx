import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppState } from '@/AppStateContext'
import { splitChildrenData } from '@/AppStateContext/splitChildrenData'
import { TABS } from '@/components/common/constants'
import { useTodayChildrenListController } from './useTodayChildrenListController'
import ChildAttendancePanel from './ChildAttendancePanel'
import GetTodayUsersChildren from './GetTodayUsersChildren'

const TAB_ITEMS = [
  { id: TABS.NORMAL, label: '通常' },
  { id: TABS.SOMETIMES, label: '時折' },
  { id: TABS.TEMPORARY, label: '一時' },
  { id: TABS.WAITING, label: '待機' },
  { id: TABS.EXPERIENCE, label: '体験' },
]

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TodayChildrenList({ spaceId }) {
  const appState = useAppState()

  const {
    chilledSpaces,
    SELECT_CHILD_FILTER_MODE,
    CURRENT_DAY_OF_WEEK,
    STAFF_ID,
    FACILITY_ID,
    childrenData,
    waiting_childrenData,
    Experience_childrenData,
    attendanceData,
    databaseState,
    updateAppState,
    setSpaceChild,
    setSpacePcName,
  } = appState

  const currentSpace = chilledSpaces?.[spaceId] ?? {}
  const selectedChildId = currentSpace.childId ?? ''
  const selectedChildName = currentSpace.childName ?? ''

  const [activeTab, setActiveTab] = useState(TABS.NORMAL)
  const [doneChildIds, setDoneChildIds] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)

  const hasStaffId =
    STAFF_ID !== null &&
    STAFF_ID !== undefined &&
    String(STAFF_ID).trim() !== ''

  const weekdayId = useMemo(
    () => CURRENT_DAY_OF_WEEK?.weekdayId ?? null,
    [CURRENT_DAY_OF_WEEK],
  )

  const [displayChildrenData, setDisplayChildrenData] = useState(() =>
    Array.isArray(childrenData) ? childrenData : [],
  )

  const [displayWaitingChildrenData, setDisplayWaitingChildrenData] = useState(
    () => (Array.isArray(waiting_childrenData) ? waiting_childrenData : []),
  )

  const [displayExperienceChildrenData, setDisplayExperienceChildrenData] = useState(
    () => (Array.isArray(Experience_childrenData) ? Experience_childrenData : []),
  )

  // 元の SelectChildren と同じ実データ更新処理
  useEffect(() => {
    let cancelled = false

    const clearChildrenData = () => {
      const emptyChildrenData = {
        childrenData: [],
        waiting_childrenData: [],
        Experience_childrenData: [],
      }

      setDisplayChildrenData([])
      setDisplayWaitingChildrenData([])
      setDisplayExperienceChildrenData([])

      updateAppState?.(emptyChildrenData)

      if (window.AppState) {
        window.AppState.childrenData = []
        window.AppState.waiting_childrenData = []
        window.AppState.Experience_childrenData = []
      }
    }

    async function refreshChildrenByDayOfWeek() {
      if (!hasStaffId) {
        clearChildrenData()
        return
      }

      if (!databaseState || weekdayId == null) {
        return
      }

      try {
        clearChildrenData()

        const result = await splitChildrenData({
          tables: databaseState,
          staffId: STAFF_ID,
          weekdayId,
          facility_id: FACILITY_ID,
        })

        if (cancelled) return

        const nextChildrenData = Array.isArray(result?.week_children)
          ? result.week_children
          : []
        const nextWaitingChildrenData = Array.isArray(result?.waiting_children)
          ? result.waiting_children
          : []
        const nextExperienceChildrenData = Array.isArray(result?.Experience_children)
          ? result.Experience_children
          : []

        setDisplayChildrenData(nextChildrenData)
        setDisplayWaitingChildrenData(nextWaitingChildrenData)
        setDisplayExperienceChildrenData(nextExperienceChildrenData)

        updateAppState?.({
          childrenData: nextChildrenData,
          waiting_childrenData: nextWaitingChildrenData,
          Experience_childrenData: nextExperienceChildrenData,
        })

        if (window.AppState) {
          window.AppState.childrenData = nextChildrenData
          window.AppState.waiting_childrenData = nextWaitingChildrenData
          window.AppState.Experience_childrenData = nextExperienceChildrenData
        }
      } catch (error) {
        console.error('[FanContent/TodayChildrenList] 児童リスト更新に失敗:', error)
      }
    }

    refreshChildrenByDayOfWeek()

    return () => {
      cancelled = true
    }
  }, [
    hasStaffId,
    STAFF_ID,
    FACILITY_ID,
    weekdayId,
    databaseState,
    updateAppState,
  ])

  const {
    normalChildren,
    sometimesChildren,
    temporaryChildren,
    visibleWaitingChildren,
    visibleExperienceChildren,
    handleChildSelect,
    handleToggleDone,
    getChildAbsent,
    getChildExited,
  } = useTodayChildrenListController({
    selectedChildId,
    spaceId,
    SELECT_CHILD_FILTER_MODE,
    childrenData: displayChildrenData,
    waiting_childrenData: displayWaitingChildrenData,
    Experience_childrenData: displayExperienceChildrenData,
    attendanceData,
    activeTab,
    setDoneChildIds,
    setSpaceChild,
    setSpacePcName,
  })

  const childrenByTab = useMemo(
    () => ({
      [TABS.NORMAL]: normalChildren,
      [TABS.SOMETIMES]: sometimesChildren,
      [TABS.TEMPORARY]: temporaryChildren,
      [TABS.WAITING]: visibleWaitingChildren,
      [TABS.EXPERIENCE]: visibleExperienceChildren,
    }),
    [
      normalChildren,
      sometimesChildren,
      temporaryChildren,
      visibleWaitingChildren,
      visibleExperienceChildren,
    ],
  )

  const visibleChildren = childrenByTab[activeTab] ?? []

  const allChildren = useMemo(
    () => [
      ...displayChildrenData,
      ...displayWaitingChildrenData,
      ...displayExperienceChildrenData,
    ],
    [
      displayChildrenData,
      displayWaitingChildrenData,
      displayExperienceChildrenData,
    ],
  )

  const selectedChild = useMemo(
    () =>
      allChildren.find(
        (child) => String(child?.children_id) === String(selectedChildId),
      ) ?? null,
    [allChildren, selectedChildId],
  )

  const selectedChildTab = useMemo(() => {
    if (!selectedChild) return null

    if (visibleWaitingChildren.some((child) => String(child.children_id) === String(selectedChildId))) {
      return TABS.WAITING
    }
    if (visibleExperienceChildren.some((child) => String(child.children_id) === String(selectedChildId))) {
      return TABS.EXPERIENCE
    }

    const priority = Number(selectedChild.priority ?? 0)
    if (priority === 1) return TABS.SOMETIMES
    if (priority === 2) return TABS.TEMPORARY
    return TABS.NORMAL
  }, [
    selectedChild,
    selectedChildId,
    spaceId,
    visibleWaitingChildren,
    visibleExperienceChildren,
  ])

  const hasSelectedChild =
    selectedChildId !== null &&
    selectedChildId !== undefined &&
    String(selectedChildId).trim() !== ''

  const openList = () => {
    if (selectedChildTab) setActiveTab(selectedChildTab)
    setIsOpen(true)
  }

  const toggleList = () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    openList()
  }

  const handleSelectChild = (child) => {
    handleChildSelect(child.children_id, child.children_name, child.pc_name || '')
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        setIsOpen(false)
        return
      }

      if (isTyping) return

      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault()
        setIsOpen((current) => {
          if (!current && selectedChildTab) setActiveTab(selectedChildTab)
          return !current
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedChildTab])

  if (!hasStaffId) {
    return (
      <div className="sidebar-content flex-1">
        <div
          role="alert"
          className="flex min-h-20 items-center justify-center rounded-lg border border-amber-700 bg-amber-50 px-3 text-center text-2xl font-bold text-red-700"
        >
          職員を設定してください
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="sidebar-content relative flex min-h-0 flex-1 flex-col">
      {/* 常時表示: Auto/取得ボタン + 取得時間/フィルター */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-2">
        <div className="flex items-center justify-center">
          <GetTodayUsersChildren expandDirection="down" />
        </div>
      </div>
      {/* 常時表示: 現在選択中の児童 */}
      <button
        type="button"
        onClick={toggleList}
        aria-expanded={isOpen}
        className={`group flex w-full items-center justify-between rounded-lg border px-3 text-left shadow-sm transition ${
          hasSelectedChild
            ? isOpen
              ? 'border-sky-600 bg-sky-200 ring-2 ring-sky-300 shadow-md'
              : 'border-sky-500 bg-sky-200 ring-2 ring-sky-200 shadow-md hover:border-sky-600 hover:bg-sky-300'
            : isOpen
              ? 'border-gray-400 bg-gray-100 grayscale ring-2 ring-gray-200'
              : 'border-gray-300 bg-gray-100 grayscale hover:border-gray-400 hover:bg-gray-200'
        }`}
      >
        <div className="min-w-0">
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            選択中の児童
          </div>

          {selectedChildId ? (
            <div className={`truncate text-xl font-bold ${hasSelectedChild ? 'text-sky-950' : 'text-gray-800'}`}>
              {selectedChildId}: {selectedChildName || selectedChild?.children_name || ''}
              {selectedChild?.pc_name ? ` : ${selectedChild.pc_name}` : ''}
            </div>
          ) : (
            <div className="text-sm text-gray-500">児童を選択してください</div>
          )}
        </div>

        <span
          className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            hasSelectedChild
              ? 'bg-sky-500 text-white shadow-sm group-hover:bg-sky-600'
              : 'bg-gray-200 text-gray-500 grayscale group-hover:bg-gray-300'
          }`}
        >
          <ChevronIcon open={isOpen} />
        </span>
      </button>

      <div className="mt-1 flex justify-end pr-1 text-[10px] text-gray-400">
        Ctrl + Space で開閉 / Esc で閉じる
      </div>

      {/* 実データを使う展開式児童一覧 */}
      <div
        className={`mt-2 origin-top overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg transition-all duration-200 ${
          isOpen
            ? 'pointer-events-auto max-h-[70vh] translate-y-0 opacity-100'
            : 'pointer-events-none max-h-0 -translate-y-1 border-transparent opacity-0 shadow-none'
        }`}
      >
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-2">
          <div className="flex flex-wrap gap-1">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          <ul className="m-0 list-none p-0">
            {visibleChildren.length === 0 && (
              <li className="px-3 py-3 text-sm text-gray-500">
                表示できる児童はいません
              </li>
            )}

            {visibleChildren.map((child) => {
              const selected = String(selectedChildId) === String(child.children_id)
              const done = doneChildIds.includes(child.children_id)
              const absent = getChildAbsent(child)
              const exited = getChildExited(child)

              return (
                <li
                  key={child.children_id}
                  onClick={() => handleSelectChild(child)}
                  className={`my-1 flex cursor-pointer items-center justify-between rounded-md border p-2 transition ${
                    selected
                      ? exited && !absent
                        ? 'border-l-4 border-yellow-600 bg-yellow-200 font-bold ring-1 ring-yellow-300'
                        : 'border-l-4 border-cyan-700 bg-cyan-200 font-bold ring-1 ring-cyan-300'
                      : exited && !absent
                        ? 'bg-yellow-50 hover:bg-yellow-200'
                        : 'bg-gray-50 hover:bg-gray-200'
                  } ${absent ? 'grayscale opacity-40' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">
                      {child.children_id}: {child.children_name}
                      {child.pc_name ? ` : ${child.pc_name}` : ''}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {absent ? '欠席' : exited ? '退室済' : '利用中 / 未入室'}
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-pressed={done}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleToggleDone(child, !done)
                    }}
                    className={`ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                      done
                        ? 'border-green-600 bg-green-500 text-white'
                        : 'border-gray-400 bg-white text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    済
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* 元の SelectChildren と同じ実データ連動のメモ/出欠パネル */}
      <div className="mt-2 min-h-0 flex-1">
        <ChildAttendancePanel spaceId={spaceId} />
      </div>
    </div>
  )
}
