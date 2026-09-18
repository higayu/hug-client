import { useMemo } from 'react'

import { useAppState } from '@/AppStateContext'

import DateGroup from './DateGroup'
import MonthlySummary from './MonthlySummary'

import {
  hasProfessionalSupportAddition,
  normalizeDate,
  normalizeName,
  statusPriority,
} from './utils'

export default function DateView({ data, records }) {
  const { DEBUG_FLG } = useAppState()

  const rows = Array.isArray(data) ? data : []
  const recordRows = Array.isArray(records) ? records : []

  const attendedRows = useMemo(
    () => rows.filter((row) => Number(row?.is_attended) === 1),
    [rows],
  )

  const recordStatusMap = useMemo(() => {
    const map = new Map()

    recordRows.forEach((record) => {
      const date = normalizeDate(record?.targetDate || record?.interviewDate)
      const name = normalizeName(record?.childName)

      if (!date || !name) return

      const key = `${date}::${name}`
      const status = String(record?.status || '').trim()
      const current = map.get(key)

      if (!current || statusPriority(status) > statusPriority(current)) {
        map.set(key, status)
      }
    })

    return map
  }, [recordRows])

  const monthlySummary = useMemo(() => {
    const map = new Map()

    attendedRows.forEach((row) => {
      const childName = String(row?.child_name || '').trim()
      const childKey = normalizeName(childName)

      if (!childKey) return

      if (!map.has(childKey)) {
        map.set(childKey, {
          childKey,
          childName,
          attendanceCount: 0,
          additionCount: 0,
          recordCount: 0,
        })
      }

      const item = map.get(childKey)

      item.attendanceCount += 1

      if (hasProfessionalSupportAddition(row)) {
        item.additionCount += 1
      }
    })

    recordRows.forEach((record) => {
      const childKey = normalizeName(record?.childName)

      if (!childKey || !map.has(childKey)) return

      map.get(childKey).recordCount += 1
    })

    return Array.from(map.values()).sort((a, b) =>
      a.childName.localeCompare(b.childName, 'ja'),
    )
  }, [attendedRows, recordRows])

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
      <MonthlySummary items={monthlySummary} />

      {DEBUG_FLG &&
        groups.map(({ date, children }) => (
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