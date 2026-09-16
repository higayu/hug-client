import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  History,
  RefreshCw,
} from 'lucide-react';

import {
  getFsoaipRecordsForMonth,
} from './lib/serviceRecords';

const normalizeDate = (value) => {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
};

const formatDate = (value) => {
  const date = normalizeDate(value);

  if (!date) {
    return '日付不明';
  }

  const [year, month, day] = date.split('-');
  return `${year}/${month}/${day}`;
};

const getErrorMessage = (error) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === 'object' &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error || '不明なエラーが発生しました。');
};

export default function SavedRecordsPanel({
  facilityId,
  childId,
  targetDate,
  refreshKey = 0,
}) {
  const initialMonth = useMemo(() => {
    return /^\d{4}-\d{2}-\d{2}$/.test(targetDate || '')
      ? targetDate.slice(0, 7)
      : new Date().toISOString().slice(0, 7);
  }, [targetDate]);

  const [targetMonth, setTargetMonth] = useState(initialMonth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  useEffect(() => {
    setTargetMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    let cancelled = false;

    const loadRecords = async () => {
      if (!facilityId || !childId || !targetMonth) {
        setRecords([]);
        setError('');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await getFsoaipRecordsForMonth({
          facilityId: Number(facilityId),
          childId: Number(childId),
          targetMonth,
        });

        if (!cancelled) {
          setRecords(result);
        }
      } catch (loadError) {
        console.error(
          '[SavedRecordsPanel/loadRecords]',
          loadError,
        );

        if (!cancelled) {
          setRecords([]);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, [
    facilityId,
    childId,
    targetMonth,
    refreshKey,
  ]);

  const toggleExpanded = (recordKey) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);

      if (next.has(recordKey)) {
        next.delete(recordKey);
      } else {
        next.add(recordKey);
      }

      return next;
    });
  };

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <History size={19} className="text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              保存済みF-SOAIP記録
            </h2>
            <p className="text-xs text-gray-500">
              item_id = 2 の登録済み記録を表示します。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-gray-400" />
          <input
            type="month"
            value={targetMonth}
            onChange={(event) => {
              setTargetMonth(event.target.value);
            }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          />
        </div>
      </div>

      <div className="p-5">
        {!facilityId || !childId ? (
          <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            事業所と児童を選択してください。
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
            <RefreshCw size={16} className="animate-spin" />
            保存済み記録を取得中...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            {targetMonth} に保存されたF-SOAIP記録はありません。
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-2 text-xs text-gray-500">
              {records.length}件の記録
            </div>

            {records.map((record, index) => {
              const recordKey = String(
                record?.id ??
                  `${record?.served_date ?? 'unknown'}-${index}`,
              );
              const expanded = expandedIds.has(recordKey);
              const note = String(record?.note ?? '').trim();

              return (
                <article
                  key={recordKey}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/60"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100"
                    onClick={() => toggleExpanded(recordKey)}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800">
                        {formatDate(record?.served_date)}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-gray-500">
                        {note || '記録内容なし'}
                      </div>
                    </div>

                    {expanded ? (
                      <ChevronUp size={17} className="shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown size={17} className="shrink-0 text-gray-400" />
                    )}
                  </button>

                  {expanded && (
                    <div className="border-t border-gray-200 bg-white px-4 py-3">
                      <div className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {note || '記録内容なし'}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                        <span>ID: {record?.id ?? '-'}</span>
                        <span>児童ID: {record?.children_id ?? '-'}</span>
                        <span>施設ID: {record?.facility_id ?? '-'}</span>
                        <span>item_id: {record?.item_id ?? 2}</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
