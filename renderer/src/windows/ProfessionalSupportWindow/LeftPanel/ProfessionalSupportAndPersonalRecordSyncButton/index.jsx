import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'

import PersonalRecordSyncRunner from './PersonalRecordSyncRunner'
import useIndependentProfessionalSupportSync from './useIndependentProfessionalSupportSync'
import {
  getPersonalRecordSkipReason,
  toBulkRecord,
} from './personalRecordUtils'

const DEFAULT_LABEL = '支援加算・個人記録を更新'

export default function ProfessionalSupportAndPersonalRecordSyncButton({
  webviewRef,
  webviewReady,
  facilityId,
  year,
  month,
  targetDate,
  onFetchStart,
  onFetched,
  onFetchFailed,
  onCompleted,
  onPersonalRecordResultChange,
}) {
  const { STAFF_ID } = useAppState()
  const personalRecordRunnerRef = useRef(null)
  const [isRunning, setIsRunning] = useState(false)
  const [label, setLabel] = useState(DEFAULT_LABEL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendResult, setSendResult] = useState(null)
  const { showInfoToast, showSuccessToast, showErrorToast } = useToast()

  // 既存の支援加算ボタンとは共有しない、このボタン専用の同期処理。
  const {
    runSync: runIndependentProfessionalSupportSync,
    syncing: professionalSupportSyncing,
  } = useIndependentProfessionalSupportSync({
    webviewRef,
    webviewReady,
    facilityId,
    year,
    month,
    targetDate,
    onFetchStart,
    onFetched,
    onFetchFailed,
    onCompleted,
  })

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
    onPersonalRecordResultChange?.(resultSnapshot)
  }, [onPersonalRecordResultChange, resultSnapshot])

  const handleClick = async () => {
    if (
      !facilityId ||
      !webviewReady ||
      isRunning ||
      professionalSupportSyncing
    ) {
      return
    }

    setIsRunning(true)

    try {
      setLabel('1/2 支援加算を再取得中...')
      showInfoToast?.(
        '支援加算の再取得後に、個人記録を更新します',
        3000,
      )

      const supportSucceeded =
        await runIndependentProfessionalSupportSync()

      if (!supportSucceeded) {
        throw new Error('支援加算の再取得に失敗しました。')
      }

      const runPersonalRecord =
        personalRecordRunnerRef.current?.run

      if (typeof runPersonalRecord !== 'function') {
        throw new Error('個人記録の更新処理を開始できません。')
      }

      setLabel('2/2 個人記録を更新中...')
      const personalRecordSucceeded = await runPersonalRecord()

      if (!personalRecordSucceeded) {
        throw new Error('個人記録の更新に失敗しました。')
      }

      setLabel('2/2 更新完了')
      showSuccessToast?.(
        '支援加算と個人記録の更新が完了しました。',
        5000,
      )
    } catch (runError) {
      const message = runError?.message || String(runError)
      setLabel('更新停止')
      showErrorToast?.(message)
    } finally {
      setIsRunning(false)
    }
  }

  const isDisabled =
    !facilityId ||
    !webviewReady ||
    isRunning ||
    professionalSupportSyncing

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        title="支援加算の再取得後に個人記録を更新"
      >
        <ArrowPathIcon
          className={`h-5 w-5 shrink-0 ${isRunning ? 'animate-spin' : ''}`}
        />
        <span>{label}</span>
      </button>

      {/* 統合ボタン専用の個人記録処理。既存ボタンには依存しない。 */}
      <div className="hidden">
        <PersonalRecordSyncRunner
          ref={personalRecordRunnerRef}
          webviewRef={webviewRef}
          webviewReady={webviewReady}
          facilityId={facilityId}
          year={year}
          month={month}
          setLoading={setLoading}
          setSending={setSending}
          setError={setError}
          setData={setData}
          setSendError={setSendError}
          setSendResult={setSendResult}
          disabled={loading || sending}
        />
      </div>
    </>
  )
}
