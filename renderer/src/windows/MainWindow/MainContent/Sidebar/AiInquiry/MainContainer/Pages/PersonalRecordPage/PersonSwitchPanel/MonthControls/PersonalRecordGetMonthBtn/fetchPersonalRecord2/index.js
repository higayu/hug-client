import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { fetchPersonalRecordList } from "./fetchPersonalRecordList";

/**
 * YYYY-MM形式から月初めと月末の日付を生成する
 * 
 * @param {string} yearMonth - "YYYY-MM" 形式の年月
 * @returns {{ start: string, end: string }} 月初めと月末の日付（YYYY-MM-DD形式）
 */
function getMonthRange(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  
  // 月初め
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  
  // 月末（翌月の0日 = 今月の最終日）
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return { start, end };
}

/**
 * hugview の Cookie だけ使い、ページ遷移なしで
 * 個人記録（活動内容 note）を指定された年月の期間で取得する
 *
 * @param {{
 *   childId: string|number,
 *   facilityId?: string|number,
 *   year_month: string,   // "YYYY-MM" 形式（必須）
 *   onlyPresent?: boolean,
 * }} opts
 *   指定された年月の月初めから月末までの期間で取得する
 */
export async function fetchPersonalRecord2({
  childId,
  facilityId = "3",
  year_month,
  onlyPresent = true,
}) {
  const webview = await getHugWebviewForCache();

  // 必須パラメータのチェック
  if (!childId) {
    return { ok: false, error: "児童IDが指定されていません" };
  }
  
  if (!year_month || !/^\d{4}-\d{2}$/.test(year_month)) {
    return {
      ok: false,
      error: "year_month が正しい形式（YYYY-MM）で指定されていません",
    };
  }

  // year_monthから月初めと月末の日付を生成
  const { start, end } = getMonthRange(year_month);

  return fetchPersonalRecordList(webview, {
    childId: String(childId),
    facilityId: String(facilityId),
    dateStart: start,
    dateEnd: end,
    onlyPresent,
  });
}