import { useCallback, useMemo, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { useDispatch } from 'react-redux'

import { useAppState } from '@/AppStateContext'

import {
  openAttendanceEditPage,
  parseAttendanceEditHtml,
  saveAttendanceEditTimes,
} from './function.js'
import { runAttendanceUpdate } from '../attendance/update/runAttendanceUpdate.js'
import AttendanceEditModal from './AttendanceEditModal.jsx'

/**
 * 入退室時刻の編集ボタン。
 *
 * 同じ行から取得した以下2つを直接受け取る。
 * - name         : 児童名
 * - locationHref : HUG本体の location.href の遷移先
 *
 * 押下時:
 * 1. HUG編集画面をGET
 * 2. HTMLから s_hour / s_min / e_hour / e_min を取得
 * 3. Renderer側にModalPortalで編集モーダルを表示
 * 4. 保存時にHUG編集フォームへ反映して requestSubmit()
 */
export default function EditButton({
  name = '',
  locationHref = '',

  // 旧propsとの互換用
  childName = '',
  editUrl = '',

  webview = null,
  disabled = false,
  title = '',
  onOpened = null,
  onSaved = null,
  onError = null,
}) {
  const dispatch = useDispatch()
  const { FACILITY_ID, CURRENT_YMD } = useAppState()

  const [isOpening, setIsOpening] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editWebview, setEditWebview] = useState(null)
  const [editData, setEditData] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [startHour, setStartHour] = useState('')
  const [startMinute, setStartMinute] = useState('')
  const [endHour, setEndHour] = useState('')
  const [endMinute, setEndMinute] = useState('')

  const resolvedName = String(name || childName || '').trim()
  const resolvedLocationHref = String(locationHref || editUrl || '').trim()

  const resolvedTitle = useMemo(() => {
    if (title) return title

    return [
      `名前: ${resolvedName || '(未取得)'}`,
      `location.href: ${resolvedLocationHref || '(未取得)'}`,
    ].join('\n')
  }, [title, resolvedName, resolvedLocationHref])

  const cannotOpen = disabled || isOpening || isSaving || !resolvedLocationHref

  const handleClick = useCallback(async () => {
    if (cannotOpen) return

    // 編集ボタンを押した時点で先にRenderer側モーダルを表示する。
    // HUG編集画面のGET中はモーダル内で「取得中」を表示する。
    setLoadError('')
    setEditData(null)
    setStartHour('')
    setStartMinute('')
    setEndHour('')
    setEndMinute('')
    setIsModalOpen(true)
    setIsOpening(true)

    try {
      const result = await openAttendanceEditPage({
        editUrl: resolvedLocationHref,
        webview,
      })

      const parsed = parseAttendanceEditHtml(result.html)

      console.log('[Attendance Edit] HTML解析結果:', parsed)

      setEditWebview(result.webview || webview || null)
      setEditData(parsed)
      setStartHour(parsed.startHour ?? '')
      setStartMinute(parsed.startMinute ?? '')
      setEndHour(parsed.endHour ?? '')
      setEndMinute(parsed.endMinute ?? '')

      onOpened?.({
        ...result,
        parsed,
        name: resolvedName,
        locationHref: resolvedLocationHref,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error || '編集画面の取得に失敗しました')

      setLoadError(message)

      console.error('[Attendance Edit] 編集画面取得失敗:', {
        name: resolvedName,
        locationHref: resolvedLocationHref,
        error,
      })
      onError?.(error)
    } finally {
      setIsOpening(false)
    }
  }, [
    cannotOpen,
    resolvedLocationHref,
    resolvedName,
    webview,
    onOpened,
    onError,
  ])

  const handleClose = useCallback(() => {
    if (isSaving) return
    setIsModalOpen(false)
    setLoadError('')
  }, [isSaving])

  const handleSave = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)

    try {
      const values = {
        startHour,
        startMinute,
        endHour,
        endMinute,
      }

      const result = await saveAttendanceEditTimes({
        ...values,
        webview: editWebview || webview,
      })

      console.log('[Attendance Edit] 保存処理実行:', result)

      const refreshFacilityId =
        editData?.facilityId || FACILITY_ID || '1'
      const refreshDateStr =
        editData?.date || CURRENT_YMD || new Date().toISOString().slice(0, 10)

      console.log('[Attendance Edit] 保存後の利用者一覧を再取得:', {
        facilityId: refreshFacilityId,
        dateStr: refreshDateStr,
        childId: editData?.childId,
      })

      await runAttendanceUpdate({
        facilityId: refreshFacilityId,
        dateStr: refreshDateStr,
        dispatch,
        silent: false,
      })

      console.log('[Attendance Edit] 保存後の利用者一覧再取得完了')

      setIsModalOpen(false)

      onSaved?.({
        ...result,
        values,
        editData,
        name: resolvedName,
        locationHref: resolvedLocationHref,
      })
    } catch (error) {
      console.error('[Attendance Edit] 保存失敗:', error)
      onError?.(error)
    } finally {
      setIsSaving(false)
    }
  }, [
    isSaving,
    startHour,
    startMinute,
    endHour,
    endMinute,
    editWebview,
    webview,
    editData,
    resolvedName,
    resolvedLocationHref,
    FACILITY_ID,
    CURRENT_YMD,
    dispatch,
    onSaved,
    onError,
  ])

  return (
    <>
      <button
        type="button"
        className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 hug-btn-attendance-edit inline-flex items-center gap-1.5"
        disabled={cannotOpen}
        title={resolvedTitle}
        onClick={handleClick}
      >
        <Clock3 size={16} aria-hidden="true" />
        <span>{isOpening ? '取得中...' : '編集'}</span>
      </button>

      <AttendanceEditModal
        open={isModalOpen}
        name={resolvedName}
        editData={editData}
        isOpening={isOpening}
        isSaving={isSaving}
        loadError={loadError}
        startHour={startHour}
        startMinute={startMinute}
        endHour={endHour}
        endMinute={endMinute}
        onStartHourChange={setStartHour}
        onStartMinuteChange={setStartMinute}
        onEndHourChange={setEndHour}
        onEndMinuteChange={setEndMinute}
        onClose={handleClose}
        onSave={handleSave}
      />
    </>
  )
}
