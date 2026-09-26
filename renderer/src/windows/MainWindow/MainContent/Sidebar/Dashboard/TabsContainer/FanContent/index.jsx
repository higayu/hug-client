import { useSelector } from 'react-redux'

import VerticaPanel from '@/components/ui/ResizableSplitPane/VerticaPanel'
import HorizonPanel from '@/components/ui/ResizableSplitPane/HorizonPanel'

import { selectSpaceCount } from '@/store/slices/chilledspaceSlice'

import SelectChildren from './SelectChildren'
import WorkingPanel from './WorkingPanel'
import FanMenu from './FanMenu'

function FanContentSpace({ spaceId }) {
  return (
    <section
      className="h-full min-h-0 min-w-0"
      aria-label={`児童選択とメインパネル ${spaceId}`}
    >
      <HorizonPanel
        defaultLeftPercent={30}
        minLeftWidth={280}
        minRightWidth={300}
        resizeBarWidth={10}
        gripWidth={6}
        left={(
          <div className="relative h-full min-h-0 min-w-0 overflow-visible">
            <SelectChildren spaceId={spaceId} />

            <div className="pointer-events-none absolute bottom-0 left-0 z-30">
              <FanMenu spaceId={spaceId} />
            </div>
          </div>
        )}
        right={(
          <div className="h-full min-h-0 min-w-0 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <WorkingPanel spaceId={spaceId} />
          </div>
        )}
      />
    </section>
  )
}

export default function FanContent() {
  const spaceCount = useSelector(selectSpaceCount)
  const isSplit = spaceCount >= 2

  if (!isSplit) {
    return <FanContentSpace spaceId="top" />
  }

  return (
    <VerticaPanel
      defaultTopPercent={50}
      minTopHeight={160}
      minBottomHeight={160}
      top={<FanContentSpace spaceId="top" />}
      bottom={<FanContentSpace spaceId="bottom" />}
    />
  )
}