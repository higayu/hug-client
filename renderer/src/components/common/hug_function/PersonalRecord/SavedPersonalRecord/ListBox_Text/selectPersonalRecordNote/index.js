import { SERVICE_RECORD_ITEM_ID } from "./postServiceRecordsToLocalApi";

/**
 * served_date（DATE）から YYYY-MM-DD を取り出す
 * @param {string|Date} servedDate
 */
export function servedDateToDateStr(servedDate) {
  if (!servedDate) return null;
  const s = String(servedDate);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * Redux の service_record から個人記録（note）を 1 件抽出
 *
 * @param {Array<object>} records
 * @param {{ childrenId: string|number, dateStr: string, itemId?: number }} opts
 * @returns {string}
 */
export function selectPersonalRecordNote(
  records,
  { childrenId, dateStr, itemId = SERVICE_RECORD_ITEM_ID }
) {
  if (!childrenId || !dateStr || !Array.isArray(records)) {
    return "";
  }

  const row = records.find(
    (r) =>
      String(r.children_id) === String(childrenId) &&
      Number(r.item_id) === Number(itemId) &&
      Number(r.is_deleted) === 0 &&
      servedDateToDateStr(r.served_date) === dateStr
  );

  return row?.note ?? "";
}
