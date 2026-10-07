export const normalizeInterviewDateToYmd = (dateText) => {
  if (!dateText) return null

  const match = String(dateText).match(
    /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
  )

  if (!match) return null

  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export const hasTodayProfessionalSupportRecord = (useDaysResult, currentYmd) => {
  const rows = useDaysResult?.rows ?? []

  return rows.some((row) => {
    const interviewYmd = normalizeInterviewDateToYmd(row.interviewDate)
    return interviewYmd === currentYmd
  })
}

export const getProfessionalSupportRegisteredLabel = (
  registered,
  checking,
  lastUseDaysResult,
  currentYmd,
) => {
  if (checking) return '確認中'
  if (lastUseDaysResult && lastUseDaysResult.ok === false) return '失敗'
  if (registered === true) return '済'
  if (hasTodayProfessionalSupportRecord(lastUseDaysResult, currentYmd)) {
    return '済'
  }
  return '未'
}
