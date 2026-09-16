import { useCallback, useState } from 'react'
import AttendancePostButton from '../AttendancePostButton'
import MailNotificationModal from '../MailNotificationModal'
import { handleLeaveClick } from './function/handleLeaveClick'

export default function LeaveButton({
  childId,
  childName,
  dateStr,
  hasMail = false,
  disabled = false,
  loading = false,
  title = '',
  onLeave,
}) {
  const [showMailModal, setShowMailModal] = useState(false)

  const executeLeave = useCallback(
    (mailFlg = 0) =>
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
      setShowMailModal(true)
      return undefined
    }

    return executeLeave(0)
  }, [hasMail, executeLeave])

  const handleMailSelect = useCallback(
    async (mailFlg) => {
      setShowMailModal(false)
      return executeLeave(Number(mailFlg) === 1 ? 1 : 0)
    },
    [executeLeave],
  )

  const handleMailCancel = useCallback(() => {
    setShowMailModal(false)
  }, [])

  return (
    <>
      <AttendancePostButton
        action="leave"
        hasMail={hasMail}
        disabled={disabled}
        loading={loading}
        title={title}
        onClick={onClick}
      />

      <MailNotificationModal
        open={showMailModal}
        childName={childName}
        actionLabel="退室"
        onSelect={handleMailSelect}
        onCancel={handleMailCancel}
      />
    </>
  )
}
