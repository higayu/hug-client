export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export const normalizeNumber = (value) => Number(value) || 0

export const getIssueLabel = (row) => {
  if (normalizeNumber(row.missing_addition) === 1) {
    return '加算なし'
  }

  if (normalizeNumber(row.missing_record) === 1) {
    return '一覧なし'
  }

  if (normalizeNumber(row.record_without_addition) === 1) {
    return '加算一覧のみ'
  }

  return 'OK'
}

export const getIssueClass = (row) => {
  const issue = getIssueLabel(row)

  if (issue === 'OK') {
    return 'bg-green-100 text-green-700'
  }

  if (issue === '加算なし') {
    return 'bg-red-100 text-red-700'
  }

  if (issue === '一覧なし') {
    return 'bg-amber-100 text-amber-800'
  }

  return 'bg-purple-100 text-purple-700'
}

export const getStatusClass = (status) => {
  if (status === '出席') {
    return 'bg-green-100 text-green-700'
  }

  if (status === '欠席') {
    return 'bg-red-100 text-red-700'
  }

  if (status === '欠席（加算なし）') {
    return 'bg-gray-200 text-gray-700'
  }

  return 'bg-blue-100 text-blue-700'
}

export const parseDateParts = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

export const makeDateKey = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export const buildCalendar = (rows) => {
  const firstDate = rows
    .map((row) => parseDateParts(row.target_date))
    .find(Boolean)

  if (!firstDate) {
    return null
  }

  const { year, month } = firstDate
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const rowsByDate = rows.reduce((map, row) => {
    if (!row.target_date) {
      return map
    }

    if (!map[row.target_date]) {
      map[row.target_date] = []
    }

    map[row.target_date].push(row)
    return map
  }, {})

  const cells = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = makeDateKey(year, month, day)

    cells.push({
      day,
      dateKey,
      rows: rowsByDate[dateKey] || [],
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return {
    year,
    month,
    cells,
  }
}

export const groupByAttendanceStatus = (rows) => {
  const groups = {
    出席: [],
    欠席: [],
    '欠席（加算なし）': [],
    その他: [],
  }

  rows.forEach((row) => {
    const status = row.attendance_status || ''

    if (status === '出席') {
      groups.出席.push(row)
      return
    }

    if (status === '欠席') {
      groups.欠席.push(row)
      return
    }

    if (status === '欠席（加算なし）') {
      groups['欠席（加算なし）'].push(row)
      return
    }

    groups.その他.push(row)
  })

  return groups
}

export const groupByChild = (rows) => {
  const map = new Map()

  rows.forEach((row) => {
    const key = row.child_name_key || row.child_name || 'unknown'

    if (!map.has(key)) {
      const childId = Number(
        row?.children_id ??
          row?.child_id ??
          row?.childrenId ??
          row?.childId,
      )

      map.set(key, {
        key,
        childId:
          Number.isInteger(childId) && childId > 0
            ? childId
            : null,
        childName: row.child_name || '-',
        rows: [],
      })
    }

    map.get(key).rows.push(row)
  })

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      rows: item.rows.sort((a, b) =>
        String(a.target_date || '').localeCompare(String(b.target_date || '')),
      ),
    }))
    .sort((a, b) => a.childName.localeCompare(b.childName, 'ja'))
}
