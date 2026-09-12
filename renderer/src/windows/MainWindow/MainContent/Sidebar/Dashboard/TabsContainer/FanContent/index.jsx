import SelectChildren from './SelectChildren'
import WorkingPanel from './WorkingPanel'
import FanMenu from './FanMenu'

export default function FanContent({ spaceId }) {
  return (
    <section
      className="flex h-full min-h-0"
      aria-label="児童選択とメインパネル"
    >
      <div className="relative w-[340px] min-w-[280px] max-w-[420px] shrink-0 overflow-visible">
        <SelectChildren spaceId={spaceId} />

        <div className="pointer-events-none absolute bottom-0 left-0 z-30">
          <FanMenu />
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <WorkingPanel spaceId={spaceId} />
      </div>
    </section>
  )
}
