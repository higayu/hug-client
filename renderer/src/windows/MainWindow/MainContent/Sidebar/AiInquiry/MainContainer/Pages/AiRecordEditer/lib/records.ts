
type SupportRecord = {
  child_id?: number;
  target_date: string;
  content: string;
  user_id?: number;
  /** @deprecated モックデータ用。本番APIは複合主キー (child_id, target_date) */
  record_id?: number;
};

export function getFormattedDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDefaultPeriod() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return { startDate: getFormattedDate(start), endDate: getFormattedDate(end) };
}

export function formatRecordDate(targetDate?: string) {
  if (!targetDate) return '—';
  return String(targetDate).split('T')[0];
}

export function filterRecordsByDateRange(
  records: SupportRecord[],
  startDate: string,
  endDate: string,
) {
  return records.filter((r) => {
    const d = formatRecordDate(r.target_date);
    return d >= startDate && d <= endDate;
  });
}

export function sortRecordsByDateDesc(records: SupportRecord[]) {
  return [...records].sort((a, b) => {
    const da = formatRecordDate(a.target_date);
    const db = formatRecordDate(b.target_date);
    return db.localeCompare(da);
  });
}

export function getSupportRecordKey(record: SupportRecord, fallbackChildId?: number | '') {
  const childId = record.child_id ?? fallbackChildId;
  const date = formatRecordDate(record.target_date);
  if (childId) {
    return `${childId}_${date}`;
  }
  if (record.record_id != null) {
    return String(record.record_id);
  }
  return date;
}
