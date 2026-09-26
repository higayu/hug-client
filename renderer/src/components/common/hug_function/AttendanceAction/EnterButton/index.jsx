import { useCallback, useState } from 'react'
import AttendancePostButton from '../AttendancePostButton'
import MailNotificationModal from '../MailNotificationModal'
import { handleEnterClick } from './function/handleEnterClick'

function buildDebugTitle({ title, childId, childName, recordId, rowSelector }) {
  return [
    childName ? `児童名：${childName}` : null,
    childId ? `児童ID：${childId}` : null,
    recordId ? `HUG行ID：${recordId}` : null,
    rowSelector ? `HUG行：${rowSelector}` : null,
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

  const executeEnter = useCallback(
    (mailFlg = null) =>
      handleEnterClick({
        onEnter,
        childId,
        childName,
        dateStr,
        mailFlg,
      }),
    [onEnter, childId, childName, dateStr],
  )

  const onClick = useCallback(() => {
    if (hasMail) {
      setMailModalOpen(true)
      return
    }

    return executeEnter(null)
  }, [hasMail, executeEnter])

  const handleMailSelect = useCallback(
    async (mailFlg) => {
      setMailModalOpen(false)
      await executeEnter(mailFlg)
    },
    [executeEnter],
  )

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
        disabled={disabled || mailModalOpen}
        loading={loading}
        title={debugTitle}
        onClick={onClick}
      />

      <MailNotificationModal
        open={mailModalOpen}
        childName={childName}
        actionLabel="入室"
        onSelect={handleMailSelect}
        onCancel={() => setMailModalOpen(false)}
      />
    </>
  )
}
