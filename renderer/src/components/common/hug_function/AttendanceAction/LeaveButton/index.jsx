import { useCallback } from 'react'
import AttendancePostButton from '../AttendancePostButton'
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

  const debugTitle = buildDebugTitle({
    title,
    childId,
    childName,
    recordId,
    rowSelector,
  })

  return (
    <AttendancePostButton
      action="leave"
      hasMail={hasMail}
      disabled={disabled}
      loading={loading}
      title={debugTitle}
      onClick={onClick}
    />
  )
}
