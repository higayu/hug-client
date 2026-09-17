import { useState } from 'react'

import LeftTabs from './LeftTabs'
import AttendancePanel from './AttendancePanel'
import AdditionCountPanel from './AdditionCountPanel'
import AdditionListPanel from './AdditionListPanel'
import ComparisonPanel from './ComparisonPanel'

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
  comparisonLoading,
  comparisonError,
  comparisonData,
  targetDate,
  onReload,
  onSync,
  syncing,
  syncMessage,
  syncError,
  webviewReady,
}) {
  const [activeTab, setActiveTab] = useState('attendance')

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <LeftTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="border-b border-gray-100 px-4 py-2">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={!webviewReady || loading || syncing}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            再取得
          </button>

          <button
            type="button"
            onClick={onSync}
            disabled={!webviewReady || syncing}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? '3タブを保存中...' : '3タブをDBへ保存'}
          </button>
        </div>

        {syncMessage && (
          <p className="mt-2 text-right text-xs text-green-700">
            {syncMessage}
          </p>
        )}

        {syncError && (
          <p className="mt-2 text-right text-xs text-red-600">
            {syncError}
          </p>
        )}
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


        {activeTab === 'comparison' && (
          <ComparisonPanel
            loading={comparisonLoading}
            error={comparisonError}
            data={comparisonData}
          />
        )}
      </div>
    </section>
  )
}
