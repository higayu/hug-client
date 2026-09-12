import { useRef } from "react"
import TabsContainer from "./TabsContainer"
import DashboardHeader from "./DashboardHeader"
import VerticaPanel from "@/components/ui/ResizableSplitPane/VerticaPanel"

function Dashboard() {
  const DashboardRef = useRef(null)

  return (
    <div
      ref={DashboardRef}
      className="relative isolate text-black bg-gray-50 flex flex-col h-full min-h-0"
    >
      <DashboardHeader />

      <div className="relative z-0 flex flex-1 min-h-0 overflow-hidden">
        <VerticaPanel
          defaultTopPercent={50}
          minTopHeight={160}
          minBottomHeight={160}
          top={<TabsContainer spaceId="left" />}
          bottom={<TabsContainer spaceId="right" />}
        />
      </div>
    </div>
  )
}

export default Dashboard
