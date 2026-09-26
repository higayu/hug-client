import { useCallback } from 'react'
import AttendancePostButton from '../AttendancePostButton'
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

  const debugTitle = buildDebugTitle({
    title,
    childId,
    childName,
    recordId,
    rowSelector,
  })

  return (
    <AttendancePostButton
      action="enter"
      hasMail={hasMail}
      disabled={disabled}
      loading={loading}
      title={debugTitle}
      onClick={onClick}
    />
  )
}
