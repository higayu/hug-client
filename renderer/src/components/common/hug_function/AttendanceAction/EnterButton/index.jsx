import { useCallback } from 'react'
import AttendancePostButton from '../AttendancePostButton'
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
  const onClick = useCallback(
    () =>
      handleEnterClick({
        onEnter,
        childId,
        childName,
        dateStr,
      }),
    [onEnter, childId, childName, dateStr],
  )

  return (
    <AttendancePostButton
      action="enter"
      hasMail={hasMail}
      disabled={disabled}
      loading={loading}
      title={title}
      onClick={onClick}
    />
  )
}
