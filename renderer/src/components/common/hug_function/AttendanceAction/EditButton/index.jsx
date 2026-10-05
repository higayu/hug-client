import { useCallback, useMemo, useState } from 'react'

import { ModalPortal } from '@/components/modals/ModalPortal.jsx'

import {
  openAttendanceEditPage,
  parseAttendanceEditHtml,
  saveAttendanceEditTimes,
} from './function.js'

const HOURS = Array.from({ length: 24 }, (_, index) => String(index))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index))

function TimeSelect({ label, hour, minute, onHourChange, onMinuteChange, disabled }) {
  return (
    <div className="hug-attendance-edit-time-row">
      <div className="hug-attendance-edit-time-label">{label}</div>

      <div className="hug-attendance-edit-time-selects">
        <select
          value={hour}
          onChange={(event) => onHourChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">--</option>
          {HOURS.map((value) => (
            <option key={value} value={value}>
              {value.padStart(2, '0')}
            </option>
          ))}
        </select>
        <span>時</span>

        <select
          value={minute}
          onChange={(event) => onMinuteChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">--</option>
          {MINUTES.map((value) => (
            <option key={value} value={value}>
              {value.padStart(2, '0')}
            </option>
          ))}
        </select>
        <span>分</span>
      </div>
    </div>
  )
}

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
  const [isOpening, setIsOpening] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editWebview, setEditWebview] = useState(null)
  const [editData, setEditData] = useState(null)

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
      setIsModalOpen(true)

      onOpened?.({
        ...result,
        parsed,
        name: resolvedName,
        locationHref: resolvedLocationHref,
      })
    } catch (error) {
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
    onSaved,
    onError,
  ])

  return (
    <>
      <button
        type="button"
        className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 hug-btn-attendance-edit"
        disabled={cannotOpen}
        title={resolvedTitle}
        onClick={handleClick}
      >
        {isOpening ? '取得中...' : '編集'}
      </button>

      {isModalOpen && (
        <ModalPortal>
          <div
            className="hug-attendance-edit-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleClose()
              }
            }}
          >
            <div
              className="hug-attendance-edit-modal"
              role="dialog"
              aria-modal="true"
              aria-label="入退室時間の編集"
            >
              <div className="hug-attendance-edit-header">
                <div>
                  <h2>入退室時間の編集</h2>
                  <p>{resolvedName || editData?.name || '名前未取得'}</p>
                </div>

                <button
                  type="button"
                  className="hug-attendance-edit-close"
                  onClick={handleClose}
                  disabled={isSaving}
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>

              <div className="hug-attendance-edit-body">
                {editData?.date && (
                  <div className="hug-attendance-edit-date">{editData.date}</div>
                )}

                <TimeSelect
                  label="入室時間"
                  hour={startHour}
                  minute={startMinute}
                  onHourChange={setStartHour}
                  onMinuteChange={setStartMinute}
                  disabled={isSaving}
                />

                <TimeSelect
                  label="退室時間"
                  hour={endHour}
                  minute={endMinute}
                  onHourChange={setEndHour}
                  onMinuteChange={setEndMinute}
                  disabled={isSaving}
                />
              </div>

              <div className="hug-attendance-edit-actions">
                <button
                  type="button"
                  className="hug-attendance-edit-cancel"
                  onClick={handleClose}
                  disabled={isSaving}
                >
                  キャンセル
                </button>

                <button
                  type="button"
                  className="hug-attendance-edit-save"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
