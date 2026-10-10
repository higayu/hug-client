import { useMemo, useState } from 'react';

import AttendanceHeader from './components/AttendanceHeader';
import AttendanceDataTable from './components/AttendanceDataTable';
import AttendanceMessage from './components/AttendanceMessage';
import { useSimpleAttendance } from './hooks/useSimpleAttendance';

/**
 * SimpleBoard テーブル用フィルタ
 *
 * SimpleBoard 内だけで使用するローカル state。
 * AppStateContext の SELECT_CHILD_FILTER_MODE とは連動させない。
 *
 * 0: 全件
 * 1: 退室済み以外
 * 2: 退室済みと欠席以外
 * 3: 欠席
 * 4: 退室済み
 */
const FILTER_MODE = {
  ALL: 0,
  EXCLUDE_LEFT: 1,
  EXCLUDE_LEFT_AND_ABSENT: 2,
  ABSENT_ONLY: 3,
  LEFT_ONLY: 4,
};

function hasActualLeaveTime(row) {
  const value = String(row?.leaveTime ?? '').trim();

  // 実際の退室時刻が HH:mm 形式で入っている場合だけ「退室済み」とする。
  // 退室ボタン(canLeave)の有無は退室済み判定には使わない。
  return /^\d{1,2}:\d{2}$/.test(value);
}

function filterAttendanceRows(rows, filterMode) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const mode = Number(filterMode ?? FILTER_MODE.ALL);

  switch (mode) {
    case FILTER_MODE.EXCLUDE_LEFT:
      return safeRows.filter((row) => !hasActualLeaveTime(row));

    case FILTER_MODE.EXCLUDE_LEFT_AND_ABSENT:
      return safeRows.filter((row) => {
        const isLeft = hasActualLeaveTime(row);
        const isAbsent = row?.isAbsent === true;

        return !isLeft && !isAbsent;
      });

    case FILTER_MODE.ABSENT_ONLY:
      return safeRows.filter((row) => row?.isAbsent === true);

    case FILTER_MODE.LEFT_ONLY:
      return safeRows.filter((row) => hasActualLeaveTime(row));

    case FILTER_MODE.ALL:
    default:
      return safeRows;
  }
}

export default function AttendanceTable() {
  // SimpleBoard 専用のローカルフィルター。
  // 他の Dashboard / FanContent のフィルター状態へ影響させない。
  const [filterMode, setFilterMode] = useState(FILTER_MODE.ALL);

  const {
    rows,
    loading,
    actionRowId,
    error,
    lastUpdatedAt,
    runAction,
  } = useSimpleAttendance();

  const filteredRows = useMemo(
    () => filterAttendanceRows(rows, filterMode),
    [rows, filterMode],
  );

  return (
    <div className="p-4">
      <AttendanceHeader
        lastUpdatedAt={lastUpdatedAt}
        totalCount={rows.length}
        filteredCount={filteredRows.length}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
      />

      <AttendanceMessage
        error={error}
        loading={loading}
        hasRows={filteredRows.length > 0}
        hasSourceRows={rows.length > 0}
      />

      {(loading || rows.length > 0) && (
        <AttendanceDataTable
          rows={filteredRows}
          actionRowId={actionRowId}
          onAction={runAction}
        />
      )}
    </div>
  );
}
