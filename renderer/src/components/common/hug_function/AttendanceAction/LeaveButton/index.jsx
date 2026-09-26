import { useCallback } from 'react'
import AttendancePostButton from '../AttendancePostButton'
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
  const onClick = useCallback(
    () =>
      handleLeaveClick({
        onLeave,
        childId,
        childName,
        dateStr,
      }),
    [onLeave, childId, childName, dateStr],
  )

  return (
    <AttendancePostButton
      action="leave"
      hasMail={hasMail}
      disabled={disabled}
      loading={loading}
      title={title}
      onClick={onClick}
    />
  )
}
