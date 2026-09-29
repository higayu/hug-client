import { useCallback, useState } from 'react'
import AttendancePostButton from '../AttendancePostButton'
import MailNotificationModal from '../MailNotificationModal'
import { handleEnterClick } from './function/handleEnterClick'

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

export default function EnterButton({
  childId,
  childName,
  recordId = '',
  rowSelector = '',
  dateStr,
  hasMail = false,
  disabled = false,
  loading = false,
  title = '',
  onEnter,
}) {
  const [mailModalOpen, setMailModalOpen] = useState(false)
  const [mailModalLoading, setMailModalLoading] = useState(false)

  const executeEnter = useCallback(async () => {
    console.log('[EnterButton] RendererからHUG入室ボタンのDOM clickを実行', {
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      hasMail,
      hasOnEnter: typeof onEnter === 'function',
    })

    const result = await handleEnterClick({
      onEnter,
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

    console.log('[EnterButton] HUGメールモーダル検知判定', {
      hasMail,
      mailDialogDetected,
      result,
    })

    if (hasMail && mailDialogDetected) {
      setMailModalOpen(true)
    }

    return result
  }, [onEnter, childId, childName, recordId, rowSelector, dateStr, hasMail])

  const onClick = useCallback(() => {
    console.log('[EnterButton] renderer click', {
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      hasMail,
      disabled,
      loading,
    })

    return executeEnter()
  }, [executeEnter, childId, childName, recordId, rowSelector, dateStr, hasMail, disabled, loading])

  const handleMailSelect = useCallback(async (sendMail) => {
    if (typeof onEnter !== 'function') return

    setMailModalLoading(true)
    try {
      console.log('[EnterButton] Rendererメール選択 → HUGモーダルDOM click', {
        sendMail,
        childId,
        recordId,
      })

      const result = await onEnter({
        mailDialogAction: 'select',
        mailDialogChoice: Number(sendMail) === 1 ? 1 : 0,
        recordId,
        r_id: recordId,
        rowSelector,
      })

      console.log('[EnterButton] HUGメール選択結果', result)

      if (result?.success !== false) {
        setMailModalOpen(false)
      }
    } finally {
      setMailModalLoading(false)
    }
  }, [onEnter, childId, recordId, rowSelector])

  const handleMailCancel = useCallback(async () => {
    if (typeof onEnter !== 'function') {
      setMailModalOpen(false)
      return
    }

    setMailModalLoading(true)
    try {
      console.log('[EnterButton] Rendererメール選択キャンセル → HUGモーダルを閉じる')
      await onEnter({
        mailDialogAction: 'cancel',
        recordId,
        r_id: recordId,
        rowSelector,
      })
      setMailModalOpen(false)
    } finally {
      setMailModalLoading(false)
    }
  }, [onEnter, recordId, rowSelector])

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
        action="enter"
        hasMail={hasMail}
        disabled={disabled || mailModalOpen || mailModalLoading}
        loading={loading || mailModalLoading}
        title={debugTitle}
        onClick={onClick}
      />

      <MailNotificationModal
        open={mailModalOpen}
        childName={childName}
        actionLabel="入室"
        onSelect={handleMailSelect}
        onCancel={handleMailCancel}
      />
    </>
  )
}
