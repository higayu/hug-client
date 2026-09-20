const PROFESSIONAL_SUPPORT_ADDITION_ID = '55'

export const hasProfessionalSupportAddition = (row) =>
  String(row?.addition_ids || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(PROFESSIONAL_SUPPORT_ADDITION_ID)

export const normalizeName = (value) =>
  String(value || '')
    .replace(/[\s　]+/g, '')
    .trim()

export const normalizeDate = (value) => {
  const text = String(value || '').trim()
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`
  }

  const jp = text.match(
    /^(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?$/,
  )

  if (jp) {
    return `${jp[1]}-${String(jp[2]).padStart(2, '0')}-${String(
      jp[3],
    ).padStart(2, '0')}`
  }

  return text
}

export const formatMonthDay = (value) => {
  const match = String(value || '').match(/^\d{4}-(\d{2})-(\d{2})$/)

  if (!match) {
    return value || '-'
  }

  return `${Number(match[1])}月${Number(match[2])}日`
}

export const statusPriority = (status) => {
  const value = String(status || '')

  if (value.includes('作成済')) return 3
  if (value.includes('下書き')) return 2
  if (value) return 1

  return 0
}

export const buildRecordStatusMap = (records) => {
  const map = new Map()
  const rows = Array.isArray(records) ? records : []

  rows.forEach((record) => {
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
}

export const getRecordStatus = ({ row, recordStatusMap }) => {
  const date = normalizeDate(row?.target_date)
  const name = normalizeName(row?.child_name)

  if (!date || !name) {
    return ''
  }

  return recordStatusMap.get(`${date}::${name}`) || ''
}
