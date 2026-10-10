import { useState } from 'react';
import AttendanceTable from './AttendanceTable';
import SelectChilledWorkSpace from './SelectChilledWorkSpace';
/**
 * 通常ダッシュボードからタブ切替を省き、
 * 日常的に使う児童選択ツールだけを表示する簡易モード。
 */
function SimpleBoard() {
  const [isTableExpanded, setIsTableExpanded] = useState(true);
  return (
    <div className="flex h-full flex-col bg-gray-50 text-black">
      <main className="relative min-h-0 flex-1 overflow-hidden bg-white">
        <div
          className="h-full overflow-auto pl-9"
          inert={isTableExpanded ? '' : undefined}
          aria-hidden={isTableExpanded}
        >
          <SelectChilledWorkSpace />
        </div>
        <AttendanceTable
          isExpanded={isTableExpanded}
          onExpandedChange={setIsTableExpanded}
        />
      </main>
    </div>
  );
}

export default SimpleBoard;
