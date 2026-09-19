import { useState } from 'react'
import { useSelector } from 'react-redux'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { selectFacilityId } from '@/store/slices/appStateSlice'
import { getActiveWebview } from '@/utils/webview/webviewState.js'

import { fetchStaffData } from '../StaffUpdateButton/fetchStaffData.js'
import { fetchChildrenData } from '../ChildrenUpdateButton/fetchChildrenData.js'

import { buildPersonalRecordFetchScript } from './personalRecord'
import { fetchPersonalRecordDetails } from './fetchPersonalRecordDetails'

const PERSONAL_RECORD_ITEM_ID = 1

const normalizeConditionText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, '')
    .trim()


const toPersonalRecordStatus = (record) => {
  const statusText = String(record?.status ?? '')
    .replace(/\s+/g, '')
    .trim()

  const statusClass = String(record?.statusClass ?? '')
    .toLowerCase()
    .trim()

  if (statusText === '1') return 1
  if (statusText === '2') return 2

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

const getLaravelErrorMessage = (rawResult, result) => {
  const candidates = [
    result?.message,
    rawResult?.message,
    typeof result?.error === 'string' ? result.error : null,
    typeof rawResult?.error === 'string' ? rawResult.error : null,
    result?.error?.message,
    rawResult?.error?.message,
    result?.error?.details?.message,
    rawResult?.error?.details?.message,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  const validationErrors =
    result?.error?.validationErrors ??
    rawResult?.error?.validationErrors ??
    result?.errors ??
    rawResult?.errors ??
    null

  if (validationErrors && typeof validationErrors === 'object') {
    const messages = Object.entries(validationErrors).flatMap(
      ([key, values]) =>
        (Array.isArray(values) ? values : [values])
          .filter((value) => value !== null && value !== undefined)
          .map((value) => `${key}: ${String(value)}`),
    )

    if (messages.length > 0) {
      return messages.join('\n')
    }
  }

  return '個人記録の一括保存に失敗しました。'
}

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

  if (!Number.isInteger(childrenId) || childrenId <= 0) return null
  if (!Number.isInteger(normalizedFacilityId) || normalizedFacilityId <= 0) {
    return null
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(servedDate)) return null

  if (
    record?.note === null ||
    record?.note === undefined ||
    record?.noteError
  ) {
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

export default function AllSyncButton({
  webviewRef,
  webviewReady = true,
  webview = null,
  facilityId: facilityIdProp,
  year,
  month,
  disabled = false,
  className = '',
  setLoading,
  setSending,
  setError,
  setData,
  setSendError,
  setSendResult,
}) {
  const [isRunning, setIsRunning] = useState(false)
  const [label, setLabel] = useState('全データ一括更新')

  const storeFacilityId = useSelector(selectFacilityId)
  const facilityId = facilityIdProp ?? storeFacilityId

  const { STAFF_ID } = useAppState()
  const { showInfoToast, showSuccessToast, showErrorToast } = useToast()

  const resolveWebview = () => {
    if (webviewRef?.current) {
      return webviewRef.current
    }

    const targetWebview =
      typeof webview === 'function'
        ? webview()
        : webview

    return targetWebview ?? getActiveWebview()
  }

  const syncStaffs = async (activeWebview) => {
    setLabel('職員取得中...')

    const result = await fetchStaffData(
      (page, maxPage) => {
        setLabel(`職員取得 ${page}/${maxPage}`)
      },
      facilityId,
      activeWebview,
    )

    console.groupCollapsed(
      `[全データ一括更新] 職員取得データ (${result.fetched_count ?? 0}件)`,
    )
    console.log('取得データ:', result)
    console.table(result.staff ?? [])
    console.groupEnd()

    if (!window.electronAPI?.syncHugStaffs) {
      throw new Error(
        '職員同期APIを利用できません。アプリを再起動してください。',
      )
    }

    setLabel('職員DB更新中...')

    const syncResult = await window.electronAPI.syncHugStaffs(result)

    return {
      fetchedCount: result.fetched_count ?? 0,
      totalCount: result.total_count ?? null,
      syncResult,
    }
  }

  const syncChildren = async (activeWebview) => {
    setLabel('児童取得中...')

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const result = await fetchChildrenData(
      (page, maxPage) => {
        setLabel(`児童取得 ${page}/${maxPage}`)
      },
      facilityId,
      today,
      activeWebview,
    )

    console.groupCollapsed(
      `[全データ一括更新] 児童取得データ (${result.children?.length ?? 0}件)`,
    )
    console.log('取得データ:', result)
    console.table(result.children ?? [])
    console.groupEnd()

    if (!window.electronAPI?.syncHugChildrens) {
      throw new Error(
        '児童同期APIを利用できません。アプリを再起動してください。',
      )
    }

    setLabel('児童DB更新中...')

    const facilityIdNum = Number(facilityId) || 3

    const childrenJson = (result.children ?? []).map((child) => ({
      id: Number(child.id),
      name: child.name || '',
      furigana: child.furigana || '',
      pronunciation_id: child.pronunciation_id
        ? Number(child.pronunciation_id)
        : null,
      children_type_id: child.children_type_id || 1,
      notes: child.notes || '',
      notes2: child.notes2 || '',
      personal_tmp: child.personal_tmp || '',
      is_delete: child.is_delete || 0,
      leaving_at: child.leaving_at || null,
    }))

    const payload = {
      facility_id: facilityIdNum,
      children: childrenJson,
    }

    console.groupCollapsed(
      `[全データ一括更新] Laravel児童送信データ (${childrenJson.length}件)`,
    )
    console.log('送信データ:', payload)
    console.table(childrenJson)
    console.groupEnd()

    const syncResult = await window.electronAPI.syncHugChildrens(payload)

    const resultData = Array.isArray(syncResult)
      ? syncResult[0]
      : syncResult

    return {
      targetCount: resultData?.target_count ?? childrenJson.length,
      linkInserted: resultData?.facility_link_inserted ?? 0,
      linkDeleted: resultData?.facility_link_deleted ?? 0,
      deleteCandidates: resultData?.delete_candidate_count ?? 0,
      targetDate: result.target_date || '-',
      facilityId: facilityIdNum,
      syncResult,
    }
  }

  const syncPersonalRecords = async (activeWebview) => {
    setLabel('個人記録取得中...')
    setLoading?.(true)
    setSending?.(false)
    setError?.('')
    setSendError?.('')
    setSendResult?.(null)

    const script = buildPersonalRecordFetchScript({
      facilityId,
      year,
      month,
    })

    const listResult = await activeWebview.executeJavaScript(script, true)

    if (listResult?.ok === false) {
      throw new Error(
        listResult.error || '個人記録一覧の取得に失敗しました。',
      )
    }

    const listRecords = Array.isArray(listResult?.records)
      ? listResult.records
      : []

    const detailResult = await fetchPersonalRecordDetails(
      activeWebview,
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

    setLabel('個人記録保存中...')
    setLoading?.(false)
    setSending?.(true)

    const staffId = Number(STAFF_ID)
    const payload = {
      records: bulkRecords,
    }

    if (Number.isInteger(staffId) && staffId > 0) {
      payload.recorded_staff_id = staffId
      payload.updated_staff_id = staffId
    }

    console.groupCollapsed(
      `[全データ一括更新] 個人記録Laravel送信データ (${bulkRecords.length}件)`,
    )
    console.log('送信データ:', payload)
    console.table(bulkRecords)
    console.groupEnd()

    const rawResult = await sendApi(payload)
    const result = unwrapBulkResult(rawResult)

    if (!result?.success) {
      console.error(
        '[全データ一括更新] 個人記録Laravel保存失敗:',
        {
          rawResult,
          result,
          payload,
        },
      )

      throw new Error(
        getLaravelErrorMessage(rawResult, result),
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

    return {
      fetchedCount: fetchedRecords.length,
      savedCount,
      skippedCount,
      detailErrorCount: detailResult.errorCount ?? 0,
    }
  }

  const handleClick = async () => {
    if (disabled || isRunning) return

    if (!facilityId) {
      setError?.('施設を選択してください。')
      showErrorToast?.('施設を選択してください。')
      return
    }

    const activeWebview = resolveWebview()

    if (
      !webviewReady ||
      !activeWebview ||
      typeof activeWebview.executeJavaScript !== 'function'
    ) {
      const message =
        'HUGのWebViewがまだ準備できていません。HUG画面の読み込み完了後に、もう一度実行してください。'
      setError?.(message)
      showErrorToast?.(message)
      return
    }

    setIsRunning(true)
    setLabel('全データ一括更新開始...')
    setError?.('')
    setSendError?.('')
    setSendResult?.(null)

    showInfoToast?.('職員・児童・個人記録を順番に更新しています', 2500)

    let phase = '職員同期'

    try {
      // 1. 職員同期
      const staffResult = await syncStaffs(activeWebview)

      // 2. 児童同期
      phase = '児童同期'
      const childrenResult = await syncChildren(activeWebview)

      // 3. 個人記録取得 + Laravel保存
      phase = '個人記録取得・保存'
      const personalRecordResult = await syncPersonalRecords(activeWebview)

      setLabel('全データ一括更新完了')

      showSuccessToast?.(
        [
          '全データ一括更新が完了しました',
          `職員: ${staffResult.fetchedCount}件`,
          `児童: ${childrenResult.targetCount}件`,
          `個人記録保存: ${personalRecordResult.savedCount}件`,
        ].join(' / '),
        6000,
      )
    } catch (error) {
      console.error(`[全データ一括更新] ${phase}でエラー:`, error)

      const message = error?.message || String(error)

      if (phase === '個人記録取得・保存') {
        setSendError?.(message)
      } else {
        setError?.(message)
      }

      showErrorToast?.(
        `全データ一括更新は「${phase}」で停止しました: ${message}`,
      )
    } finally {
      setLoading?.(false)
      setSending?.(false)
      setIsRunning(false)
      setLabel('全データ一括更新')
    }
  }

  const isDisabled = disabled || isRunning || !facilityId

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        whitespace-nowrap
        rounded-md
        bg-violet-600
        px-4
        py-2
        text-sm
        font-semibold
        text-white
        shadow-sm
        transition-colors
        hover:bg-violet-700
        disabled:cursor-not-allowed
        disabled:bg-gray-300
        ${className}
      `}
      title="職員同期 → 児童同期 → 個人記録取得 → Laravel保存を順番に実行"
    >
      <ArrowPathIcon
        className={`h-5 w-5 shrink-0 ${isRunning ? 'animate-spin' : ''}`}
      />
      <span>{label}</span>
    </button>
  )
}
