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

  const executeEnter = useCallback(async (mailFlg = 0) => {
    console.log('[EnterButton] 入室処理を実行', {
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      hasMail,
      mailFlg,
      hasOnEnter: typeof onEnter === 'function',
    })

    return handleEnterClick({
      onEnter,
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      mailFlg,
    })
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

    // メール通知対象の場合はRenderer側モーダルを先に表示する。
    // 選択後にHUG側の実ボタンをclickし、HUGモーダルをMutationObserverで検知して自動選択する。
    if (hasMail) {
      setMailModalOpen(true)
      return undefined
    }

    return executeEnter(0)
  }, [executeEnter, childId, childName, recordId, rowSelector, dateStr, hasMail, disabled, loading])

  const handleMailSelect = useCallback(async (sendMail) => {
    if (typeof onEnter !== 'function') return

    const mailFlg = Number(sendMail) === 1 ? 1 : 0

    setMailModalLoading(true)
    try {
      console.log('[EnterButton] Rendererメール選択 → HUG入室ボタン実行', {
        mailFlg,
        childId,
        recordId,
      })

      const result = await executeEnter(mailFlg)

      console.log('[EnterButton] 入室メール選択反映結果', result)

      if (result?.success !== false) {
        setMailModalOpen(false)
      }
    } finally {
      setMailModalLoading(false)
    }
  }, [onEnter, executeEnter, childId, recordId])

  const handleMailCancel = useCallback(() => {
    // HUG側ボタンはまだ押していないため、Rendererモーダルを閉じるだけでよい。
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
