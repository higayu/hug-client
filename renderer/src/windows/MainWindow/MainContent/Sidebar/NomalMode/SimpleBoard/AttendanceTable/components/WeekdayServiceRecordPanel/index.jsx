import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppState } from '@/AppStateContext';
import { useServiceRecord } from '@/hooks/useServiceRecord';
import { getWeekdayObjectFromDate } from '@/utils/date/dateUtils.js';
import PanelHeader from './PanelHeader';
import RecordFilters from './RecordFilters';
import RecordList from './RecordList';

const dateString = (value) => String(value ?? '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';

// 日付文字列をローカル日付として扱い、UTC変換による日付ずれを防ぐ。
const previousWeekDate = (ymd, weeks) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd ?? '');
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() - 7 * weeks);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getInitialFilterDate = (ymd, dates) => {
  const lastWeek = previousWeekDate(ymd, 1);
  if (dates.includes(lastWeek)) return lastWeek;
  const twoWeeksAgo = previousWeekDate(ymd, 2);
  if (dates.includes(twoWeeksAgo)) return twoWeeksAgo;
  return dates.includes(ymd) ? ymd : dates[dates.length - 1] ?? '';
};

/**
 * AttendanceTable が使う CURRENT_YMD / CURRENT_DAY_OF_WEEK を参照し、
 * 選択日の「曜日」に該当する当月の個人記録 (item_id=1) を一覧表示する。
 * DB取得結果をグローバルの serviceRecord Redux スライスへ書き込まない。
 */
export default function WeekdayServiceRecordPanel({ embedded = false, attendanceRows = [] }) {
  const { CURRENT_YMD, FACILITY_ID } = useAppState();
  const { getServiceRecordMonthly } = useServiceRecord();
  const [expanded, setExpanded] = useState(embedded);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedChildId, setSelectedChildId] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  const month = /^\d{4}-\d{2}-\d{2}$/.test(CURRENT_YMD ?? '') ? CURRENT_YMD.slice(0, 7) : '';
  const weekday = getWeekdayObjectFromDate(CURRENT_YMD);
  // SelectedDateWeekday と同じ曜日算出を使い、切り替え直後の旧Context値を使わない。
  const weekdayId = Number(weekday?.id) || null;
  const facilityId = Number(FACILITY_ID);
  const valid = Boolean(month && weekdayId && Number.isInteger(facilityId) && facilityId > 0);

  // 児童の選択候補は、入退室テーブル側で現在表示されている行のみ。
  const visibleChildren = useMemo(() => {
    const byId = new Map();
    for (const row of attendanceRows ?? []) {
      const id = String(row?.childId ?? '').trim();
      if (id && !byId.has(id)) byId.set(id, { id, name: row?.name || `児童ID: ${id}` });
    }
    return [...byId.values()];
  }, [attendanceRows]);

  const visibleIds = useMemo(() => new Set(visibleChildren.map((child) => child.id)), [visibleChildren]);

  const weekdayDates = useMemo(() => {
    if (!month || !weekdayId) return [];
    const [year, selectedMonth] = month.split('-').map(Number);
    const end = new Date(year, selectedMonth, 0).getDate();
    const dates = [];
    for (let day = 1; day <= end; day += 1) {
      const date = `${month}-${String(day).padStart(2, '0')}`;
      if (Number(getWeekdayObjectFromDate(date)?.id) === weekdayId) dates.push(date);
    }
    return dates;
  }, [month, weekdayId]);

  // 選択日の先週、無ければ先々週を日付フィルターの初期値にする。
  // 日付を手動変更した後は、その選択を保持する。
  useEffect(() => { setSelectedDate(getInitialFilterDate(CURRENT_YMD, weekdayDates)); }, [CURRENT_YMD, weekdayDates]);

  // 入退室テーブルの表示対象から外れた児童は選択解除。
  useEffect(() => {
    if (selectedChildId !== 'all' && !visibleIds.has(selectedChildId)) setSelectedChildId('all');
  }, [selectedChildId, visibleIds]);


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

  const effectiveDate = weekdayDates.includes(selectedDate) ? selectedDate : getInitialFilterDate(CURRENT_YMD, weekdayDates);

  const filteredRecords = useMemo(() => records.filter((record) => {
    if (!visibleIds.has(String(record.children_id))) return false;
    if (selectedChildId !== 'all' && String(record.children_id) !== selectedChildId) return false;
    if (effectiveDate && dateString(record.served_date) !== effectiveDate) return false;
    return true;
  }), [records, visibleIds, selectedChildId, effectiveDate]);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  return (
    <section className="overflow-hidden rounded-lg border border-sky-200 bg-sky-50" aria-label="選択曜日の個人記録一覧">
      <PanelHeader
        embedded={embedded}
        expanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
        month={month}
        weekdayLabel={weekday?.label_jp}
        loading={loading}
        filteredCount={filteredRecords.length}
        totalCount={records.length}
        onRefresh={refresh}
      />
      {expanded && (
        <RecordFilters
          visibleChildren={visibleChildren}
          selectedChildId={selectedChildId}
          onChildChange={setSelectedChildId}
          weekdayDates={weekdayDates}
          selectedDate={effectiveDate}
          onDateChange={setSelectedDate}
        />
      )}
      {expanded && (
        <RecordList records={filteredRecords} loading={loading} error={error} />
      )}
    </section>
  );
}
