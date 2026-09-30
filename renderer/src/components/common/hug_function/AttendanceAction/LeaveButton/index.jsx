import { useCallback, useState } from 'react'
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

  const executeLeave = useCallback(async () => {
    console.log('[LeaveButton] RendererからHUG退室ボタンのDOM clickを実行', {
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      hasMail,
      hasOnLeave: typeof onLeave === 'function',
    })

    const result = await handleLeaveClick({
      onLeave,
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
    })

    const mailDialogDetected = Boolean(
      result?.mailDialogDetected ||
      result?.mailDialog?.detected ||
      result?.mailDialogResult?.detected,
    )

    console.log('[LeaveButton] HUGメールモーダル検知判定', {
      hasMail,
      mailDialogDetected,
      result,
    })

    if (hasMail && mailDialogDetected) {
      setMailModalOpen(true)
    }

    return result
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

    return executeLeave()
  }, [executeLeave, childId, childName, recordId, rowSelector, dateStr, hasMail, disabled, loading])

  const handleMailSelect = useCallback(async (sendMail) => {
    if (typeof onLeave !== 'function') return

    setMailModalLoading(true)
    try {
      console.log('[LeaveButton] Rendererメール選択 → HUGモーダルDOM click', {
        sendMail,
        childId,
        recordId,
      })

      const result = await onLeave({
        mailDialogAction: 'select',
        mailDialogChoice: Number(sendMail) === 1 ? 1 : 0,
        recordId,
        r_id: recordId,
        rowSelector,
      })

      console.log('[LeaveButton] HUGメール選択結果', result)

      if (result?.success !== false) {
        setMailModalOpen(false)
      }
    } finally {
      setMailModalLoading(false)
    }
  }, [onLeave, childId, recordId, rowSelector])

  const handleMailCancel = useCallback(async () => {
    if (typeof onLeave !== 'function') {
      setMailModalOpen(false)
      return
    }

    setMailModalLoading(true)
    try {
      console.log('[LeaveButton] Rendererメール選択キャンセル → HUGモーダルを閉じる')
      await onLeave({
        mailDialogAction: 'cancel',
        recordId,
        r_id: recordId,
        rowSelector,
      })
      setMailModalOpen(false)
    } finally {
      setMailModalLoading(false)
    }
  }, [onLeave, recordId, rowSelector])

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
        disabled={disabled || mailModalOpen || mailModalLoading}
        loading={loading || mailModalLoading}
        title={debugTitle}
        onClick={onClick}
      />

      <MailNotificationModal
        open={mailModalOpen}
        childName={childName}
        actionLabel="退室"
        onSelect={handleMailSelect}
        onCancel={handleMailCancel}
      />
    </>
  )
}
