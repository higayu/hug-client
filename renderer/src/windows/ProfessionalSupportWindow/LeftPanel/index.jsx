import { useState } from 'react'

import { useAppState } from '@/AppStateContext'

import LeftTabs from './LeftTabs'
import AttendancePanel from './AttendancePanel'
import AdditionCountPanel from './AdditionCountPanel'
import AdditionListPanel from './AdditionListPanel'
import ComparisonPanel from './ComparisonPanel'
import ProfessionalSupportAutoSync from './ProfessionalSupportAutoSync'
import ProfessionalSupportSyncButton from './ProfessionalSupportSyncButton'
import useProfessionalSupportSync from './ProfessionalSupportSync'

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
  webviewRef,
  webviewReady,
  facilityId,
  year,
  month,
  syncStatusChecked,
  isMonthSynced,
  onSyncFetchStart,
  onSyncFetched,
  onSyncFetchFailed,
  onSyncCompleted,
}) {
  const { DEBUG_FLG } = useAppState()
  const [activeTab, setActiveTab] = useState('comparison')

  const {
    runSync,
    syncing,
    syncMessage,
    syncError,
    progressText,
    clearSyncStatus,
  } = useProfessionalSupportSync({
    webviewRef,
    webviewReady,
    facilityId,
    year,
    month,
    targetDate,
    onFetchStart: onSyncFetchStart,
    onFetched: onSyncFetched,
    onFetchFailed: onSyncFetchFailed,
    onCompleted: onSyncCompleted,
  })

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <ProfessionalSupportAutoSync
        facilityId={facilityId}
        year={year}
        month={month}
        webviewReady={webviewReady}
        syncStatusChecked={syncStatusChecked}
        isMonthSynced={isMonthSynced}
        comparisonLoading={comparisonLoading}
        comparisonError={comparisonError}
        syncing={syncing}
        runSync={runSync}
        clearSyncStatus={clearSyncStatus}
      />

      {DEBUG_FLG && (
        <LeftTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      )}

      <div className="border-b border-gray-100 px-4 py-2">
        <ProfessionalSupportSyncButton
          onClick={runSync}
          disabled={!facilityId || !webviewReady}
          syncing={syncing}
          progressText={progressText}
          syncMessage={syncMessage}
          syncError={syncError}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!DEBUG_FLG && (
          <ComparisonPanel
            loading={comparisonLoading}
            error={comparisonError}
            data={comparisonData}
            records={additionListData?.records ?? []}
          />
        )}

        {DEBUG_FLG && activeTab === 'attendance' && (
          <AttendancePanel
            loading={loading}
            error={error}
            attendanceData={attendanceData}
            targetDate={targetDate}
          />
        )}

        {DEBUG_FLG && activeTab === 'additionCount' && (
          <AdditionCountPanel
            loading={additionCountLoading}
            error={additionCountError}
            additionCountData={additionCountData}
            targetDate={targetDate}
          />
        )}

        {DEBUG_FLG && activeTab === 'additionList' && (
          <AdditionListPanel
            loading={additionListLoading}
            error={additionListError}
            additionListData={additionListData}
            targetDate={targetDate}
          />
        )}

        {DEBUG_FLG && activeTab === 'comparison' && (
          <ComparisonPanel
            loading={comparisonLoading}
            error={comparisonError}
            data={comparisonData}
            records={additionListData?.records ?? []}
          />
        )}
      </div>
    </section>
  )
}
