import { useMemo } from 'react'

import DateGroup from './DateGroup'

import {
  buildRecordStatusMap,
  normalizeDate,
} from './utils'

export default function DateView({ data, records }) {
  const rows = Array.isArray(data) ? data : []

  const attendedRows = useMemo(
    () => rows.filter((row) => Number(row?.is_attended) === 1),
    [rows],
  )

  const recordStatusMap = useMemo(
    () => buildRecordStatusMap(records),
    [records],
  )

  const groups = useMemo(() => {
    const map = new Map()

    attendedRows.forEach((row) => {
      const date = normalizeDate(row?.target_date)

      if (!date) return

      if (!map.has(date)) {
        map.set(date, [])
      }

      map.get(date).push(row)
    })

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, children]) => ({
        date,
        children: children.sort((a, b) =>
          String(a?.child_name || '').localeCompare(
            String(b?.child_name || ''),
            'ja',
          ),
        ),
      }))
  }, [attendedRows])

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        出席データがありません。
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map(({ date, children }) => (
        <DateGroup
          key={date}
          date={date}
          children={children}
          recordStatusMap={recordStatusMap}
        />
      ))}
    </div>
  )
}
