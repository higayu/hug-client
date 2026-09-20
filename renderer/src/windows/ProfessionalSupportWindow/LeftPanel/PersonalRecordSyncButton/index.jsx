import { useEffect, useMemo, useState } from 'react'

import { useAppState } from '@/AppStateContext'
import AllSyncButton from '@/components/common/Synchronization/AllSyncButton'

import ResultPanel from './ResultPanel'
import {
  getPersonalRecordSkipReason,
  toBulkRecord,
} from './utils'

export function PersonalRecordSyncResultPanel({ snapshot }) {
  if (!snapshot) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        個人記録を同期すると、取得結果がここに表示されます。
      </div>
    )
  }

  return <ResultPanel {...snapshot} />
}

export default function PersonalRecordSyncButton({
  webviewRef,
  webviewReady,
  facilityId,
  year,
  month,
  className = '',
  showInlineResult = true,
  onResultChange,
}) {
  const { STAFF_ID } = useAppState()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendResult, setSendResult] = useState(null)

  const currentWebview = webviewRef?.current ?? null
  const records = useMemo(
    () => (Array.isArray(data?.records) ? data.records : []),
    [data],
  )

  const bulkRecords = useMemo(
    () =>
      records
        .map((record) => toBulkRecord(record, facilityId))
        .filter(Boolean),
    [facilityId, records],
  )

  const conditionSkippedCount = records.filter((record) =>
    Boolean(getPersonalRecordSkipReason(record)),
  ).length

  const skippedSendCount = Math.max(
    records.length - bulkRecords.length,
    0,
  )

  const isWebviewAvailable =
    webviewReady &&
    currentWebview &&
    typeof currentWebview.executeJavaScript === 'function'

  const resultSnapshot = useMemo(
    () => ({
      error,
      sendError,
      sendResult,
      data,
      records,
      bulkRecords,
      conditionSkippedCount,
      skippedSendCount,
      staffId: STAFF_ID,
      facilityId,
      getPersonalRecordSkipReason,
      toBulkRecord,
    }),
    [
      STAFF_ID,
      bulkRecords,
      conditionSkippedCount,
      data,
      error,
      facilityId,
      records,
      sendError,
      sendResult,
      skippedSendCount,
    ],
  )

  useEffect(() => {
    onResultChange?.(resultSnapshot)
  }, [onResultChange, resultSnapshot])

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <AllSyncButton
          webviewRef={webviewRef}
          webviewReady={webviewReady}
          webview={currentWebview}
          facilityId={facilityId}
          year={year}
          month={month}
          setLoading={setLoading}
          setSending={setSending}
          setError={setError}
          setData={setData}
          setSendError={setSendError}
          setSendResult={setSendResult}
          disabled={
            loading ||
            sending ||
            !facilityId ||
            !isWebviewAvailable
          }
          className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        />
      </div>

      {showInlineResult && (
        <PersonalRecordSyncResultPanel snapshot={resultSnapshot} />
      )}
    </div>
  )
}
