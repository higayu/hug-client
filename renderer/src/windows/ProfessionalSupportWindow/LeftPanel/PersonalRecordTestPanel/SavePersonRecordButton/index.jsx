import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'


const PERSONAL_RECORD_ITEM_ID = 1


const toPersonalRecordStatus = (record) => {
  const statusText = String(record?.status ?? '')
    .replace(/\s+/g, '')
    .trim()

  const statusClass = String(record?.statusClass ?? '')
    .toLowerCase()
    .trim()

  if (statusText === '1') {
    return 1
  }

  if (statusText === '2') {
    return 2
  }

  if (statusText === '公開中' || statusText === '公開') {
    return 1
  }

  if (statusText === '下書き') {
    return 2
  }

  if (statusClass.split(/\s+/).includes('open')) {
    return 1
  }

  return null
}


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
    status: toPersonalRecordStatus(record),
    is_copy: 0,
    is_deleted: 0,
    recorded_staff_id:
      Number.isInteger(recordStaffId) && recordStaffId > 0
        ? recordStaffId
        : null,
  }
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

export default function SavePersonRecordButton({
  records = [],
  facilityId,
  sending = false,
  loading = false,
  setSending,
  setSendError,
  setSendResult,
}) {
  const { STAFF_ID } = useAppState()
  const { showSuccessToast, showErrorToast } = useToast()

  const bulkRecords = Array.isArray(records)
    ? records
        .map((record) => toBulkRecord(record, facilityId))
        .filter(Boolean)
    : []

  const skippedSendCount = Math.max(
    (Array.isArray(records) ? records.length : 0) - bulkRecords.length,
    0,
  )

  const handleClick = async () => {
    if (loading || sending) return

    if (!facilityId) {
      const message = '施設を選択してください。'
      setSendError?.(message)
      showErrorToast?.(message)
      return
    }

    if (bulkRecords.length === 0) {
      const message =
        '送信できる個人記録がありません。先に「個人記録を取得」を実行し、本文取得結果を確認してください。'
      setSendError?.(message)
      showErrorToast?.(message)
      return
    }

    const sendApi =
      window.electronAPI?.laravel_procedure_upsertServiceRecordsBulk ??
      window.electronAPI?.laravel_service_record_bulk_upsert

    if (typeof sendApi !== 'function') {
      const message =
        '一括保存APIがpreloadから公開されていません。main / preload の導線を確認してください。'
      setSendError?.(message)
      showErrorToast?.(message)
      return
    }

    setSending?.(true)
    setSendError?.('')
    setSendResult?.(null)

    try {
      const staffId = Number(STAFF_ID)
      const payload = {
        records: bulkRecords,
      }

      if (Number.isInteger(staffId) && staffId > 0) {
        payload.recorded_staff_id = staffId
        payload.updated_staff_id = staffId
      }

      console.log(
        '[ProfessionalSupportWindow] 個人記録 単体Laravel一括送信:',
        payload,
      )

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

      setSendResult?.({
        success: true,
        processedCount: savedCount,
        requestedCount: bulkRecords.length,
        skippedCount: skippedSendCount,
        raw: rawResult,
      })

      showSuccessToast?.(
        `個人記録をLaravelへ保存しました（${savedCount}件）`,
        4000,
      )
    } catch (sendException) {
      console.error(
        '[ProfessionalSupportWindow] 個人記録 単体Laravel一括送信エラー:',
        sendException,
      )

      const message =
        sendException?.message ?? '個人記録の一括保存に失敗しました。'

      setSendError?.(message)
      showErrorToast?.(`個人記録の保存に失敗しました: ${message}`)
    } finally {
      setSending?.(false)
    }
  }

  const disabled =
    loading ||
    sending ||
    !facilityId ||
    bulkRecords.length === 0

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      title="取得済みの個人記録をLaravelへ一括保存"
    >
      <ArrowUpTrayIcon
        className={`h-5 w-5 shrink-0 ${sending ? 'animate-pulse' : ''}`}
      />
      <span>
        {sending
          ? `送信中... (${bulkRecords.length}件)`
          : `Laravelへ一括保存 (${bulkRecords.length}件)`}
      </span>
    </button>
  )
}
