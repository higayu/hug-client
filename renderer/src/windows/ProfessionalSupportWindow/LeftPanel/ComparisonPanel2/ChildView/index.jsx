import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { useServiceRecord } from '@/hooks/useServiceRecord'
import { setServiceRecord } from '@/store/slices/databaseSlice.js'

import { buildCalendar, groupByChild } from '../helpers'
import {
  buildRecordStatusMap,
  hasProfessionalSupportAddition,
  normalizeName,
} from '../utils'

import MonthlySummary from './MonthlySummary'
import { buildPersonalRecordStatusMap } from './MonthlySummary/MonthlySummaryRow/utils'

export default function ChildView({
  data,
  records = [],
  facilityId,
  targetMonth,
}) {
  const dispatch = useDispatch()
  const { getServiceRecordMonthly } = useServiceRecord()

  const [expandedChildKey, setExpandedChildKey] = useState(null)
  const [personalRecords, setPersonalRecords] = useState([])
  const [personalRecordLoading, setPersonalRecordLoading] = useState(false)
  const [personalRecordError, setPersonalRecordError] = useState('')

  const rows = Array.isArray(data) ? data : []
  const recordRows = Array.isArray(records) ? records : []

  useEffect(() => {
    const normalizedFacilityId = Number(facilityId)
    const normalizedTargetMonth = String(targetMonth ?? '').trim()

    if (
      !Number.isInteger(normalizedFacilityId) ||
      normalizedFacilityId <= 0 ||
      !/^\d{4}-\d{2}$/.test(normalizedTargetMonth)
    ) {
      setPersonalRecords([])
      setPersonalRecordError('')
      dispatch(setServiceRecord([]))
      return
    }

    let cancelled = false

    const loadPersonalRecords = async () => {
      setPersonalRecordLoading(true)
      setPersonalRecordError('')

      try {
        const result = await getServiceRecordMonthly({
          target_month: normalizedTargetMonth,
          day_of_week_id: null,
          facility_id: normalizedFacilityId,
          item_id: 1,
        })

        if (cancelled) return

        const loadedRows = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : []

        console.log('[ChildView] Laravel個人記録 全件:', loadedRows)

        setPersonalRecords(loadedRows)
        dispatch(setServiceRecord(loadedRows))
      } catch (loadError) {
        if (cancelled) return

        console.error('[ChildView] 個人記録の取得に失敗しました。', loadError)

        setPersonalRecords([])
        dispatch(setServiceRecord([]))
        setPersonalRecordError(
          loadError?.message || 'Laravelから個人記録を取得できませんでした。',
        )
      } finally {
        if (!cancelled) {
          setPersonalRecordLoading(false)
        }
      }
    }

    loadPersonalRecords()

    return () => {
      cancelled = true
    }
  }, [dispatch, facilityId, getServiceRecordMonthly, targetMonth])

  const normalizedRecordRows = useMemo(
    () =>
      recordRows.map((record) => ({
        ...record,
        targetDate:
          record?.targetDate ??
          record?.served_date ??
          record?.target_date ??
          record?.interviewDate ??
          '',
        childName:
          record?.childName ??
          record?.child_name ??
          record?.children_name ??
          record?.name ??
          '',
        status:
          record?.status ??
          (record?.note !== undefined && record?.note !== null
            ? '作成済'
            : ''),
      })),
    [recordRows],
  )

  const attendedRows = useMemo(
    () => rows.filter((row) => Number(row?.is_attended) === 1),
    [rows],
  )

  const recordStatusMap = useMemo(
    () => buildRecordStatusMap(normalizedRecordRows),
    [normalizedRecordRows],
  )

  const children = useMemo(() => groupByChild(attendedRows), [attendedRows])

  const calendar = useMemo(() => buildCalendar(attendedRows), [attendedRows])

  const personalRecordCountMap = useMemo(() => {
    const map = new Map()
    const normalizedTargetMonth = String(targetMonth ?? '').trim()

    personalRecords.forEach((record) => {
      const childName = normalizeName(record?.children_name)
      const servedDate = String(record?.served_date ?? '').trim()
      const recordMonth = /^\d{4}-\d{2}-\d{2}$/.test(servedDate)
        ? servedDate.slice(0, 7)
        : ''

      if (!childName || !recordMonth) {
        return
      }

      if (normalizedTargetMonth && recordMonth !== normalizedTargetMonth) {
        return
      }

      map.set(childName, (map.get(childName) || 0) + 1)
    })

    return map
  }, [personalRecords, targetMonth])

  const personalRecordStatusMap = useMemo(
    () => buildPersonalRecordStatusMap(personalRecords),
    [personalRecords],
  )

  const monthlySummary = useMemo(() => {
    const professionalRecordCountMap = new Map()

    normalizedRecordRows.forEach((record) => {
      const childKey = normalizeName(record?.childName)

      if (!childKey) return

      professionalRecordCountMap.set(
        childKey,
        (professionalRecordCountMap.get(childKey) || 0) + 1,
      )
    })

    return children.map((child) => {
      const normalizedChildName = normalizeName(child.childName)

      const personalRecordCount =
        personalRecordCountMap.get(normalizedChildName) || 0

      return {
        childKey: child.key,
        childId: child.childId,
        childName: child.childName,
        attendanceCount: child.rows.length,
        additionCount: child.rows.filter((row) =>
          hasProfessionalSupportAddition(row),
        ).length,
        recordCount: professionalRecordCountMap.get(normalizedChildName) || 0,
        personalRecordCount,
        rows: child.rows,
      }
    })
  }, [children, normalizedRecordRows, personalRecordCountMap])

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
    <div className="space-y-2">
      {personalRecordLoading && (
        <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
          Laravelから個人記録を取得しています...
        </div>
      )}

      {personalRecordError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          個人記録の取得に失敗しました: {personalRecordError}
        </div>
      )}

      <MonthlySummary
        items={monthlySummary}
        year={calendar?.year}
        month={calendar?.month}
        expandedChildKey={expandedChildKey}
        onToggleChild={handleToggleChild}
        recordStatusMap={recordStatusMap}
        personalRecordStatusMap={personalRecordStatusMap}
      />
    </div>
  )
}
