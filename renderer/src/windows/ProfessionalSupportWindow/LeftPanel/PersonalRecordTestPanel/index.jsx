import { useCallback, useMemo, useState } from 'react'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'

import StaffUpdateButton from '@/components/common/Synchronization/StaffUpdateButton'
import ChildrenUpdateButton from '@/components/common/Synchronization/ChildrenUpdateButton'

import HugGetPersonRecordButton from './HugGetPersonRecordButton'
import SavePersonRecordButton from './SavePersonRecordButton'
import ResultPanel from './ResultPanel'

const PERSONAL_RECORD_ITEM_ID = 1

const normalizeConditionText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, '')
    .trim()

const getPersonalRecordSkipReason = (record) => {
  const attendance = normalizeConditionText(record?.attendance)
  const status = normalizeConditionText(record?.status)

  if (attendance === '欠席' || attendance.startsWith('欠席(')) {
    return attendance.includes('欠席時対応加算を取らない')
      ? '欠席（欠席時対応加算を取らない）'
      : '欠席'
  }

  if (status === '未作成') {
    return '状態が未作成'
  }

  return ''
}

const unwrapBulkResult = (result) => {
  if (
    result?.data &&
    typeof result.data === 'object' &&
    Object.prototype.hasOwnProperty.call(result.data, 'success')
  ) {
    return result.data
  }

  return result
}

const toBulkRecord = (record, facilityId) => {
  if (getPersonalRecordSkipReason(record)) {
    return null
  }

  const childrenId = Number(record?.childrenId)
  const normalizedFacilityId = Number(facilityId)
  const servedDate = String(record?.date ?? '').trim()

  if (!Number.isInteger(childrenId) || childrenId <= 0) {
    return null
  }

  if (!Number.isInteger(normalizedFacilityId) || normalizedFacilityId <= 0) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(servedDate)) {
    return null
  }

  // 詳細画面まで取得できたレコードだけ保存する。
  // 空文字の記録は有効な本文として扱うため、null/undefined のみ除外する。
  if (record?.note === null || record?.note === undefined || record?.noteError) {
    return null
  }

  const recordStaffId = Number(record?.recordStaffId)

  return {
    children_id: childrenId,
    item_id: PERSONAL_RECORD_ITEM_ID,
    served_date: servedDate,
    facility_id: normalizedFacilityId,
    note: String(record.note),
    is_copy: 0,
    is_deleted: 0,
    recorded_staff_id:
      Number.isInteger(recordStaffId) && recordStaffId > 0
        ? recordStaffId
        : null,
  }
}

export default function PersonalRecordTestPanel({
  webviewRef,
  webviewReady,
  facilityId,
  year,
  month,
}) {
  const { STAFF_ID } = useAppState()
  const { showSuccessToast, showErrorToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendResult, setSendResult] = useState(null)

  const currentWebview = webviewRef?.current ?? null
  const isWebviewAvailable =
    webviewReady &&
    currentWebview &&
    typeof currentWebview.executeJavaScript === 'function'


  const records = Array.isArray(data?.records) ? data.records : []

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

  const skippedSendCount = Math.max(records.length - bulkRecords.length, 0)

  const handleSend = useCallback(async () => {
    if (bulkRecords.length === 0) {
      setSendError('送信できる個人記録がありません。本文取得結果を確認してください。')
      return
    }

    const sendApi =
      window.electronAPI?.laravel_procedure_upsertServiceRecordsBulk ??
      window.electronAPI?.laravel_service_record_bulk_upsert

    if (typeof sendApi !== 'function') {
      setSendError(
        '一括保存APIがpreloadから公開されていません。main / preload の導線を確認してください。',
      )
      return
    }

    const staffId = Number(STAFF_ID)
    const payload = {
      records: bulkRecords,
    }

    if (Number.isInteger(staffId) && staffId > 0) {
      payload.recorded_staff_id = staffId
      payload.updated_staff_id = staffId
    }

    setSending(true)
    setSendError('')
    setSendResult(null)

    try {
      console.log('[ProfessionalSupportWindow] 個人記録一括送信:', payload)

      const rawResult = await sendApi(payload)
      const result = unwrapBulkResult(rawResult)

      if (!result?.success) {
        throw new Error(
          result?.message ||
            result?.error ||
            rawResult?.message ||
            rawResult?.error ||
            '個人記録の一括保存に失敗しました。',
        )
      }

      const processedCount =
        result?.data?.processed_count ??
        rawResult?.data?.processed_count ??
        rawResult?.data?.data?.processed_count ??
        bulkRecords.length

      const savedCount = Number(processedCount) || bulkRecords.length

      setSendResult({
        success: true,
        processedCount: savedCount,
        requestedCount: bulkRecords.length,
        skippedCount: skippedSendCount,
        raw: rawResult,
      })

      showSuccessToast(
        `個人記録をLaravelへ保存しました（${savedCount}件）`,
        4000,
      )
    } catch (sendException) {
      console.error(
        '[ProfessionalSupportWindow] 個人記録一括送信エラー:',
        sendException,
      )
      const errorMessage =
        sendException?.message ?? '個人記録の一括保存に失敗しました。'

      setSendError(errorMessage)
      showErrorToast(`個人記録の保存に失敗しました: ${errorMessage}`)
    } finally {
      setSending(false)
    }
  }, [
    STAFF_ID,
    bulkRecords,
    skippedSendCount,
    showSuccessToast,
    showErrorToast,
  ])

  return (
    <section className="border-b border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            個人記録取得テスト
          </h3>
          <p className="mt-1 text-xs text-amber-700">
            一覧取得後、各編集画面までfetchして個人記録本文を取得します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StaffUpdateButton
            facilityId={facilityId}
            webview={currentWebview}
            disabled={
              loading ||
              sending ||
              !facilityId ||
              !isWebviewAvailable
            }
            className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          />

          <ChildrenUpdateButton
            facilityId={facilityId}
            webview={currentWebview}
            disabled={
              loading ||
              sending ||
              !facilityId ||
              !isWebviewAvailable
            }
            className="flex items-center justify-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          />

          <HugGetPersonRecordButton
            webviewRef={webviewRef}
            webviewReady={webviewReady}
            facilityId={facilityId}
            year={year}
            month={month}
            loading={loading}
            sending={sending}
            setLoading={setLoading}
            setError={setError}
            setData={setData}
            setSendError={setSendError}
            setSendResult={setSendResult}
          />

          <SavePersonRecordButton
            onClick={handleSend}
            sending={sending}
            count={bulkRecords.length}
            disabled={loading || bulkRecords.length === 0}
          />
        </div>
      </div>

      <ResultPanel
        error={error}
        sendError={sendError}
        sendResult={sendResult}
        data={data}
        records={records}
        bulkRecords={bulkRecords}
        conditionSkippedCount={conditionSkippedCount}
        skippedSendCount={skippedSendCount}
        staffId={STAFF_ID}
        facilityId={facilityId}
        getPersonalRecordSkipReason={getPersonalRecordSkipReason}
        toBulkRecord={toBulkRecord}
      />
    </section>
  )
}
