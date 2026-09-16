import { useEffect } from 'react';
import AttendanceRow from './AttendanceRow';

export default function AttendanceDataTable({
  rows,
  actionRowId,
  onAction,
}) {
  useEffect(() => {
    const safeRows = Array.isArray(rows) ? rows : [];

    console.log('=== AttendanceDataTable / 出席データ取得結果確認 ===');
    console.log('取得結果 rows:', safeRows);
    console.log('rowCount:', safeRows.length);
    console.log(
      '入室可能 count:',
      safeRows.filter((row) => row?.canEnter).length,
    );
    console.log(
      '退室可能 count:',
      safeRows.filter((row) => row?.canLeave).length,
    );
    console.log(
      '欠席 count:',
      safeRows.filter((row) => row?.isAbsent).length,
    );

    if (safeRows.length > 0) {
      console.table(
        safeRows.map((row, index) => ({
          index: index + 1,
          rId: row?.rId,
          childId: row?.childId,
          name: row?.name,
          furiganaName: row?.furiganaName,
          enterTime: row?.enterTime,
          leaveTime: row?.leaveTime,
          canEnter: row?.canEnter,
          canLeave: row?.canLeave,
          isAbsent: row?.isAbsent,
        })),
      );
    }
  }, [rows]);

  return (
    <div className="overflow-x-auto rounded border shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            <th className="border border-slate-300 p-3 text-left">児童名</th>
            <th className="border border-slate-300 p-3">入室</th>
            <th className="border border-slate-300 p-3">退室</th>
            <th className="border border-slate-300 p-3">専門支援</th>
            <th className="border border-slate-300 p-3">操作</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <AttendanceRow
              key={row.rId}
              row={row}
              busy={actionRowId === row.rId}
              onAction={onAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
