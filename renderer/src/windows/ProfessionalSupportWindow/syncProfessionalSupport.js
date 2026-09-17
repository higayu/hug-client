const normalizeJapaneseDate = (value) => {
  const text = String(value ?? '').trim()

  let match = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }

  match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }

  return ''
}

const parseLastUpdated = (value) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  const match = text.match(
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})(?:\s+(.*))?$/,
  )

  if (!match) {
    return {
      sourceUpdatedAt: null,
      sourceUpdatedBy: null,
    }
  }

  return {
    sourceUpdatedAt:
      `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')} ` +
      `${match[4].padStart(2, '0')}:${match[5]}:${match[6]}`,
    sourceUpdatedBy: match[7]?.trim() || null,
  }
}

export const buildAttendanceSyncRows = (attendanceData) => {
  const rows = []

  for (const day of attendanceData?.days ?? []) {
    const withoutAddition = new Set(
      day.absenceWithoutAdditionSyncNames ??
        day.absenceWithoutAdditionNames ??
        [],
    )

    for (const childName of
      day.attendanceSyncNames ?? day.attendanceNames ?? []) {
      rows.push({
        targetDate: day.date,
        childId: null,
        childName,
        status: '出席',
        isAbsent: false,
      })
    }

    for (const childName of
      day.absenceSyncNames ?? day.absenceNames ?? []) {
      if (withoutAddition.has(childName)) {
        continue
      }

      rows.push({
        targetDate: day.date,
        childId: null,
        childName,
        status: '欠席',
        isAbsent: true,
      })
    }

    for (const childName of
      day.absenceWithoutAdditionSyncNames ??
      day.absenceWithoutAdditionNames ??
      []) {
      rows.push({
        targetDate: day.date,
        childId: null,
        childName,
        status: '欠席（加算なし）',
        isAbsent: true,
      })
    }
  }

  return rows
}

export const buildAdditionSyncRows = (additionCountData) => {
  const rows = []

  for (const day of additionCountData?.days ?? []) {
    for (const addition of day.additions ?? []) {
      const additionId =
        addition.name === '専門的支援実施加算' ? '55' : null

      for (const childName of addition.children ?? []) {
        rows.push({
          targetDate: day.date,
          additionId,
          additionName: addition.name,
          childId: null,
          childName,
        })
      }
    }
  }

  return rows
}

export const buildRecordSyncRows = (additionListData) =>
  (additionListData?.records ?? [])
    .map((record) => {
      const interviewDate = normalizeJapaneseDate(record.interviewDate)
      const { sourceUpdatedAt, sourceUpdatedBy } = parseLastUpdated(
        record.lastUpdated,
      )

      return {
        sourceId: Number(record.id),
        facilityName: record.facilityName || null,
        childId: null,
        childName: record.childName,
        additionId: '55',
        additionName: record.additionName || '専門的支援実施加算',
        serviceName: record.serviceName || null,
        recorderName: record.recorderName || null,
        interviewDate,
        status: record.status || null,
        isSigned: Boolean(record.signed),
        sourceUpdatedAt,
        sourceUpdatedBy,
      }
    })
    .filter(
      (record) =>
        Number.isInteger(record.sourceId) &&
        record.sourceId > 0 &&
        record.childName &&
        record.interviewDate,
    )

export const buildProfessionalSupportSyncPayload = ({
  facilityId,
  year,
  month,
  attendanceData,
  additionCountData,
  additionListData,
}) => ({
  facilityId: Number(facilityId),
  year: Number(year),
  month: Number(month),
  attendanceData: buildAttendanceSyncRows(attendanceData),
  additionData: buildAdditionSyncRows(additionCountData),
  recordData: buildRecordSyncRows(additionListData),
})
