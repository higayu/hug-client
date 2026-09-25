import { useCallback, useState } from 'react'

import { useAppState } from '@/AppStateContext'

import LeftTabs from './LeftTabs'
import AttendancePanel from './AttendancePanel'
import AdditionCountPanel from './AdditionCountPanel'
import AdditionListPanel from './AdditionListPanel'
import ComparisonPanel2 from './ComparisonPanel2'
import ProfessionalSupportAutoSync from './ProfessionalSupportAutoSync'
import ProfessionalSupportSyncButton from './ProfessionalSupportSyncButton'
import PersonalRecordSyncButton, {
  PersonalRecordSyncResultPanel,
} from './PersonalRecordSyncButton'
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
  lastSyncedAt,
  onSyncFetchStart,
  onSyncFetched,
  onSyncFetchFailed,
  onSyncCompleted,
}) {
  const { DEBUG_FLG } = useAppState()
  const [activeTab, setActiveTab] = useState('comparison')
  const [personalRecordResult, setPersonalRecordResult] = useState(null)
  const [personalRecordRefreshKey, setPersonalRecordRefreshKey] = useState(0)
  const handlePersonalRecordResultChange = useCallback((snapshot) => {
    setPersonalRecordResult(snapshot)
  }, [])
  const handlePersonalRecordSyncCompleted = useCallback(() => {
    setPersonalRecordRefreshKey((current) => current + 1)
  }, [])

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

  const targetMonth = `${year}-${String(month).padStart(2, '0')}`

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-gray-100 px-4 py-2">
        <div className="flex flex-wrap items-start gap-2">
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

          <div className="flex flex-wrap items-center gap-2">
            <ProfessionalSupportSyncButton
              onClick={runSync}
              disabled={!facilityId || !webviewReady}
              syncing={syncing}
              progressText={progressText}
              syncMessage={syncMessage}
              syncError={syncError}
              lastSyncedAt={lastSyncedAt}
            />

            <PersonalRecordSyncButton
              className="min-w-0 flex-1"
              webviewRef={webviewRef}
              webviewReady={webviewReady}
              facilityId={facilityId}
              year={year}
              month={month}
              showInlineResult={false}
              onResultChange={handlePersonalRecordResultChange}
              onSyncCompleted={handlePersonalRecordSyncCompleted}
            />
          </div>

        </div>
      </div>

      {DEBUG_FLG && (
        <LeftTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {DEBUG_FLG && activeTab === 'attendance' && (
          <AttendancePanel
            loading={loading}
            error={error}
            attendanceData={attendanceData}
            targetDate={targetDate}
          />
        )}

        {DEBUG_FLG && activeTab === 'personalRecord' && (
          <PersonalRecordSyncResultPanel
            snapshot={personalRecordResult}
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

        {(!DEBUG_FLG || activeTab === 'comparison') && (
          <ComparisonPanel2
            loading={comparisonLoading}
            error={comparisonError}
            data={comparisonData}
            records={additionListData?.records ?? []}
            facilityId={facilityId}
            targetMonth={targetMonth}
            personalRecordRefreshKey={personalRecordRefreshKey}
          />
        )}
      </div>
    </section>
  )
}
