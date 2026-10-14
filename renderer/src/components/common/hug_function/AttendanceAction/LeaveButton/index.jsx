import { useCallback, useRef, useState } from 'react'
import AttendancePostButton from '../AttendancePostButton'
import MailNotificationModal from '../MailNotificationModal'
import { handleLeaveClick } from './function/handleLeaveClick'

function buildDebugTitle({ title, childId, childName, recordId, rowSelector }) {
  return [
    childName ? `児童名：${childName}` : null,
    childId ? `児童ID：${childId}` : null,
    `r_id：${recordId || '未取得'}`,
    `rowSelector：${rowSelector || '未取得'}`,
    title || null,
  ]
    .filter(Boolean)
    .join(' / ')
}

export default function LeaveButton({
  childId,
  childName,
  recordId = '',
  rowSelector = '',
  dateStr,
  hasMail = false,
  disabled = false,
  loading = false,
  title = '',
  onLeave,
}) {
  const [mailModalOpen, setMailModalOpen] = useState(false)
  const [mailModalLoading, setMailModalLoading] = useState(false)
  const [directLoading, setDirectLoading] = useState(false)
  const inFlightRef = useRef(false)

  const executeLeave = useCallback(async (mailFlg = 0) => {
    console.log('[LeaveButton] 退室処理を実行', {
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      hasMail,
      mailFlg,
      hasOnLeave: typeof onLeave === 'function',
    })

    return handleLeaveClick({
      onLeave,
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      mailFlg,
    })
  }, [onLeave, childId, childName, recordId, rowSelector, dateStr, hasMail])

  const onClick = useCallback(() => {
    console.log('[LeaveButton] renderer click', {
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      hasMail,
      disabled,
      loading,
    })

    if (inFlightRef.current || disabled || loading || mailModalOpen) return undefined

    // メール通知対象の場合はRenderer側モーダルを先に表示する。
    // 選択後にHUG側の実ボタンをclickし、HUGモーダルをMutationObserverで検知して自動選択する。
    if (hasMail) {
      setMailModalOpen(true)
      return undefined
    }

    inFlightRef.current = true
    setDirectLoading(true)
    return Promise.resolve()
      .then(() => executeLeave(0))
      .finally(() => {
        inFlightRef.current = false
        setDirectLoading(false)
      })
  }, [executeLeave, childId, childName, recordId, rowSelector, dateStr, hasMail, disabled, loading, mailModalOpen])

  const handleMailSelect = useCallback(async (sendMail) => {
    if (inFlightRef.current || typeof onLeave !== 'function') return
    inFlightRef.current = true

    const mailFlg = Number(sendMail) === 1 ? 1 : 0

    setMailModalLoading(true)
    try {
      console.log('[LeaveButton] Rendererメール選択 → HUG退室ボタン実行', {
        mailFlg,
        childId,
        recordId,
      })

      const result = await executeLeave(mailFlg)

      console.log('[LeaveButton] 退室メール選択反映結果', result)

      if (result?.success !== false) {
        setMailModalOpen(false)
      }
    } finally {
      inFlightRef.current = false
      setMailModalLoading(false)
    }
  }, [onLeave, executeLeave, childId, recordId])

  const handleMailCancel = useCallback(() => {
    // HUG側ボタンはまだ押していないため、Rendererモーダルを閉じるだけでよい。
    if (inFlightRef.current) return
    setMailModalOpen(false)
  }, [])

  const debugTitle = buildDebugTitle({
    title,
    childId,
    childName,
    recordId,
    rowSelector,
  })

  return (
    <>
      <AttendancePostButton
        action="leave"
        hasMail={hasMail}
        disabled={disabled || mailModalOpen || mailModalLoading || directLoading}
        loading={loading || mailModalLoading || directLoading}
        title={debugTitle}
        onClick={onClick}
      />

      <MailNotificationModal
        open={mailModalOpen}
        childName={childName}
        actionLabel="退室"
        onSelect={handleMailSelect}
        onCancel={handleMailCancel}
        loading={mailModalLoading}
      />
    </>
  )
}
