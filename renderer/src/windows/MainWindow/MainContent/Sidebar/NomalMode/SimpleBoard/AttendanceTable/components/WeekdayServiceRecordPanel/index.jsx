import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppState } from '@/AppStateContext';
import { useServiceRecord } from '@/hooks/useServiceRecord';
import { getWeekdayObjectFromDate } from '@/utils/date/dateUtils.js';

const dateString = (value) => String(value ?? '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';

/**
 * AttendanceTable が使う CURRENT_YMD / CURRENT_DAY_OF_WEEK を参照し、
 * 選択日の「曜日」に該当する当月の個人記録 (item_id=1) を一覧表示する。
 * DB取得結果をグローバルの serviceRecord Redux スライスへ書き込まない。
 */
export default function WeekdayServiceRecordPanel({ embedded = false }) {
  const { CURRENT_YMD, FACILITY_ID } = useAppState();
  const { getServiceRecordMonthly } = useServiceRecord();
  const [expanded, setExpanded] = useState(embedded);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const month = /^\d{4}-\d{2}-\d{2}$/.test(CURRENT_YMD ?? '') ? CURRENT_YMD.slice(0, 7) : '';
  const weekday = getWeekdayObjectFromDate(CURRENT_YMD);
  // SelectedDateWeekday と同じ曜日算出を使い、切り替え直後の旧Context値を使わない。
  const weekdayId = Number(weekday?.id) || null;
  const facilityId = Number(FACILITY_ID);
  const valid = Boolean(month && weekdayId && Number.isInteger(facilityId) && facilityId > 0);

  useEffect(() => {
    if (!expanded) return undefined;
    if (!valid) {
      setRecords([]);
      setError('日付・曜日・施設IDを確認できません。');
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    setRecords([]);
    (async () => {
      try {
        const result = await getServiceRecordMonthly({
          target_month: month,
          day_of_week_id: weekdayId,
          facility_id: facilityId,
          item_id: 1,
        });
        if (cancelled) return;
        // API側でも絞り込むが、別の対象が混在しても表示されないようにする。
        const rows = Array.isArray(result) ? result : [];
        setRecords(rows.filter((r) =>
          Number(r?.facility_id) === facilityId &&
          Number(r?.item_id) === 1 &&
          Number(r?.day_of_week_id) === weekdayId &&
          Number(r?.is_deleted ?? 0) === 0 &&
          dateString(r?.served_date).startsWith(`${month}-`)
        ));
      } catch (cause) {
        if (!cancelled) {
          setError(cause?.message || '月次サービス記録の取得に失敗しました。');
          setRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [expanded, valid, month, weekdayId, facilityId, refreshKey, getServiceRecordMonthly]);

  const grouped = useMemo(() => {
    const groups = new Map();
    [...records].sort((a, b) => dateString(a.served_date).localeCompare(dateString(b.served_date)) ||
      String(a.children_name ?? '').localeCompare(String(b.children_name ?? ''), 'ja'))
      .forEach((record) => {
        const date = dateString(record.served_date);
        if (!groups.has(date)) groups.set(date, []);
        groups.get(date).push(record);
      });
    return [...groups.entries()];
  }, [records]);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  return (
    <section className="overflow-hidden rounded-lg border border-sky-200 bg-sky-50" aria-label="選択曜日の個人記録一覧">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        {embedded ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">選択曜日の個人記録 <span className="text-xs font-normal text-slate-600">{month || '年月未設定'} / {weekday?.label_jp ?? '曜日未設定'}曜日</span></div>
        ) : (
        <button type="button" className="flex items-center gap-2 text-left text-sm font-semibold text-slate-800 hover:text-sky-700"
          onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
          <span aria-hidden="true">{expanded ? '▼' : '▶'}</span>
          選択曜日の個人記録
          <span className="text-xs font-normal text-slate-600">{month || '年月未設定'} / {weekday?.label_jp ?? '曜日未設定'}曜日</span>
        </button>
        )}
        {expanded && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{loading ? '取得中…' : `${records.length}件`}</span>
            <button type="button" onClick={refresh} disabled={loading}
              className="rounded border border-sky-300 bg-white px-2 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50">再取得</button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="space-y-2 overflow-y-auto border-t border-sky-200 bg-white p-3">
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {loading && <p role="status" className="text-sm text-slate-600">サービス記録を取得しています…</p>}
          {!loading && !error && grouped.length === 0 && (
            <p className="text-sm text-slate-500">選択した曜日の個人記録はありません。</p>
          )}
          {!loading && !error && grouped.map(([date, rows]) => (
            <div key={date} className="overflow-hidden rounded-md border border-slate-200">
              <div className="bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-800">{date}（{rows.length}件）</div>
              <div className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <div key={row.id ?? `${date}-${row.children_id}`} className="px-3 py-2">
                    <div className="mb-1 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                      <span>{row.children_name || `児童ID: ${row.children_id}`}</span>
                      <span className="font-normal text-slate-500">{Number(row.status) === 2 ? '下書き' : Number(row.status) === 1 ? '公開' : '状態未設定'}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{row.note || '記録本文なし'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
