import SelectChildren from './SelectChildren'
import WorkingPanel from './WorkingPanel'
import FanMenu from './FanMenu'

export default function FanContent() {
  return (
    <section
      className="flex h-full"
      aria-label="児童選択とメインパネル"
    >
      {/* 左: 実データの児童選択 */}
      <div className="relative w-[340px] min-w-[280px] max-w-[420px] shrink-0 overflow-visible">
        <SelectChildren />

        {/* 左下の空き領域にFanMenuを配置 */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-30">
          <FanMenu />
        </div>
      </div>

      {/* 右: AppStateContext の選択児童に連動する実データパネル */}
      <div className="min-w-0 flex-1 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <WorkingPanel />
      </div>
    </section>
  )
}
