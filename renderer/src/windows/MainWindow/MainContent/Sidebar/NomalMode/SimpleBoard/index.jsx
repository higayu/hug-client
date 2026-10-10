import AttendanceTable from './AttendanceTable';
import SelectChilledWorkSpace from './SelectChilledWorkSpace';
import OverlayPanel from '@/components/ui/ResizableSplitPane/OverlayPanel';

/**
 * 通常ダッシュボードからタブ切替を省き、
 * 日常的に使う児童選択ツールだけを表示する簡易モード。
 */
function SimpleBoard() {
  return (
    <div className="flex h-full flex-col bg-gray-50 text-black">
      <OverlayPanel
        contentClassName="pl-9"
        overlay={({ isExpanded, onExpandedChange }) => (
          <AttendanceTable
            isExpanded={isExpanded}
            onExpandedChange={onExpandedChange}
          />
        )}
      >
        <SelectChilledWorkSpace />
      </OverlayPanel>
    </div>
  );
}

export default SimpleBoard;
