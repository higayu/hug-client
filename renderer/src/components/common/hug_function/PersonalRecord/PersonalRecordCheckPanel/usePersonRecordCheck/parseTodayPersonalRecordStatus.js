/**
 * fetchPersonalRecord の結果から、本日の個人記録（活動内容 note）登録済みかを判定
 *
 * @param {{ ok?: boolean, records?: Array<{ note?: string | null }> }} contactBookResult
 * @returns {{ registered: boolean | null, recordCount: number | null }}
 */
export function parseTodayPersonalRecordStatus(contactBookResult) {
  if (!contactBookResult?.ok) {
    return { registered: null, recordCount: null };
  }

  const records = Array.isArray(contactBookResult.records)
    ? contactBookResult.records
    : [];
  const withNote = records.filter((r) => String(r?.note ?? "").trim() !== "");

  if (records.length === 0) {
    return { registered: false, recordCount: 0 };
  }

  return {
    registered: withNote.length > 0,
    recordCount: withNote.length,
  };
}

/**
 * HUG の利用日数は「今月の個人記録登録数＋1」相当のため、
 * 本日分が既に登録済みなら実質の利用日数は 1 日少ない
 *
 * @param {number} rawDays
 * @param {boolean | null} todayPersonalRecordRegistered
 */
export function adjustUseDaysForTodayPersonalRecord(
  rawDays,
  todayPersonalRecordRegistered
) {
  if (typeof rawDays !== "number" || Number.isNaN(rawDays)) {
    return rawDays;
  }
  if (todayPersonalRecordRegistered !== true) {
    return rawDays;
  }
  return Math.max(0, rawDays - 1);
}
