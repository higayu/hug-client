import { useEffect, useMemo, useState } from 'react';
import PersonalRecordCard from './PersonalRecordCard';
import RecordPagination from './RecordPagination';

const dateString = (value) => String(value ?? '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';

/** フィルター済み個人記録を1ページにつき1件表示する。 */
export default function RecordList({ records = [], loading, error }) {
  const [page, setPage] = useState(0);
  const sortedRecords = useMemo(() => [...records].sort((a, b) =>
    dateString(a.served_date).localeCompare(dateString(b.served_date)) ||
    String(a.children_name ?? '').localeCompare(String(b.children_name ?? ''), 'ja') ||
    Number(a.id ?? 0) - Number(b.id ?? 0)
  ), [records]);

  // 児童・日付フィルターの変更時は先頭の記録から表示する。
  useEffect(() => { setPage(0); }, [records]);

  const total = sortedRecords.length;
  const currentPage = Math.min(page, Math.max(0, total - 1));
  const record = sortedRecords[currentPage];

  return (
    <div className="space-y-3 border-t border-sky-200 bg-white p-3">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading && <p role="status" className="text-sm text-slate-600">サービス記録を取得しています…</p>}
      {!loading && !error && total === 0 && (
        <p className="text-sm text-slate-500">指定した児童・日付に該当する個人記録はありません。</p>
      )}
      {!loading && !error && record && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-800">
            <span className="font-semibold">{dateString(record.served_date)}</span>
            <span className="text-xs text-slate-600">個人記録 {currentPage + 1} / {total} 件</span>
            <RecordPagination page={currentPage} total={total} onPageChange={setPage} />
          </div>
          <PersonalRecordCard key={record.id ?? `${record.served_date}-${record.children_id}-${currentPage}`} record={record} />
        </>
      )}
    </div>
  );
}
