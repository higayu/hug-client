import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import HeaderComponent from './HeaderComponent'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import { getWindowParameters } from './attendance'
import {
  buildAdditionCountPanelDataFromDb,
  buildAdditionListPanelDataFromDb,
  buildAttendancePanelDataFromDb,
} from './dbProfessionalSupport'
import ResizableSplitPane from '@/components/ui/ResizableSplitPane'
import { AppStateProvider, useAppState } from '@/AppStateContext'

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

function ProfessionalSupportWindowContent() {
  const { DEBUG_FLG } = useAppState()
  const sessionWebviewRef = useRef(null)
  const [sessionWebviewElement, setSessionWebviewElement] = useState(null)

  const handleSessionWebviewRef = useCallback((node) => {
    sessionWebviewRef.current = node
    setSessionWebviewElement((current) => (current === node ? current : node))
  }, [])
  const parameters = useMemo(getWindowParameters, [])

  // MainWindow から渡された現在選択中の施設IDを初期値にする。
  const [selectedFacilityId] = useState(
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
  const [comparisonData, setComparisonData] = useState([])
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState('')
  const [syncStatusChecked, setSyncStatusChecked] = useState(false)
  const [isMonthSynced, setIsMonthSynced] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)


  const fetchComparisonData = useCallback(async () => {
    if (!selectedFacilityId) {
      setComparisonData([])
      setAttendanceData(null)
      setAdditionCountData(null)
      setAdditionListData(null)
      setComparisonError('施設を選択してください。')
      setIsMonthSynced(false)
      setLastSyncedAt(null)
      setSyncStatusChecked(true)
      return { isCompleted: false }
    }

    const getApi =
      window.electronAPI?.laravel_procedure_getProfessionalSupportMonth

    if (typeof getApi !== 'function') {
      setComparisonData([])
      setComparisonError('月次比較取得APIがpreloadから公開されていません。')
      setIsMonthSynced(false)
      setLastSyncedAt(null)
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

      // Electron 側で Laravel のレスポンスがそのまま返る場合と、
      // data 配下に1段ラップされて返る場合の両方に対応する。
      const apiResult =
        result?.data &&
        typeof result.data === 'object' &&
        Object.prototype.hasOwnProperty.call(result.data, 'success')
          ? result.data
          : result

      if (!apiResult?.success) {
        throw new Error(
          apiResult?.message ||
            apiResult?.error ||
            result?.message ||
            result?.error ||
            '月次比較データの取得に失敗しました。',
        )
      }

      const responseData = apiResult?.data ?? {}
      const responseMeta = apiResult?.meta ?? responseData?.meta ?? {}

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

      const completedValue =
        responseMeta?.isCompleted ?? responseMeta?.is_completed

      const syncedAt =
        responseMeta?.syncedAt ??
        responseMeta?.synced_at ??
        responseData?.sync?.syncedAt ??
        responseData?.sync?.synced_at ??
        responseData?.syncedAt ??
        responseData?.synced_at ??
        null
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
      setLastSyncedAt(syncedAt)

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
        syncedAt,
      }
    } catch (comparisonFetchError) {
      console.error(
        '[ProfessionalSupportWindow] 月次比較データ取得エラー:',
        comparisonFetchError,
      )
      setComparisonData([])
      setIsMonthSynced(false)
      setLastSyncedAt(null)
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

  useEffect(() => {
    const webview = sessionWebviewElement

    if (!webview) {
      setWebviewReady(false)
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

    // ResizableSplitPane 配下で effect 登録前に dom-ready 済みでも、
    // 現在ページが存在すれば利用可能として扱う。
    try {
      if (typeof webview.getURL === 'function' && webview.getURL()) {
        setWebviewReady(true)
      }
    } catch (readyCheckError) {
      console.debug(
        '[ProfessionalSupportWindow] WebView ready確認待ち:',
        readyCheckError,
      )
    }

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('did-start-loading', handleDidStartLoading)
    }
  }, [sessionWebviewElement])

  // 施設・年月が変わったら、HUGより先にDB同期状態を確認する。
  useEffect(() => {
    setAttendanceData(null)
    setAdditionCountData(null)
    setAdditionListData(null)
    setError('')
    setAdditionCountError('')
    setAdditionListError('')
    setSyncStatusChecked(false)
    setIsMonthSynced(false)
    setLastSyncedAt(null)

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

  const handleSyncFetchStart = useCallback(() => {
    setLoading(true)
    setAdditionCountLoading(true)
    setAdditionListLoading(true)
    setError('')
    setAdditionCountError('')
    setAdditionListError('')
  }, [])

  const handleSyncFetched = useCallback(({
    attendanceData: nextAttendanceData,
    additionCountData: nextAdditionCountData,
    additionListData: nextAdditionListData,
  }) => {
    setAttendanceData(nextAttendanceData)
    setAdditionCountData(nextAdditionCountData)
    setAdditionListData(nextAdditionListData)
    setLoading(false)
    setAdditionCountLoading(false)
    setAdditionListLoading(false)
  }, [])

  const handleSyncFetchFailed = useCallback((message) => {
    setLoading(false)
    setAdditionCountLoading(false)
    setAdditionListLoading(false)

    setError(message)
    setAdditionCountError(message)
    setAdditionListError(message)
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

const leftContent = (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <HeaderComponent
        facilities={parameters.facilities}
        selectedFacilityId={selectedFacilityId}
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
        webviewRef={sessionWebviewRef}
        webviewReady={webviewReady}
        facilityId={selectedFacilityId}
        year={selectedYear}
        month={selectedMonth}
        syncStatusChecked={syncStatusChecked}
        isMonthSynced={isMonthSynced}
        lastSyncedAt={lastSyncedAt}
        onSyncFetchStart={handleSyncFetchStart}
        onSyncFetched={handleSyncFetched}
        onSyncFetchFailed={handleSyncFetchFailed}
        onSyncCompleted={fetchComparisonData}
      />
    </div>
  )

  const webviewContent = (
    <RightPanel
      webviewRef={handleSessionWebviewRef}
      webviewReady={webviewReady}
    />
  )

  return (
    <div className="h-screen bg-gray-50 p-4">
      <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {DEBUG_FLG ? (
          <ResizableSplitPane
            defaultLeftPercent={70}
            minLeftWidth={500}
            minRightWidth={350}
            left={leftContent}
            right={
              <div className="h-full min-h-0 min-w-0">
                {webviewContent}
              </div>
            }
          />
        ) : (
          <>
            {leftContent}

            {/*
              HUGへのPOST送信用WebView。
              通常モードでもDOMから外さず、画面外に配置してセッションを維持する。
            */}
            <div
              className="pointer-events-none fixed opacity-0"
              style={{
                left: '-10000px',
                top: 0,
                width: '1024px',
                height: '768px',
              }}
              aria-hidden="true"
            >
              {webviewContent}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProfessionalSupportWindow() {
  return (
    <AppStateProvider>
      <ProfessionalSupportWindowContent />
    </AppStateProvider>
  )
}
