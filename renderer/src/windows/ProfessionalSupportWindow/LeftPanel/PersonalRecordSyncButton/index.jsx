import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAppState } from '@/AppStateContext'
import AllSyncButton from '@/components/common/Synchronization/AllSyncButton'

import ResultPanel from './ResultPanel'
import formatSyncedAt from '../utils/formatSyncedAt'
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
  onSyncCompleted,
}) {
  const { STAFF_ID } = useAppState()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendResult, setSendResult] = useState(null)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [syncHistoryLoading, setSyncHistoryLoading] = useState(false)
  const [syncHistoryError, setSyncHistoryError] = useState('')
  const syncHistoryRequestIdRef = useRef(0)
  const completedSendResultRef = useRef(null)

  const fetchSyncHistory = useCallback(async () => {
    const requestId = syncHistoryRequestIdRef.current + 1
    syncHistoryRequestIdRef.current = requestId

    if (!facilityId || !year || !month) {
      setLastSyncedAt(null)
      setSyncHistoryError('')
      setSyncHistoryLoading(false)
      return
    }

    const getMonth =
      window.electronAPI?.laravel_personalRecordSync_getMonth ??
      window.electronAPI?.laravel_personal_record_syncs_getMonth ??
      window.electronAPI?.laravel_personal_record_syncs_getAll

    if (typeof getMonth !== 'function') {
      setLastSyncedAt(null)
      setSyncHistoryError(
        '個人記録同期履歴APIがpreloadから公開されていません。',
      )
      setSyncHistoryLoading(false)
      return
    }

    setSyncHistoryLoading(true)
    setSyncHistoryError('')

    try {
      const result = await getMonth({
        facilityId: Number(facilityId),
        year: Number(year),
        month: Number(month),
        itemId: 1,
      })

      if (requestId !== syncHistoryRequestIdRef.current) {
        return
      }

      if (!result?.success) {
        throw new Error(result?.message || '個人記録の最終取得日時を取得できませんでした。')
      }

      const row = result?.data?.data ?? result?.data ?? null
      setLastSyncedAt(
        row?.synced_at ??
          row?.syncedAt ??
          result?.meta?.synced_at ??
          result?.meta?.syncedAt ??
          null,
      )
    } catch (fetchError) {
      if (requestId !== syncHistoryRequestIdRef.current) {
        return
      }

      setLastSyncedAt(null)
      setSyncHistoryError(
        fetchError instanceof Error
          ? fetchError.message
          : '個人記録の最終取得日時を取得できませんでした。',
      )
    } finally {
      if (requestId === syncHistoryRequestIdRef.current) {
        setSyncHistoryLoading(false)
      }
    }
  }, [facilityId, month, year])

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

  useEffect(() => {
    fetchSyncHistory()
  }, [fetchSyncHistory, sendResult])

  useEffect(() => {
    if (
      !sendResult?.success ||
      completedSendResultRef.current === sendResult
    ) {
      return
    }

    completedSendResultRef.current = sendResult

    Promise.resolve(onSyncCompleted?.()).catch((refreshError) => {
      console.error(
        '[PersonalRecordSyncButton] 月間集計の再取得に失敗しました:',
        refreshError,
      )
    })
  }, [onSyncCompleted, sendResult])

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-1">
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

        <div
          className="whitespace-nowrap text-xs text-gray-500"
          title={syncHistoryError || undefined}
        >
          最終取得：
          <span
            className={`ml-1 font-medium ${
              syncHistoryError ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            {syncHistoryLoading
              ? '確認中...'
              : syncHistoryError
                ? '取得失敗'
                : formatSyncedAt(lastSyncedAt)}
          </span>
        </div>
      </div>

      {showInlineResult && (
        <PersonalRecordSyncResultPanel snapshot={resultSnapshot} />
      )}
    </div>
  )
}
