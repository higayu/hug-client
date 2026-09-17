import { useState } from 'react'

import LeftTabs from './LeftTabs'
import AttendancePanel from './AttendancePanel'
import AdditionCountPanel from './AdditionCountPanel'
import AdditionListPanel from './AdditionListPanel'

export default function LeftPanel({
  loading,
  error,
  attendanceData,
  additionCountLoading,
  additionCountError,
  additionCountData,
  additionListLoading,
  additionListError,
  additionListData,
  targetDate,
  onReload,
  webviewReady,
}) {
  const [activeTab, setActiveTab] = useState('attendance')

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <LeftTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex items-center justify-end border-b border-gray-100 px-4 py-2">
        <button
          type="button"
          onClick={onReload}
          disabled={!webviewReady || loading}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          再取得
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === 'attendance' && (
          <AttendancePanel
            loading={loading}
            error={error}
            attendanceData={attendanceData}
            targetDate={targetDate}
          />
        )}

        {activeTab === 'additionCount' && (
          <AdditionCountPanel
            loading={additionCountLoading}
            error={additionCountError}
            additionCountData={additionCountData}
            targetDate={targetDate}
          />
        )}

        {activeTab === 'additionList' && (
          <AdditionListPanel
            loading={additionListLoading}
            error={additionListError}
            additionListData={additionListData}
            targetDate={targetDate}
          />
        )}
      </div>
    </section>
  )
}
