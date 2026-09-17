const pad2 = (value) => String(value).padStart(2, '0')

const buildMonthDates = (year, month) => {
  const lastDay = new Date(Number(year), Number(month), 0).getDate()

  return Array.from({ length: lastDay }, (_, index) =>
    `${year}-${pad2(month)}-${pad2(index + 1)}`,
  )
}

const unique = (values) => Array.from(new Set(values.filter(Boolean)))

const toJapaneseDate = (value) => {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return String(value ?? '')
  return `${match[1]}年${match[2]}月${match[3]}日`
}

export const buildAttendancePanelDataFromDb = ({
  rows,
  year,
  month,
}) => {
  const list = Array.isArray(rows) ? rows : []
  const byDate = new Map()

  list.forEach((row) => {
    const date = row?.targetDate
    if (!date) return

    if (!byDate.has(date)) {
      byDate.set(date, [])
    }

    byDate.get(date).push(row)
  })

  const days = buildMonthDates(year, month).map((date) => {
    const dateRows = byDate.get(date) ?? []
    const attendanceNames = []
    const absenceNames = []
    const absenceWithoutAdditionNames = []

    dateRows.forEach((row) => {
      const name = String(row?.childName ?? '').trim()
      if (!name) return

      if (row?.status === '欠席（加算なし）') {
        absenceWithoutAdditionNames.push(name)
        return
      }

      if (row?.status === '欠席' || Number(row?.isAbsent) === 1) {
        absenceNames.push(name)
        return
      }

      attendanceNames.push(name)
    })

    const normalizedAttendance = unique(attendanceNames)
    const normalizedAbsence = unique(absenceNames)
    const normalizedAbsenceWithoutAddition = unique(
      absenceWithoutAdditionNames,
    )

    return {
      date,
      attendanceCount: normalizedAttendance.length,
      attendanceNames: normalizedAttendance,
      attendanceSyncNames: normalizedAttendance,
      absenceCount: normalizedAbsence.length,
      absenceNames: normalizedAbsence,
      absenceSyncNames: normalizedAbsence,
      absenceWithoutAdditionCount: normalizedAbsenceWithoutAddition.length,
      absenceWithoutAdditionNames: normalizedAbsenceWithoutAddition,
      absenceWithoutAdditionSyncNames: normalizedAbsenceWithoutAddition,
    }
  })

  return {
    heading: `${year}年${pad2(month)}月の出席データ（DB）`,
    facilityId: list[0]?.facilityId ?? null,
    year: Number(year),
    month: Number(month),
    days,
  }
}

export const buildAdditionCountPanelDataFromDb = ({
  rows,
  year,
  month,
}) => {
  const list = Array.isArray(rows) ? rows : []
  const byDate = new Map()

  list.forEach((row) => {
    const date = row?.targetDate
    if (!date) return

    if (!byDate.has(date)) {
      byDate.set(date, [])
    }

    byDate.get(date).push(row)
  })

  const days = buildMonthDates(year, month).map((date) => {
    const dateRows = byDate.get(date) ?? []
    const additionMap = new Map()

    dateRows.forEach((row) => {
      const name = String(row?.additionName ?? '').trim()
      const childName = String(row?.childName ?? '').trim()
      if (!name || !childName) return

      if (!additionMap.has(name)) {
        additionMap.set(name, [])
      }

      additionMap.get(name).push(childName)
    })

    const additions = Array.from(additionMap.entries()).map(
      ([name, children]) => {
        const normalizedChildren = unique(children)
        return {
          name,
          count: normalizedChildren.length,
          children: normalizedChildren,
        }
      },
    )

    const professionalSupport = additions.find(
      (addition) => addition.name === '専門的支援実施加算',
    )

    return {
      date,
      professionalSupportCount: professionalSupport?.count ?? 0,
      professionalSupportChildren: professionalSupport?.children ?? [],
      additions,
    }
  })

  return {
    heading: `${year}年${pad2(month)}月の加算数データ（DB）`,
    facilityId: list[0]?.facilityId ?? null,
    year: Number(year),
    month: Number(month),
    days,
  }
}

export const buildAdditionListPanelDataFromDb = ({
  rows,
  year,
  month,
}) => {
  const list = Array.isArray(rows) ? rows : []
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  const startDate = `${year}-${pad2(month)}-01`
  const endDate = `${year}-${pad2(month)}-${pad2(lastDay)}`

  const records = list.map((row) => {
    const updatedParts = [row?.sourceUpdatedAt, row?.sourceUpdatedBy]
      .filter(Boolean)
      .join(' ')

    return {
      id: row?.sourceId ?? row?.id ?? '',
      childName: row?.childName ?? '',
      additionName: row?.additionName ?? '',
      facilityName: row?.facilityName ?? '',
      serviceName: row?.serviceName ?? '',
      recorderName: row?.recorderName ?? '',
      interviewDate: toJapaneseDate(row?.interviewDate ?? row?.targetDate),
      status: row?.status ?? '',
      signed:
        row?.isSigned === true ||
        row?.isSigned === 1 ||
        row?.isSigned === '1',
      lastUpdated: updatedParts,
    }
  })

  return {
    facilityId: list[0]?.facilityId ?? null,
    year: Number(year),
    month: Number(month),
    startDate: toJapaneseDate(startDate),
    endDate: toJapaneseDate(endDate),
    total: records.length,
    pageCount: 1,
    records,
  }
}
