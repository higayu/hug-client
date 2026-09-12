import { useEffect } from 'react'
import TodayChildrenList from './TodayChildrenList'

export default function SelectChildren({ spaceId }) {
  useEffect(() => {
    console.log('🧰 FanContent SelectChildren: 実データモードで起動しました', { spaceId })
  }, [spaceId])

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="tool-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-w-0">
          <TodayChildrenList spaceId={spaceId} />
        </div>
      </div>
    </div>
  )
}
