import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import HeaderComponent from './HeaderComponent'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import {
  buildAttendanceFetchScript,
  getWindowParameters,
} from './attendance'
import { buildAdditionCountFetchScript } from './additionCount'
import { buildAdditionListFetchScript } from './additionList'
import { buildProfessionalSupportSyncPayload } from './syncProfessionalSupport'
import {
  buildAdditionCountPanelDataFromDb,
  buildAdditionListPanelDataFromDb,
  buildAttendancePanelDataFromDb,
} from './dbProfessionalSupport'
import ResizableSplitPane from '@/components/ui/ResizableSplitPane'

const getInitialYearMonth = (targetDate) => {
  const matched = String(targetDate ?? '').match(/^(\d{4})-(\d{2})/)

  if (matched) {
    return {
      year: Number(matched[1]),
      month: Number(matched[2]),
    }
  }

  const now = new Date()

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

export default function ProfessionalSupportWindow() {
  const sessionWebviewRef = useRef(null)
  const parameters = useMemo(getWindowParameters, [])

  // MainWindow から渡された現在選択中の施設IDを初期値にする。
  const [selectedFacilityId, setSelectedFacilityId] = useState(
    parameters.facilityId,
  )

  const initialYearMonth = useMemo(
    () => getInitialYearMonth(parameters.targetDate),
    [parameters.targetDate],
  )
  const [selectedYear, setSelectedYear] = useState(initialYearMonth.year)
  const [selectedMonth, setSelectedMonth] = useState(initialYearMonth.month)

  const selectedTargetDate = useMemo(
    () =>
      `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
    [selectedYear, selectedMonth],
  )

  const [attendanceData, setAttendanceData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [additionCountData, setAdditionCountData] = useState(null)
  const [additionCountError, setAdditionCountError] = useState('')
  const [additionCountLoading, setAdditionCountLoading] = useState(true)
  const [additionListData, setAdditionListData] = useState(null)
  const [additionListError, setAdditionListError] = useState('')
  const [additionListLoading, setAdditionListLoading] = useState(true)
  const [webviewReady, setWebviewReady] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [syncError, setSyncError] = useState('')
  const [comparisonData, setComparisonData] = useState([])
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState('')
  const [syncStatusChecked, setSyncStatusChecked] = useState(false)
  const [isMonthSynced, setIsMonthSynced] = useState(false)
  const autoSyncAttemptedKeyRef = useRef('')


  const fetchAttendance = useCallback(async () => {
    const webview = sessionWebviewRef.current

    if (!selectedFacilityId) {
      setError('施設を選択してください。')
      setLoading(false)
      return
    }

    if (!webview || !webviewReady) {
      setError('HUGセッション確認用WebViewの準備が完了していません。')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await webview.executeJavaScript(
        buildAttendanceFetchScript({
          facilityId: selectedFacilityId,
          targetDate: selectedTargetDate,
        }),
        true,
      )

      setAttendanceData(result)
      return result
    } catch (fetchError) {
      console.error(
        '[ProfessionalSupportWindow] 出席データ取得エラー:',
        fetchError,
      )

      setError(
        fetchError?.message ??
          '出席データの取得に失敗しました。',
      )
    } finally {
      setLoading(false)
    }
  }, [
    selectedTargetDate,
    selectedFacilityId,
    webviewReady,
  ])

  const fetchAdditionCount = useCallback(async () => {
    const webview = sessionWebviewRef.current

    if (!selectedFacilityId) {
      setAdditionCountError('施設を選択してください。')
      setAdditionCountLoading(false)
      return
    }

    if (!webview || !webviewReady) {
      setAdditionCountError('HUGセッション確認用WebViewの準備が完了していません。')
      setAdditionCountLoading(false)
      return
    }

    setAdditionCountLoading(true)
    setAdditionCountError('')

    try {
      const result = await webview.executeJavaScript(
        buildAdditionCountFetchScript({
          facilityId: selectedFacilityId,
          targetDate: selectedTargetDate,
        }),
        true,
      )

      setAdditionCountData(result)
      return result
    } catch (fetchError) {
      console.error(
        '[ProfessionalSupportWindow] 加算数データ取得エラー:',
        fetchError,
      )

      setAdditionCountError(
        fetchError?.message ??
          '加算数データの取得に失敗しました。',
      )
    } finally {
      setAdditionCountLoading(false)
    }
  }, [
    selectedTargetDate,
    selectedFacilityId,
    webviewReady,
  ])

  const fetchAdditionList = useCallback(async () => {
    const webview = sessionWebviewRef.current

    if (!selectedFacilityId) {
      setAdditionListError('施設を選択してください。')
      setAdditionListLoading(false)
      return
    }

    if (!webview || !webviewReady) {
      setAdditionListError('HUGセッション確認用WebViewの準備が完了していません。')
      setAdditionListLoading(false)
      return
    }

    setAdditionListLoading(true)
    setAdditionListError('')

    try {
      const result = await webview.executeJavaScript(
        buildAdditionListFetchScript({
          facilityId: selectedFacilityId,
          targetDate: selectedTargetDate,
        }),
        true,
      )

      setAdditionListData(result)
      return result
    } catch (fetchError) {
      console.error(
        '[ProfessionalSupportWindow] 加算一覧データ取得エラー:',
        fetchError,
      )

      setAdditionListError(
        fetchError?.message ??
          '加算一覧データの取得に失敗しました。',
      )
    } finally {
      setAdditionListLoading(false)
    }
  }, [
    selectedTargetDate,
    selectedFacilityId,
    webviewReady,
  ])

  const fetchComparisonData = useCallback(async () => {
    if (!selectedFacilityId) {
      setComparisonData([])
      setAttendanceData(null)
      setAdditionCountData(null)
      setAdditionListData(null)
      setComparisonError('施設を選択してください。')
      setIsMonthSynced(false)
      setSyncStatusChecked(true)
      return { isCompleted: false }
    }

    const getApi =
      window.electronAPI?.laravel_procedure_getProfessionalSupportMonth

    if (typeof getApi !== 'function') {
      setComparisonData([])
      setComparisonError('月次比較取得APIがpreloadから公開されていません。')
      setIsMonthSynced(false)
      setSyncStatusChecked(true)
      return { isCompleted: false }
    }

    setComparisonLoading(true)
    setComparisonError('')
    setSyncStatusChecked(false)

    try {
      const result = await getApi({
        facilityId: Number(selectedFacilityId),
        year: Number(selectedYear),
        month: Number(selectedMonth),
      })

      if (!result?.success) {
        throw new Error(
          result?.message || result?.error || '月次比較データの取得に失敗しました。',
        )
      }

      const responseData = result?.data ?? {}

      const comparisonRows = Array.isArray(responseData?.comparison)
        ? responseData.comparison
        : []
      const attendanceRows = Array.isArray(responseData?.attendance)
        ? responseData.attendance
        : []
      const additionCountRows = Array.isArray(responseData?.additionCounts)
        ? responseData.additionCounts
        : []
      const recordRows = Array.isArray(responseData?.records)
        ? responseData.records
        : []

      const completedValue = result?.meta?.isCompleted
      const hasStoredData =
        comparisonRows.length > 0 ||
        attendanceRows.length > 0 ||
        additionCountRows.length > 0 ||
        recordRows.length > 0

      const isCompleted =
        completedValue === true ||
        completedValue === 1 ||
        completedValue === '1' ||
        hasStoredData

      setComparisonData(comparisonRows)
      setIsMonthSynced(isCompleted)

      if (isCompleted) {
        setAttendanceData(
          buildAttendancePanelDataFromDb({
            rows: attendanceRows,
            year: selectedYear,
            month: selectedMonth,
          }),
        )
        setAdditionCountData(
          buildAdditionCountPanelDataFromDb({
            rows: additionCountRows,
            year: selectedYear,
            month: selectedMonth,
          }),
        )
        setAdditionListData(
          buildAdditionListPanelDataFromDb({
            rows: recordRows,
            year: selectedYear,
            month: selectedMonth,
          }),
        )

        setError('')
        setAdditionCountError('')
        setAdditionListError('')
        setLoading(false)
        setAdditionCountLoading(false)
        setAdditionListLoading(false)
      }

      setSyncStatusChecked(true)

      return {
        isCompleted,
        comparisonRows,
        attendanceRows,
        additionCountRows,
        recordRows,
      }
    } catch (comparisonFetchError) {
      console.error(
        '[ProfessionalSupportWindow] 月次比較データ取得エラー:',
        comparisonFetchError,
      )
      setComparisonData([])
      setIsMonthSynced(false)
      setSyncStatusChecked(true)
      setComparisonError(
        comparisonFetchError?.message ?? '月次比較データの取得に失敗しました。',
      )
      return { isCompleted: false }
    } finally {
      setComparisonLoading(false)
    }
  }, [
    selectedFacilityId,
    selectedYear,
    selectedMonth,
  ])

  const syncAllToDatabase = useCallback(async () => {
    if (!selectedFacilityId || !webviewReady || syncing) {
      return
    }

    const syncApi =
      window.electronAPI?.laravel_procedure_syncProfessionalSupportMonth

    if (typeof syncApi !== 'function') {
      setSyncError('月次同期APIがpreloadから公開されていません。')
      return
    }

    setSyncing(true)
    setSyncMessage('')
    setSyncError('')

    try {
      // 3タブを同じ施設・年月で最新取得してから、1回のAPIでまとめて保存する。
      // 同じWebViewセッションを使うため、HUG側の検索状態が競合しないよう順番に取得する。
      const nextAttendanceData = await fetchAttendance()
      const nextAdditionCountData = await fetchAdditionCount()
      const nextAdditionListData = await fetchAdditionList()

      if (!nextAttendanceData || !nextAdditionCountData || !nextAdditionListData) {
        throw new Error('3種類のデータをすべて取得できなかったため保存を中止しました。')
      }

      const payload = buildProfessionalSupportSyncPayload({
        facilityId: selectedFacilityId,
        year: selectedYear,
        month: selectedMonth,
        attendanceData: nextAttendanceData,
        additionCountData: nextAdditionCountData,
        additionListData: nextAdditionListData,
      })

      const result = await syncApi(payload)

      if (!result?.success) {
        throw new Error(
          result?.message || result?.error || '月次データの保存に失敗しました。',
        )
      }

      const counts = result?.data ?? {}
      setSyncMessage(
        `DB保存完了：出席 ${counts.attendance_count ?? payload.attendanceData.length}件 / ` +
          `加算 ${counts.addition_count ?? payload.additionData.length}件 / ` +
          `一覧 ${counts.record_count ?? payload.recordData.length}件`,
      )

      await fetchComparisonData()
    } catch (syncFetchError) {
      console.error(
        '[ProfessionalSupportWindow] 月次DB同期エラー:',
        syncFetchError,
      )
      setSyncError(
        syncFetchError?.message ?? '月次データの保存に失敗しました。',
      )
    } finally {
      setSyncing(false)
    }
  }, [
    selectedFacilityId,
    selectedYear,
    selectedMonth,
    webviewReady,
    syncing,
    fetchAttendance,
    fetchAdditionCount,
    fetchAdditionList,
    fetchComparisonData,
  ])

  const reloadAll = useCallback(() => {
    fetchAttendance()
    fetchAdditionCount()
    fetchAdditionList()
    fetchComparisonData()
  }, [
    fetchAttendance,
    fetchAdditionCount,
    fetchAdditionList,
    fetchComparisonData,
  ])

  useEffect(() => {
    const webview = sessionWebviewRef.current

    if (!webview) {
      return undefined
    }

    const handleDomReady = () => {
      setWebviewReady(true)
    }

    const handleDidStartLoading = () => {
      setWebviewReady(false)
    }

    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('did-start-loading', handleDidStartLoading)

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('did-start-loading', handleDidStartLoading)
    }
  }, [])

  // 施設・年月が変わったら、HUGより先にDB同期状態を確認する。
  useEffect(() => {
    autoSyncAttemptedKeyRef.current = ''
    setAttendanceData(null)
    setAdditionCountData(null)
    setAdditionListData(null)
    setError('')
    setAdditionCountError('')
    setAdditionListError('')
    setSyncMessage('')
    setSyncError('')
    setSyncStatusChecked(false)
    setIsMonthSynced(false)

    if (!selectedFacilityId) {
      setComparisonData([])
      setSyncStatusChecked(true)
      return
    }

    fetchComparisonData()
  }, [
    selectedFacilityId,
    selectedYear,
    selectedMonth,
    fetchComparisonData,
  ])

  // professional_support_syncs に同期済みレコードが無い月だけ、
  // WebViewから3種類を取得して1回だけ自動保存する。
  useEffect(() => {
    if (
      !selectedFacilityId ||
      !webviewReady ||
      !syncStatusChecked ||
      isMonthSynced ||
      Boolean(comparisonError) ||
      syncing ||
      comparisonLoading
    ) {
      return
    }

    const syncKey = `${selectedFacilityId}-${selectedYear}-${selectedMonth}`

    if (autoSyncAttemptedKeyRef.current === syncKey) {
      return
    }

    autoSyncAttemptedKeyRef.current = syncKey
    syncAllToDatabase()
  }, [
    selectedFacilityId,
    selectedYear,
    selectedMonth,
    webviewReady,
    syncStatusChecked,
    isMonthSynced,
    comparisonError,
    syncing,
    comparisonLoading,
    syncAllToDatabase,
  ])

  const handleFacilityChange = useCallback((facilityId) => {
    setSelectedFacilityId(String(facilityId ?? ''))
  }, [])

  const handleYearMonthChange = useCallback(({ year, month }) => {
    const nextYear = Number(year)
    const nextMonth = Number(month)

    if (!Number.isInteger(nextYear) || nextYear < 1) {
      return
    }

    if (!Number.isInteger(nextMonth) || nextMonth < 1 || nextMonth > 12) {
      return
    }

    setSelectedYear(nextYear)
    setSelectedMonth(nextMonth)
  }, [])

return (
  <div className="h-screen bg-gray-50 p-4">
    <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <ResizableSplitPane
        defaultLeftPercent={70}
        minLeftWidth={500}
        minRightWidth={350}
        left={
          <div className="flex h-full min-h-0 min-w-0 flex-col">
            <HeaderComponent
              facilities={parameters.facilities}
              selectedFacilityId={selectedFacilityId}
              onFacilityChange={handleFacilityChange}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearMonthChange={handleYearMonthChange}
            />

            <LeftPanel
              loading={loading}
              error={error}
              attendanceData={attendanceData}
              additionCountLoading={additionCountLoading}
              additionCountError={additionCountError}
              additionCountData={additionCountData}
              additionListLoading={additionListLoading}
              additionListError={additionListError}
              additionListData={additionListData}
              comparisonLoading={comparisonLoading}
              comparisonError={comparisonError}
              comparisonData={comparisonData}
              targetDate={selectedTargetDate}
              onReload={reloadAll}
              onSync={syncAllToDatabase}
              syncing={syncing}
              syncMessage={syncMessage}
              syncError={syncError}
              webviewReady={webviewReady}
            />
          </div>
        }
        right={
          <div className="h-full min-h-0 min-w-0">
            <RightPanel
              webviewRef={sessionWebviewRef}
              webviewReady={webviewReady}
            />
          </div>
        }
      />
    </div>
  </div>
)
}
