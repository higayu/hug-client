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

  const reloadAll = useCallback(() => {
    fetchAttendance()
    fetchAdditionCount()
    fetchAdditionList()
  }, [fetchAttendance, fetchAdditionCount, fetchAdditionList])

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

  // 初回は MainWindow から渡された施設IDで取得。
  // Headerの施設・年月を変更すると共通条件が変わるため3タブすべて再取得される。
  useEffect(() => {
    if (!webviewReady || !selectedFacilityId) {
      return
    }

    setAttendanceData(null)
    setAdditionCountData(null)
    setAdditionListData(null)
    fetchAttendance()
    fetchAdditionCount()
    fetchAdditionList()
  }, [
    webviewReady,
    selectedFacilityId,
    fetchAttendance,
    fetchAdditionCount,
    fetchAdditionList,
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
      <div className="flex h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex w-[70%] min-w-0 flex-col border-r border-gray-200">
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
            targetDate={selectedTargetDate}
            onReload={reloadAll}
            webviewReady={webviewReady}
          />
        </div>

        <RightPanel
          webviewRef={sessionWebviewRef}
          webviewReady={webviewReady}
        />
      </div>
    </div>
  )
}
