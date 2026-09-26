import { useCallback, useState } from 'react'
import AttendancePostButton from '../AttendancePostButton'
import MailNotificationModal from '../MailNotificationModal'
import { handleLeaveClick } from './function/handleLeaveClick'

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

  const executeLeave = useCallback(
    (mailFlg = null) =>
      handleLeaveClick({
        onLeave,
        childId,
        childName,
        dateStr,
        mailFlg,
      }),
    [onLeave, childId, childName, dateStr],
  )

  const onClick = useCallback(() => {
    if (hasMail) {
      setMailModalOpen(true)
      return
    }

    return executeLeave(null)
  }, [hasMail, executeLeave])

  const handleMailSelect = useCallback(
    async (mailFlg) => {
      setMailModalOpen(false)
      await executeLeave(mailFlg)
    },
    [executeLeave],
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
        action="leave"
        hasMail={hasMail}
        disabled={disabled || mailModalOpen}
        loading={loading}
        title={debugTitle}
        onClick={onClick}
      />

      <MailNotificationModal
        open={mailModalOpen}
        childName={childName}
        actionLabel="退室"
        onSelect={handleMailSelect}
        onCancel={() => setMailModalOpen(false)}
      />
    </>
  )
}
