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
  const match = String(value || '').match(
    /^\d{4}-(\d{2})-(\d{2})$/,
  )

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

export const formatPersonalRecordStatus = (status) => {
  const value = String(status ?? '').trim()

  if (value === '1') return '公開中'
  if (value === '2') return '下書き'

  return value
}

const personalRecordStatusPriority = (status) => {
  const value = String(status ?? '').trim()

  if (value === '1' || value === '公開中' || value === '公開') return 3
  if (value === '2' || value === '下書き') return 2
  if (value) return 1

  return 0
}

export const buildPersonalRecordStatusMap = (records) => {
  const map = new Map()
  const rows = Array.isArray(records) ? records : []

  rows.forEach((record) => {
    const date = normalizeDate(
      record?.served_date ?? record?.target_date ?? record?.targetDate,
    )
    const childId = String(
      record?.children_id ?? record?.child_id ?? record?.childrenId ?? '',
    ).trim()
    const childName = normalizeName(
      record?.children_name ?? record?.child_name ?? record?.childName,
    )
    const status = record?.status

    if (!date || (!childId && !childName)) return

    const keys = [
      childId ? `${date}::id:${childId}` : '',
      childName ? `${date}::name:${childName}` : '',
    ].filter(Boolean)

    keys.forEach((key) => {
      const current = map.get(key)

      if (
        current === undefined ||
        personalRecordStatusPriority(status) >
          personalRecordStatusPriority(current)
      ) {
        map.set(key, status)
      }
    })
  })

  return map
}

export const getPersonalRecordStatus = ({ row, personalRecordStatusMap }) => {
  const date = normalizeDate(row?.target_date)
  const childId = String(
    row?.children_id ?? row?.child_id ?? row?.childrenId ?? '',
  ).trim()
  const childName = normalizeName(row?.child_name)

  if (!date) return ''

  const status =
    (childId && personalRecordStatusMap?.get(`${date}::id:${childId}`)) ||
    (childName &&
      personalRecordStatusMap?.get(`${date}::name:${childName}`)) ||
    ''

  return formatPersonalRecordStatus(status)
}
