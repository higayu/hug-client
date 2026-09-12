import { useCallback, useState } from 'react'
import AttendancePostButton from '../AttendancePostButton'
import MailNotificationModal from '../MailNotificationModal'
import { handleEnterClick } from './function/handleEnterClick'

export default function EnterButton({
  childId,
  childName,
  dateStr,
  hasMail = false,
  disabled = false,
  loading = false,
  title = '',
  onEnter,
}) {
  const [showMailModal, setShowMailModal] = useState(false)

  const executeEnter = useCallback(
    (mailFlg = 0) =>
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
      setShowMailModal(true)
      return undefined
    }

    return executeEnter(0)
  }, [hasMail, executeEnter])

  const handleMailSelect = useCallback(
    async (mailFlg) => {
      setShowMailModal(false)
      return executeEnter(Number(mailFlg) === 1 ? 1 : 0)
    },
    [executeEnter],
  )

  const handleMailCancel = useCallback(() => {
    setShowMailModal(false)
  }, [])

  return (
    <>
      <AttendancePostButton
        action="enter"
        hasMail={hasMail}
        disabled={disabled}
        loading={loading}
        title={title}
        onClick={onClick}
      />

      <MailNotificationModal
        open={showMailModal}
        childName={childName}
        actionLabel="入室"
        onSelect={handleMailSelect}
        onCancel={handleMailCancel}
      />
    </>
  )
}
