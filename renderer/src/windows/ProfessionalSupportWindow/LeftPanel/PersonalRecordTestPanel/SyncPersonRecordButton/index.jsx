import { ArrowPathIcon } from '@heroicons/react/24/outline'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'

import { buildPersonalRecordFetchScript } from './personalRecord'
import { fetchPersonalRecordDetails } from './fetchPersonalRecordDetails'

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

export default function SyncPersonRecordButton({
  webviewRef,
  webviewReady,
  facilityId,
  year,
  month,
  loading = false,
  sending = false,
  setLoading,
  setSending,
  setError,
  setData,
  setSendError,
  setSendResult,
}) {
  const { STAFF_ID } = useAppState()
  const { showSuccessToast, showErrorToast } = useToast()

  const handleClick = async () => {
    if (loading || sending) return

    if (!facilityId) {
      setError?.('施設を選択してください。')
      return
    }

    const webview = webviewRef?.current

    if (
      !webviewReady ||
      !webview ||
      typeof webview.executeJavaScript !== 'function'
    ) {
      setError?.(
        'HUGのWebViewがまだ準備できていません。HUG画面の読み込み完了後に、もう一度実行してください。',
      )
      return
    }

    setLoading?.(true)
    setError?.('')
    setSendError?.('')
    setSendResult?.(null)

    let phase = 'fetch'

    try {
      // 1. HUGから個人記録一覧を取得
      const script = buildPersonalRecordFetchScript({
        facilityId,
        year,
        month,
      })

      const listResult = await webview.executeJavaScript(script, true)

      if (listResult?.ok === false) {
        throw new Error(
          listResult.error || '個人記録一覧の取得に失敗しました。',
        )
      }

      const listRecords = Array.isArray(listResult?.records)
        ? listResult.records
        : []

      // 2. 各編集画面から個人記録本文を取得
      const detailResult = await fetchPersonalRecordDetails(
        webview,
        listRecords,
      )

      const fetchedRecords = Array.isArray(detailResult?.records)
        ? detailResult.records
        : listRecords

      const mergedData = {
        ...listResult,
        records: fetchedRecords,
        detailCount: detailResult.detailCount ?? 0,
        detailErrorCount: detailResult.errorCount ?? 0,
        permissionErrorCount: detailResult.permissionErrorCount ?? 0,
        detailFetchOk: detailResult.ok,
        detailFetchError: detailResult.ok ? '' : detailResult.error,
      }

      setData?.(mergedData)

      if (!detailResult.ok) {
        throw new Error(
          `一覧は取得できましたが、本文取得でエラーが発生しました: ${detailResult.error}`,
        )
      }

      // 一括ボタン専用の変換処理。単体保存ボタンには依存しない。
      const bulkRecords = fetchedRecords
        .map((record) => toBulkRecord(record, facilityId))
        .filter(Boolean)

      const skippedCount = Math.max(
        fetchedRecords.length - bulkRecords.length,
        0,
      )

      if (bulkRecords.length === 0) {
        throw new Error(
          'Laravelへ保存できる個人記録がありません。本文取得結果を確認してください。',
        )
      }

      const sendApi =
        window.electronAPI?.laravel_procedure_upsertServiceRecordsBulk ??
        window.electronAPI?.laravel_service_record_bulk_upsert

      if (typeof sendApi !== 'function') {
        throw new Error(
          '一括保存APIがpreloadから公開されていません。main / preload の導線を確認してください。',
        )
      }

      phase = 'send'
      setLoading?.(false)
      setSending?.(true)

      // 3. Laravelへ一括保存
      const staffId = Number(STAFF_ID)
      const payload = {
        records: bulkRecords,
      }

      if (Number.isInteger(staffId) && staffId > 0) {
        payload.recorded_staff_id = staffId
        payload.updated_staff_id = staffId
      }

      console.log(
        '[ProfessionalSupportWindow] 個人記録 独立一括処理 取得→Laravel送信:',
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
        skippedCount,
        raw: rawResult,
      })

      showSuccessToast?.(
        `個人記録の取得・Laravel保存が完了しました（${savedCount}件）`,
        4000,
      )
    } catch (exception) {
      console.error(
        '[ProfessionalSupportWindow] 個人記録 独立一括処理エラー:',
        exception,
      )

      const message =
        exception?.message ?? '個人記録の取得・Laravel保存に失敗しました。'

      if (phase === 'send') {
        setSendError?.(message)
      } else {
        setError?.(message)
      }

      showErrorToast?.(`個人記録の一括処理に失敗しました: ${message}`)
    } finally {
      setLoading?.(false)
      setSending?.(false)
    }
  }

  const isWebviewAvailable =
    webviewReady &&
    webviewRef?.current &&
    typeof webviewRef.current.executeJavaScript === 'function'

  const disabled =
    loading ||
    sending ||
    !facilityId ||
    !isWebviewAvailable

  const buttonText = loading
    ? '個人記録を取得中...'
    : sending
      ? 'Laravelへ保存中...'
      : '個人記録取得・保存'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      title="HUGから個人記録を取得し、そのままLaravelへ一括保存"
    >
      <ArrowPathIcon
        className={`h-5 w-5 shrink-0 ${loading || sending ? 'animate-spin' : ''}`}
      />
      <span>{buttonText}</span>
    </button>
  )
}
