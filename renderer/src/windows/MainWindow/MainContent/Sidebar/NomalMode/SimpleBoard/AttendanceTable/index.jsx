import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  selectSelectedRowIds,
  toggleSelectedRow,
  MAX_SELECTED_CHILDREN,
} from '@/store/slices/simpleBoardSlice'

import AttendanceHeader from './components/AttendanceHeader'
import AttendanceDataTable from './components/AttendanceDataTable'
import AttendanceMessage from './components/AttendanceMessage'
import WeekdayServiceRecordPanel from './components/WeekdayServiceRecordPanel'

import FlipCard from '@/components/ui/FlipCard'
import { useSimpleAttendance } from './hooks/useSimpleAttendance'

/**
 * SimpleBoard テーブル用フィルタ
 *
 * SimpleBoard 内だけで使用するローカル state。
 * AppStateContext の SELECT_CHILD_FILTER_MODE とは連動させない。
 *
 * 0: 全件
 * 1: 退室済み以外
 * 2: 退室済みと欠席以外
 * 3: 欠席
 * 4: 退室済み
 */
const FILTER_MODE = {
  ALL: 0,
  EXCLUDE_LEFT: 1,
  EXCLUDE_LEFT_AND_ABSENT: 2,
  ABSENT_ONLY: 3,
  LEFT_ONLY: 4,
}

function hasActualLeaveTime(row) {
  const value = String(row?.leaveTime ?? '').trim()

  return /^\d{1,2}:\d{2}$/.test(value)
}

function filterAttendanceRows(rows, filterMode) {
  const safeRows = Array.isArray(rows) ? rows : []
  const mode = Number(filterMode ?? FILTER_MODE.ALL)

  switch (mode) {
    case FILTER_MODE.EXCLUDE_LEFT:
      return safeRows.filter(
        (row) => !hasActualLeaveTime(row)
      )

    case FILTER_MODE.EXCLUDE_LEFT_AND_ABSENT:
      return safeRows.filter((row) => {
        const isLeft = hasActualLeaveTime(row)
        const isAbsent = row?.isAbsent === true

        return !isLeft && !isAbsent
      })

    case FILTER_MODE.ABSENT_ONLY:
      return safeRows.filter(
        (row) => row?.isAbsent === true
      )

    case FILTER_MODE.LEFT_ONLY:
      return safeRows.filter(
        (row) => hasActualLeaveTime(row)
      )

    case FILTER_MODE.ALL:
    default:
      return safeRows
  }
}

export default function AttendanceTable({
  isExpanded,
  onExpandedChange,
}) {
  const dispatch = useDispatch()

  const selectedRowIds = useSelector(
    selectSelectedRowIds
  )

  const [filterMode, setFilterMode] = useState(
    FILTER_MODE.ALL
  )

  const {
    rows,
    loading,
    actionRowId,
    error,
    lastUpdatedAt,
    runAction,
  } = useSimpleAttendance()

  const filteredRows = useMemo(
    () => filterAttendanceRows(rows, filterMode),
    [rows, filterMode],
  )

  return (
    <section
      className={`
        absolute inset-y-0 left-0 z-10
        flex min-h-0 items-stretch
        transition-[width]
        duration-300 ease-in-out
        ${isExpanded ? 'w-full' : 'w-9'}
      `}
      aria-label="入退室一覧"
    >
      {/* メインパネル */}
      <div
        id="attendance-table-panel"
        className={`
          flex min-w-0 min-h-0 flex-col
          overflow-hidden bg-white
          transition-[width,opacity]
          duration-300 ease-in-out
          ${
            isExpanded
              ? 'w-full flex-1 opacity-100'
              : 'w-0 opacity-0'
          }
        `}
        aria-hidden={!isExpanded}
        inert={!isExpanded ? '' : undefined}
      >
        {/* 利用可能な高さをすべて使用 */}
        <div
          className="
            flex h-full min-h-0
            min-w-[320px] flex-1 flex-col
            overflow-hidden p-4
          "
        >
          <FlipCard
            panel
            fillHeight
            width="100%"
            defaultFlipped={false}
            frontLabel="入退室テーブル"
            backLabel="個人記録"

            front={(
              <div
                className="
                  flex h-full min-h-0
                  min-w-0 flex-col
                  overflow-hidden
                "
              >
                {/* ヘッダー固定領域 */}
                <div className="shrink-0">
                  <AttendanceHeader
                    lastUpdatedAt={lastUpdatedAt}
                    totalCount={rows.length}
                    filteredCount={filteredRows.length}
                    filterMode={filterMode}
                    onFilterModeChange={setFilterMode}
                  />
                </div>

                {/* テーブルスクロール領域 */}
                <div
                  className="
                    min-h-0 flex-1
                    overflow-y-auto
                  "
                >
                  <p
                    className="mb-3 text-sm text-slate-600"
                    role="status"
                  >
                    児童を1〜{MAX_SELECTED_CHILDREN}人選択してください
                    （選択中：{selectedRowIds.length}人）。

                    {selectedRowIds.length ===
                      MAX_SELECTED_CHILDREN &&
                      '変更する場合は、選択を解除してください。'}
                  </p>

                  <AttendanceMessage
                    error={error}
                    loading={loading}
                    hasRows={filteredRows.length > 0}
                    hasSourceRows={rows.length > 0}
                  />

                  {(loading || rows.length > 0) && (
                    <AttendanceDataTable
                      rows={filteredRows}
                      actionRowId={actionRowId}
                      onAction={runAction}
                      selectedRowIds={selectedRowIds}
                      onToggleRow={(rowId) =>
                        dispatch(toggleSelectedRow(rowId))
                      }
                    />
                  )}
                </div>
              </div>
            )}

            back={(
              <div className="h-full min-h-0 overflow-auto">
                <WeekdayServiceRecordPanel
                  embedded
                  attendanceRows={filteredRows}
                />
              </div>
            )}
          />
        </div>
      </div>

      {/* 開閉ボタン */}
      <button
        type="button"
        onClick={() => onExpandedChange(!isExpanded)}
        disabled={
          isExpanded && selectedRowIds.length === 0
        }
        aria-expanded={isExpanded}
        aria-controls="attendance-table-panel"
        aria-label={
          isExpanded
            ? '入退室一覧を閉じる'
            : '入退室一覧を開く'
        }
        title={
          isExpanded && selectedRowIds.length === 0
            ? `児童を1〜${MAX_SELECTED_CHILDREN}人選択してください`
            : isExpanded
              ? '入退室一覧を閉じる'
              : '入退室一覧を開く'
        }
        className="
          flex w-9 shrink-0
          items-center justify-center
          border-l border-sky-200
          bg-sky-400 text-sky-700
          transition-colors
          hover:bg-sky-200
          disabled:cursor-not-allowed
          disabled:bg-sky-50
          disabled:text-sky-300
          focus-visible:outline
          focus-visible:outline-2
          focus-visible:outline-sky-500
        "
      >
        <span
          className="text-xl font-bold"
          aria-hidden="true"
        >
          {isExpanded ? '‹' : '›'}
        </span>
      </button>
    </section>
  )
}