import { useCallback, useState } from "react"
import AttendancePostButton from "../AttendancePostButton"
import MailNotificationModal from "../MailNotificationModal"
import {
  executeEnter,
  handleEnterClick,
} from "./function/handleEnterClick"

export default function EnterButton({
  childId,
  childName,
  dateStr,
  hasMail = false,
  disabled = false,
  loading = false,
  title = "",
  onEnter,
}) {
  const [showEnterMailModal, setShowEnterMailModal] = useState(false)

  const execute = useCallback(
    (mailFlg = 0) =>
      executeEnter({
        onEnter,
        childId,
        childName,
        dateStr,
        enterHasMail: hasMail,
        mailFlg,
      }),
    [onEnter, childId, childName, dateStr, hasMail],
  )

  const onClick = useCallback(
    () =>
      handleEnterClick({
        enterHasMail: hasMail,
        setShowEnterMailModal,
        execute,
      }),
    [hasMail, execute],
  )

  const handleMailSelect = useCallback(
    async (mailFlg) => {
      setShowEnterMailModal(false)
      return execute(Number(mailFlg) === 1 ? 1 : 0)
    },
    [execute],
  )

  const handleMailCancel = useCallback(() => {
    setShowEnterMailModal(false)
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
        open={showEnterMailModal}
        childName={childName}
        actionLabel="入室"
        onSelect={handleMailSelect}
        onCancel={handleMailCancel}
      />
    </>
  )
}
