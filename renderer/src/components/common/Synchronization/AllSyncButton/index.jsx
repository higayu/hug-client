import { useCallback, useEffect, useRef, useState } from 'react'
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
import { loadAllSyncAutomation } from './allSyncWebAutomation'

const PERSONAL_RECORD_ITEM_ID = 1
const TOTAL_STEPS = 5
const DEFAULT_LABEL = '個人記録の更新'
const COMPLETED_LABEL_DISPLAY_MS = 2000

const formatStepLabel = (step, text) =>
  `${step}/${TOTAL_STEPS} ${text}`

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
  const [label, setLabel] = useState(DEFAULT_LABEL)
  const labelResetTimerRef = useRef(null)

  const storeFacilityId = useSelector(selectFacilityId)
  const facilityId = facilityIdProp ?? storeFacilityId

  const { STAFF_ID } = useAppState()
  const { showInfoToast, showSuccessToast, showErrorToast } = useToast()

  const clearLabelResetTimer = useCallback(() => {
    if (labelResetTimerRef.current !== null) {
      window.clearTimeout(labelResetTimerRef.current)
      labelResetTimerRef.current = null
    }
  }, [])

  useEffect(
    () => () => {
      clearLabelResetTimer()
    },
    [clearLabelResetTimer],
  )

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

  const syncStaffs = async (activeWebview, automationRule) => {
    setLabel(formatStepLabel(1, '職員更新中...'))

    const result = await fetchStaffData(
      (page, maxPage) => {
        setLabel(
          formatStepLabel(1, `職員取得 ${page}/${maxPage}`),
        )
      },
      facilityId,
      activeWebview,
      { config: automationRule?.config ?? {} },
    )

    console.groupCollapsed(
      `[個人記録の更新] 職員取得データ (${result.fetched_count ?? 0}件)`,
    )
    console.log('取得データ:', result)
    console.table(result.staff ?? [])
    console.groupEnd()

    if (!window.electronAPI?.syncHugStaffs) {
      throw new Error(
        '職員同期APIを利用できません。アプリを再起動してください。',
      )
    }

    setLabel(formatStepLabel(1, '職員DB更新中...'))

    const syncResult = await window.electronAPI.syncHugStaffs(result)

    return {
      fetchedCount: result.fetched_count ?? 0,
      totalCount: result.total_count ?? null,
      syncResult,
    }
  }

  const syncChildren = async (activeWebview, automationRule) => {
    setLabel(formatStepLabel(2, '児童更新中...'))

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const result = await fetchChildrenData(
      (page, maxPage) => {
        setLabel(
          formatStepLabel(2, `児童取得 ${page}/${maxPage}`),
        )
      },
      facilityId,
      today,
      activeWebview,
      { config: automationRule?.config ?? {} },
    )

    console.groupCollapsed(
      `[個人記録の更新] 児童取得データ (${result.children?.length ?? 0}件)`,
    )
    console.log('取得データ:', result)
    console.table(result.children ?? [])
    console.groupEnd()

    if (!window.electronAPI?.syncHugChildrens) {
      throw new Error(
        '児童同期APIを利用できません。アプリを再起動してください。',
      )
    }

    setLabel(formatStepLabel(2, '児童DB更新中...'))

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
      `[個人記録の更新] Laravel児童送信データ (${childrenJson.length}件)`,
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

  const fetchPersonalRecords = async (activeWebview, automation) => {
    setLoading?.(true)
    setSending?.(false)
    setError?.('')
    setSendError?.('')
    setSendResult?.(null)

    const listAutomation =
      automation.rules.personal_record_list_fetch
    const detailAutomation =
      automation.rules.personal_record_detail_fetch

    setLabel(formatStepLabel(3, '個人記録一覧取得中...'))

    const script = buildPersonalRecordFetchScript({
      facilityId,
      year,
      month,
      config: listAutomation?.config ?? {},
    })

    const listResult = await activeWebview.executeJavaScript(
      script,
      true,
    )

    if (listResult?.ok === false) {
      throw new Error(
        listResult.error || '個人記録一覧の取得に失敗しました。',
      )
    }

    const listRecords = Array.isArray(listResult?.records)
      ? listResult.records
      : []

    setLabel(
      formatStepLabel(
        4,
        `個人記録詳細取得中... 0/${listRecords.length}`,
      ),
    )

    const detailResult = await fetchPersonalRecordDetails(
      activeWebview,
      listRecords,
      {
        config: detailAutomation?.config ?? {},
        onProgress: (current, total) => {
          setLabel(
            formatStepLabel(
              4,
              `個人記録詳細取得 ${current}/${total}`,
            ),
          )
        },
      },
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
      webAutomation: {
        flowKey: automation.flow?.flow_key ?? 'all_sync',
        staffRuleVersion: automation.rules.staff_fetch?.rule?.version,
        childrenRuleVersion: automation.rules.children_fetch?.rule?.version,
        listRuleVersion: listAutomation?.rule?.version,
        detailRuleVersion: detailAutomation?.rule?.version,
      },
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

    return {
      bulkRecords,
      fetchedCount: fetchedRecords.length,
      skippedCount,
      detailErrorCount: detailResult.errorCount ?? 0,
    }
  }

  const savePersonalRecords = async (personalRecordData) => {
    setLabel(formatStepLabel(5, '個人記録をLaravelへ保存中...'))
    setLoading?.(false)
    setSending?.(true)

    const {
      bulkRecords,
      fetchedCount,
      skippedCount,
      detailErrorCount,
    } = personalRecordData

    const sendApi =
      window.electronAPI?.laravel_procedure_upsertServiceRecordsBulk ??
      window.electronAPI?.laravel_service_record_bulk_upsert

    if (typeof sendApi !== 'function') {
      throw new Error(
        '一括保存APIがpreloadから公開されていません。main / preload の導線を確認してください。',
      )
    }

    const staffId = Number(STAFF_ID)
    const syncFacilityId = Number(facilityId)
    const targetYear = Number(year)
    const targetMonth = Number(month)

    if (!Number.isInteger(syncFacilityId) || syncFacilityId <= 0) {
      throw new Error('同期履歴に保存する施設IDが不正です。')
    }

    if (!Number.isInteger(targetYear) || targetYear < 2000 || targetYear > 2100) {
      throw new Error('同期履歴に保存する対象年が不正です。')
    }

    if (!Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      throw new Error('同期履歴に保存する対象月が不正です。')
    }

    const payload = {
      records: bulkRecords,
      save_sync_history: 1,
      sync_facility_id: syncFacilityId,
      target_year: targetYear,
      target_month: targetMonth,
    }

    if (Number.isInteger(staffId) && staffId > 0) {
      payload.recorded_staff_id = staffId
      payload.updated_staff_id = staffId
    }

    console.groupCollapsed(
      `[個人記録の更新] 個人記録Laravel送信データ (${bulkRecords.length}件)`,
    )
    console.log('送信データ:', payload)
    console.table(bulkRecords)
    console.groupEnd()

    const rawResult = await sendApi(payload)
    const result = unwrapBulkResult(rawResult)

    if (!result?.success) {
      console.error(
        '[個人記録の更新] 個人記録Laravel保存失敗:',
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
      fetchedCount,
      savedCount,
      skippedCount,
      detailErrorCount,
    }
  }

  const handleClick = async () => {
    if (disabled || isRunning) return

    clearLabelResetTimer()

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
    setLabel(formatStepLabel(1, '職員更新を開始...'))
    setError?.('')
    setSendError?.('')
    setSendResult?.(null)

    showInfoToast?.(
      '職員→児童→個人記録一覧→個人記録詳細→Laravel保存の順で実行します',
      3000,
    )

    let currentStep = 1
    let phase = '職員更新'
    let completed = false

    try {
      phase = 'Web自動化設定取得'
      const automation = await loadAllSyncAutomation()

      console.groupCollapsed('[個人記録の更新] all_sync Web自動化設定')
      console.log('Flow:', automation.flow)
      console.log('Rules:', automation.rules)
      console.groupEnd()

      // 1/5 職員取得・DB更新
      phase = '職員更新'
      const staffResult = await syncStaffs(
        activeWebview,
        automation.rules.staff_fetch,
      )

      // 2/5 児童取得・DB更新
      currentStep = 2
      phase = '児童更新'
      const childrenResult = await syncChildren(
        activeWebview,
        automation.rules.children_fetch,
      )

      // 3/5 + 4/5 個人記録一覧・詳細取得
      currentStep = 3
      phase = '個人記録一覧取得'
      const personalRecordData = await fetchPersonalRecords(
        activeWebview,
        automation,
      )

      // 詳細取得まで完了しているため、保存工程へ進む。
      currentStep = 5
      phase = '個人記録のLaravel保存'
      const personalRecordResult = await savePersonalRecords(
        personalRecordData,
      )

      completed = true
      setLabel(formatStepLabel(5, 'すべて完了'))

      labelResetTimerRef.current = window.setTimeout(() => {
        setLabel(DEFAULT_LABEL)
        labelResetTimerRef.current = null
      }, COMPLETED_LABEL_DISPLAY_MS)

      showSuccessToast?.(
        [
          '個人記録の更新が完了しました',
          `職員: ${staffResult.fetchedCount}件`,
          `児童: ${childrenResult.targetCount}件`,
          `個人記録保存: ${personalRecordResult.savedCount}件`,
        ].join(' / '),
        6000,
      )
    } catch (error) {
      console.error(`[個人記録の更新] ${phase}でエラー:`, error)

      const message = error?.message || String(error)

      setLabel(
        formatStepLabel(currentStep, `${phase}で停止`),
      )

      if (currentStep >= 3) {
        setSendError?.(message)
      } else {
        setError?.(message)
      }

      showErrorToast?.(
        `個人記録の更新は「${phase}」で停止しました: ${message}`,
      )
    } finally {
      setLoading?.(false)
      setSending?.(false)
      setIsRunning(false)

      if (!completed) {
        // エラー時は停止した工程をボタンに残す。
        return
      }
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
      title="職員更新 → 児童更新 → 個人記録一覧取得 → 個人記録詳細取得 → Laravel保存を順番に実行"
    >
      <ArrowPathIcon
        className={`h-5 w-5 shrink-0 ${isRunning ? 'animate-spin' : ''}`}
      />
      <span>{label}</span>
    </button>
  )
}
