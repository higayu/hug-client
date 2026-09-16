import AttendanceTable from './AttendanceTable';
/**
 * 通常ダッシュボードからタブ切替を省き、
 * 日常的に使う児童選択ツールだけを表示する簡易モード。
 */
function SimpleBoard() {
  return (
    <div className="flex h-full flex-col bg-gray-50 text-black">
      <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-white">
        <AttendanceTable />
      </main>
    </div>
  );
}

export default SimpleBoard;
