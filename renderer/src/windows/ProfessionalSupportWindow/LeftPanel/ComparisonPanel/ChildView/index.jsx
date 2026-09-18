import { useMemo, useState } from 'react'

import { buildCalendar, groupByChild } from '../helpers'
import {
  buildRecordStatusMap,
  hasProfessionalSupportAddition,
  normalizeName,
} from '../DateView/utils'

import MonthlySummary from './MonthlySummary'

export default function ChildView({ data, records }) {
  const [expandedChildKey, setExpandedChildKey] = useState(null)

  const rows = Array.isArray(data) ? data : []
  const recordRows = Array.isArray(records) ? records : []

  const attendedRows = useMemo(
    () => rows.filter((row) => Number(row?.is_attended) === 1),
    [rows],
  )

  const recordStatusMap = useMemo(
    () => buildRecordStatusMap(recordRows),
    [recordRows],
  )

  const children = useMemo(
    () => groupByChild(attendedRows),
    [attendedRows],
  )

  const calendar = useMemo(
    () => buildCalendar(attendedRows),
    [attendedRows],
  )

  const monthlySummary = useMemo(() => {
    const recordCountMap = new Map()

    recordRows.forEach((record) => {
      const childKey = normalizeName(record?.childName)

      if (!childKey) return

      recordCountMap.set(
        childKey,
        (recordCountMap.get(childKey) || 0) + 1,
      )
    })

    return children.map((child) => {
      const childKey = normalizeName(child.childName)

      return {
        childKey: child.key,
        childName: child.childName,
        attendanceCount: child.rows.length,
        additionCount: child.rows.filter((row) =>
          hasProfessionalSupportAddition(row),
        ).length,
        recordCount: recordCountMap.get(childKey) || 0,
        rows: child.rows,
      }
    })
  }, [children, recordRows])

  const handleToggleChild = (childKey) => {
    setExpandedChildKey((current) =>
      current === childKey ? null : childKey,
    )
  }

  if (children.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        出席データがありません。
      </div>
    )
  }

  return (
    <MonthlySummary
      items={monthlySummary}
      year={calendar?.year}
      month={calendar?.month}
      expandedChildKey={expandedChildKey}
      onToggleChild={handleToggleChild}
      recordStatusMap={recordStatusMap}
    />
  )
}
