import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache';
import { getAttendanceFetchFlow } from './automationFlow';
import { fetchAttendanceTableInWebview } from './fetchAttendanceTableInWebview';

/**
 * DB の attendance_fetch_today_users Flow / Rule を読み込み、
 * HUGログイン済みWebViewのCookieセッションを使って利用者テーブルを取得する。
 *
 * @param {{ facilityId: string|number, dateStr: string }} opts
 */
export async function fetchAttendanceViaHugTab({ facilityId, dateStr }) {
  if (!facilityId || !dateStr) {
    return {
      ok: false,
      error: '施設IDまたは日付が設定されていません',
    };
  }

  const automation = await getAttendanceFetchFlow();

  if (!automation.ok) {
    return {
      ok: false,
      error: `自動化設定の取得に失敗しました: ${automation.error}`,
    };
  }

  const webview = await getHugWebviewForCache();

  return fetchAttendanceTableInWebview(webview, {
    facilityId: String(facilityId),
    dateStr: String(dateStr),
    flow: automation.flow,
    step: automation.step,
    rule: automation.rule,
  });
}
