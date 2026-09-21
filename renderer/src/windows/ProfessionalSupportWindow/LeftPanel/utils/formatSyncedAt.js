export default function formatSyncedAt(value) {
  if (!value) {
    return '未実行'
  }

  // MariaDB の `YYYY-MM-DD HH:mm:ss` 形式も Date で扱える形に寄せる。
  const normalizedValue =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)
      ? value.replace(' ', 'T')
      : value

  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
