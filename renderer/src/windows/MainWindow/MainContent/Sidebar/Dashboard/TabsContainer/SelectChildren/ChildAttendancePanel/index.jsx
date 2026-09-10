import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useAppState } from '@/AppStateContext'
import {
  clickEnterButton,
  clickAbsenceButton,
  clickExitButton,
} from '@/utils/attendance/index.js'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import AttendanceActionSection from './AttendanceActionSection'
import { isAttendanceDataLoaded } from '@/utils/attendance/helpers/attendanceStatus.js'
import './index.css'
import PersonalRecordCheckPanel from '@/components/common/hug_function/PersonalRecordCheckPanel'
import ProfessionalSupportCheckPanel2 from '@/components/common/hug_function/ProfessionalSupportCheckPanel2'
import GetTodayUsersChildren from '@/components/common/hug_function/GetTodayUsersChildren'

const pickValue = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value
    }
  }

  return null
}

const isTimeFormat = (value) => {
  if (typeof value !== 'string') {
    return false
  }

  return /^\d{2}:\d{2}$/.test(value.trim())
}

export default function ChildAttendancePanel() {
  const dispatch = useDispatch()
  const appStateValue = useAppState()

  const {
    appState,
    attendanceData,
    setSelectedChildColumns,
    updateAppState,
    CURRENT_YMD,
    FACILITY_ID,

    SELECT_CHILD,
    SELECT_CHILD_NAME,

    // 新名称
    week_children,
    waiting_children,
    Experience_children,

    // 旧名称との互換用
    childrenData,
    waiting_childrenData,
    Experience_childrenData,
  } = appStateValue

  const {
    showSuccessToast,
    showErrorToast,
  } = useToast()

  const isStop = false

  // =============================================================
  // 選択中児童ID
  // =============================================================
  const selectChild = pickValue(
    SELECT_CHILD,
    appState?.SELECT_CHILD,
    ''
  )

  // =============================================================
  // AppState の児童リストを安全に配列化
  // 新名称を優先し、なければ旧名称を見る
  // =============================================================
  const weekChildrenData = useMemo(() => {
    if (Array.isArray(week_children)) {
      return week_children
    }

    if (Array.isArray(childrenData)) {
      return childrenData
    }

    return []
  }, [week_children, childrenData])

  const waitingChildrenData = useMemo(() => {
    if (Array.isArray(waiting_children)) {
      return waiting_children
    }

    if (Array.isArray(waiting_childrenData)) {
      return waiting_childrenData
    }

    return []
  }, [waiting_children, waiting_childrenData])

  const experienceChildrenData = useMemo(() => {
    if (Array.isArray(Experience_children)) {
      return Experience_children
    }

    if (Array.isArray(Experience_childrenData)) {
      return Experience_childrenData
    }

    return []
  }, [Experience_children, Experience_childrenData])

  // =============================================================
  // attendanceData を安全に配列化
  // attendanceData が配列の場合 / { data: [] } の場合の両方に対応
  // =============================================================
  const attendanceList = useMemo(() => {
    if (Array.isArray(attendanceData)) {
      return attendanceData
    }

    if (Array.isArray(attendanceData?.data)) {
      return attendanceData.data
    }

    return []
  }, [attendanceData])

  // =============================================================
  // 選択児童の attendanceData
  // =============================================================
  const attendanceItem = useMemo(() => {
    if (!selectChild) {
      return null
    }

    return (
      attendanceList.find(
        (item) => String(item?.children_id) === String(selectChild)
      ) || null
    )
  }, [selectChild, attendanceList])

  // =============================================================
  // 選択児童の基本情報
  // AppState の児童リストから探す
  // =============================================================
  const selectedChildData = useMemo(() => {
    if (!selectChild) {
      return null
    }

    return (
      weekChildrenData.find(
        (child) => String(child?.children_id) === String(selectChild)
      ) ||
      waitingChildrenData.find(
        (child) => String(child?.children_id) === String(selectChild)
      ) ||
      experienceChildrenData.find(
        (child) => String(child?.children_id) === String(selectChild)
      ) ||
      null
    )
  }, [
    selectChild,
    weekChildrenData,
    waitingChildrenData,
    experienceChildrenData,
  ])

  // =============================================================
  // 表示用の選択児童
  // 重要:
  // - selectedChildData が null でも SELECT_CHILD があればパネル表示を続行する
  // - 左リストの表示用 state には児童がいるが、AppState の児童リストにいない場合があるため
  // =============================================================
  const selectedChildForDisplay = useMemo(() => {
    if (selectedChildData) {
      return selectedChildData
    }

    if (!selectChild) {
      return null
    }

    return {
      children_id: selectChild,
      children_name: pickValue(
        SELECT_CHILD_NAME,
        appState?.SELECT_CHILD_NAME,
        attendanceItem?.children_name,
        ''
      ),
      pc_name: pickValue(
        attendanceItem?.pc_name,
        ''
      ),
    }
  }, [
    selectedChildData,
    selectChild,
    SELECT_CHILD_NAME,
    appState?.SELECT_CHILD_NAME,
    attendanceItem,
  ])

  const [isUIEnabled, setIsUIEnabled] = useState(false)
  const [loadingAction, setLoadingAction] = useState(null)

  // =============================================================
  // AppState 側の選択児童カラム
  // =============================================================
  const selectedColumn5 = pickValue(
    appStateValue?.SELECTED_CHILD_COLUMN5,
    appState?.SELECTED_CHILD_COLUMN5
  )

  const selectedColumn5Html = pickValue(
    appStateValue?.SELECTED_CHILD_COLUMN5_HTML,
    appState?.SELECTED_CHILD_COLUMN5_HTML
  )

  const selectedColumn6 = pickValue(
    appStateValue?.SELECTED_CHILD_COLUMN6,
    appState?.SELECTED_CHILD_COLUMN6
  )

  const selectedColumn6Html = pickValue(
    appStateValue?.SELECTED_CHILD_COLUMN6_HTML,
    appState?.SELECTED_CHILD_COLUMN6_HTML
  )

  // =============================================================
  // 表示に使う column 値
  // 重要:
  // - AppState側が "" の場合は無効扱い
  // - attendanceItem側の columnHtml にフォールバックする
  // =============================================================
  const column5 = pickValue(
    selectedColumn5,
    attendanceItem?.column5
  )

  const column5Html = pickValue(
    selectedColumn5Html,
    attendanceItem?.column5Html
  )

  const column6 = pickValue(
    selectedColumn6,
    attendanceItem?.column6
  )

  const column6Html = pickValue(
    selectedColumn6Html,
    attendanceItem?.column6Html
  )

  // =============================================================
  // attendanceData 読み込み状態
  // =============================================================
  const isAttendanceLoaded = isAttendanceDataLoaded(attendanceData)

  const hasChildAttendance = Boolean(attendanceItem)

  const isAbsent =
    typeof column5 === 'string' && column5.startsWith('欠席')

  const hasEntered = isTimeFormat(column5)
  const hasExited = isTimeFormat(column6)

  const facilityId = pickValue(
    FACILITY_ID,
    appState?.FACILITY_ID,
    '1'
  )

  const dateStr = pickValue(
    CURRENT_YMD,
    appState?.CURRENT_YMD
  )

  const childName = pickValue(
    selectedChildForDisplay?.children_name,
    SELECT_CHILD_NAME,
    appState?.SELECT_CHILD_NAME,
    attendanceItem?.children_name,
    ''
  )

  // =============================================================
  // 選択児童の attendanceData を AppState に反映
  // =============================================================
  useEffect(() => {
    if (!selectChild || !attendanceItem) {
      setIsUIEnabled(false)

      setSelectedChildColumns({
        column5: null,
        column5Html: null,
        column6: null,
        column6Html: null,
      })

      return
    }

    setIsUIEnabled(true)

    setSelectedChildColumns({
      column5: pickValue(attendanceItem.column5),
      column5Html: pickValue(attendanceItem.column5Html),
      column6: pickValue(attendanceItem.column6),
      column6Html: pickValue(attendanceItem.column6Html),
    })
  }, [
    selectChild,
    attendanceItem,
    setSelectedChildColumns,
  ])

  // =============================================================
  // 入退室ボタン調査ログ
  // =============================================================
  useEffect(() => {
    console.group('[ChildAttendancePanel] 入退室ボタン調査')

    console.log('selectChild:', selectChild)
    console.log('SELECT_CHILD:', SELECT_CHILD)
    console.log('SELECT_CHILD_NAME:', SELECT_CHILD_NAME)
    console.log('childName:', childName)
    console.log('dateStr:', dateStr)
    console.log('facilityId:', facilityId)

    console.log('attendanceData raw:', attendanceData)
    console.log('attendanceList count:', attendanceList.length)
    console.log('attendanceItem:', attendanceItem)

    console.log('selectedChildData:', selectedChildData)
    console.log('selectedChildForDisplay:', selectedChildForDisplay)

    console.log('children list counts:', {
      weekChildrenDataCount: weekChildrenData.length,
      waitingChildrenDataCount: waitingChildrenData.length,
      experienceChildrenDataCount: experienceChildrenData.length,
    })

    console.log('AppState selected columns:', {
      selectedColumn5,
      selectedColumn5Html,
      selectedColumn6,
      selectedColumn6Html,
    })

    console.log('attendanceItem columns:', {
      attendanceColumn5: attendanceItem?.column5,
      attendanceColumn5Html: attendanceItem?.column5Html,
      attendanceColumn6: attendanceItem?.column6,
      attendanceColumn6Html: attendanceItem?.column6Html,
    })

    console.log('final columns:', {
      column5,
      column5Html,
      column6,
      column6Html,
    })

    console.log('status flags:', {
      isAttendanceLoaded,
      hasChildAttendance,
      isUIEnabled,
      isAbsent,
      hasEntered,
      hasExited,
      loadingAction,
    })

    console.log('button source check:', {
      hasColumn5Html: Boolean(column5Html),
      hasColumn6Html: Boolean(column6Html),
      column5HtmlType: typeof column5Html,
      column6HtmlType: typeof column6Html,
      column5HtmlLength:
        typeof column5Html === 'string' ? column5Html.length : null,
      column6HtmlLength:
        typeof column6Html === 'string' ? column6Html.length : null,
    })

    console.groupEnd()
  }, [
    selectChild,
    SELECT_CHILD,
    SELECT_CHILD_NAME,
    childName,
    dateStr,
    facilityId,
    attendanceData,
    attendanceList,
    attendanceItem,
    selectedChildData,
    selectedChildForDisplay,
    weekChildrenData,
    waitingChildrenData,
    experienceChildrenData,
    selectedColumn5,
    selectedColumn5Html,
    selectedColumn6,
    selectedColumn6Html,
    column5,
    column5Html,
    column6,
    column6Html,
    isAttendanceLoaded,
    hasChildAttendance,
    isUIEnabled,
    isAbsent,
    hasEntered,
    hasExited,
    loadingAction,
  ])

  // =============================================================
  // 共通レイアウト
  // =============================================================
  const renderPanelShell = (content) => {
    return (
      <div className="child-memo-panel flex-1 border-l border-gray-300 bg-gray-50 flex flex-col">
        <div className="shrink-0 border-b border-gray-200 bg-white">
          <div className="flex flex-row items-center justify-center">
            <GetTodayUsersChildren expandDirection="down"/>
          </div>
        </div>

        {content}
      </div>
    )
  }

  // =============================================================
  // 未選択
  // 重要:
  // - selectedChildData が null でも selectChild があれば表示を続行する
  // - ここで止めると、左リストで選択済みでも Please select a child. になる
  // =============================================================
  if (!selectChild) {
    return renderPanelShell(
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="text-sm text-gray-500 text-center">
          Please select a child.
        </div>
      </div>
    )
  }

  // =============================================================
  // 今日の利用者データ未取得
  // =============================================================
  if (!isAttendanceLoaded) {
    return renderPanelShell(
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="border rounded-md px-2 py-1 text-xl font-bold text-red-600">
          今日の利用者データを取得してください
        </p>
      </div>
    )
  }

  // =============================================================
  // 入室
  // =============================================================
  const runEnter = async () => {
    if (!column5Html) {
      console.warn('[ChildAttendancePanel/runEnter] column5Html が空です', {
        selectChild,
        childName,
        column5,
        column5Html,
        attendanceColumn5Html: attendanceItem?.column5Html,
        selectedColumn5Html,
      })

      showErrorToast('入室ボタン情報がありません')
      return
    }

    setLoadingAction('enter')

    try {
      console.group('[ChildAttendancePanel/runEnter] START')
      console.log('selectChild:', selectChild)
      console.log('childName:', childName)
      console.log('column5:', column5)
      console.log('column5Html:', column5Html)
      console.log('column6:', column6)
      console.log('column6Html:', column6Html)
      console.log('facilityId:', facilityId)
      console.log('dateStr:', dateStr)

      const res = await clickEnterButton(column5Html, Number(selectChild), {
        children_name: childName,
        column5,
        column6,
        column6Html,
        facilityId,
        dateStr,
        dispatch,
        updateAppState,
      })

      console.log('clickEnterButton result:', res)
      console.groupEnd()

      if (res?.cancelled) return

      if (!res?.success) {
        showErrorToast(res?.error || '入室に失敗しました')
        return
      }

      if (res?.attendanceItem) {
        setSelectedChildColumns({
          column5: pickValue(res.attendanceItem.column5),
          column5Html: pickValue(res.attendanceItem.column5Html),
          column6: pickValue(res.attendanceItem.column6),
          column6Html: pickValue(res.attendanceItem.column6Html),
        })
      }
    } catch (error) {
      console.error('Enter action error', error)
      showErrorToast(String(error?.message || error))
    } finally {
      setLoadingAction(null)
    }
  }

  // =============================================================
  // 退室
  // =============================================================
  const runLeave = async () => {
    if (!column6Html) {
      console.warn('[ChildAttendancePanel/runLeave] column6Html が空です', {
        selectChild,
        childName,
        column5,
        column6,
        column6Html,
        attendanceColumn6Html: attendanceItem?.column6Html,
        selectedColumn6Html,
      })

      showErrorToast('退室ボタン情報がありません')
      return
    }

    setLoadingAction('leave')

    try {
      console.group('[ChildAttendancePanel/runLeave] START')
      console.log('selectChild:', selectChild)
      console.log('childName:', childName)
      console.log('column5:', column5)
      console.log('column5Html:', column5Html)
      console.log('column6:', column6)
      console.log('column6Html:', column6Html)
      console.log('facilityId:', facilityId)
      console.log('dateStr:', dateStr)

      const res = await clickExitButton(column6Html, Number(selectChild), {
        enterTime: column5,
        children_name: childName,
        column5,
        column5Html,
        column6,
        facilityId,
        dateStr,
        dispatch,
        updateAppState,
      })

      console.log('clickExitButton result:', res)
      console.groupEnd()

      if (res?.cancelled) return

      if (!res?.success) {
        showErrorToast(res?.error || '退室に失敗しました')
        return
      }

      if (res?.attendanceItem) {
        setSelectedChildColumns({
          column5: pickValue(res.attendanceItem.column5),
          column5Html: pickValue(res.attendanceItem.column5Html),
          column6: pickValue(res.attendanceItem.column6),
          column6Html: pickValue(res.attendanceItem.column6Html),
        })
      }
    } catch (error) {
      console.error('Exit action error', error)
      showErrorToast(String(error?.message || error))
    } finally {
      setLoadingAction(null)
    }
  }

  // =============================================================
  // 欠席
  // =============================================================
  const runAbsence = async () => {
    if (!column5Html) {
      console.warn('[ChildAttendancePanel/runAbsence] column5Html が空です', {
        selectChild,
        childName,
        column5,
        column5Html,
        attendanceColumn5Html: attendanceItem?.column5Html,
        selectedColumn5Html,
      })

      showErrorToast('欠席ボタン情報がありません')
      return
    }

    setLoadingAction('absence')

    try {
      console.group('[ChildAttendancePanel/runAbsence] START')
      console.log('selectChild:', selectChild)
      console.log('childName:', childName)
      console.log('column5:', column5)
      console.log('column5Html:', column5Html)

      const res = await clickAbsenceButton(column5Html, Number(selectChild))

      console.log('clickAbsenceButton result:', res)
      console.groupEnd()

      if (res?.success) {
        showSuccessToast('欠席モーダルを開きました')
      } else {
        showErrorToast(res?.error || '欠席モーダル表示に失敗しました')
      }
    } catch (error) {
      console.error('Absence action error', error)
      showErrorToast(String(error?.message || error))
    } finally {
      setLoadingAction(null)
    }
  }

  // =============================================================
  // JSX
  // =============================================================
  return renderPanelShell(
    <div className="flex-1 min-h-0 overflow-y-auto p-2">
      <div className="child-memo-attendance-form flex flex-col rounded bg-white border border-gray-300 gap-2 p-2">
        {hasChildAttendance ? (
          <AttendanceActionSection
            childId={selectChild}
            childName={childName}
            dateStr={dateStr}
            column5={column5}
            column5Html={column5Html}
            column6={column6}
            column6Html={column6Html}
            isAbsent={isAbsent}
            hasEntered={hasEntered}
            hasExited={hasExited}
            isUIEnabled={isUIEnabled}
            isStop={isStop}
            loadingAction={loadingAction}
            onEnter={runEnter}
            onLeave={runLeave}
            onAbsence={runAbsence}
          />
        ) : (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-sm font-medium text-amber-800">
              この児童のデータが見つかりません
            </p>
            <p className="text-xs text-amber-700 mt-1">
              データを再取得するか、別の児童を選択してください
            </p>
          </div>
        )}
      </div>

      <PersonalRecordCheckPanel className="py-2" />

      <ProfessionalSupportCheckPanel2
        logTag="ChildAttendancePanel"
        className="mt-2 w-full items-stretch px-0"
        labelClassName="w-full"
      />
    </div>
  )
}