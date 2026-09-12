// renderer/src/components/Sidebar/ToolContent.jsx

import { useEffect, useState } from 'react';
import TodayChildrenList from './TodayChildrenList';
import ChildAttendancePanel from './ChildAttendancePanel';
import MainPanel from "./MainPanel";

function ToolContent({ spaceId = 'top' }) {
  const [activeTool, setActiveTool] = useState('default');

  useEffect(() => {
    console.log('🧰 ToolContent がマウントされました')
  }, [])

  return (
    <div className="w-full flex flex-col">
      {/* SidebarContent と ChildAttendancePanel を横並びに配置 */}
      <div className="tool-content flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-[5] min-w-0">
          <TodayChildrenList spaceId={spaceId} />
        </div>
        <div className="flex-[5] min-w-0">
          <ChildAttendancePanel spaceId={spaceId} />
        </div>
      </div>
      {/* AI + メモツール */}
      <div className="mt-4 border-t rounded bg-gray-200 border-gray-300 pt-3">
        <MainPanel spaceId={spaceId} />
      </div>
    </div>

  )
}

export default ToolContent
