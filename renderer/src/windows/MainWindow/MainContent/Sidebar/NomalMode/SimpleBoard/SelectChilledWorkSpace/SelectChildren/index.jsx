import { useSelector } from 'react-redux'
import { selectSpace } from '@/store/slices/simpleBoardSlice'
import ChildAttendancePanel from './TodayChildrenList/ChildAttendancePanel'

export default function SelectChildren({ spaceId }) {
  const space = useSelector(selectSpace(spaceId))

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-gray-50">
      <div className="tool-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-w-0 pb-16">
          <h2 className="p-3 text-lg font-bold text-slate-900">{space?.childName}</h2>
          <ChildAttendancePanel spaceId={spaceId} />
        </div>
      </div>
    </div>
  )
}
