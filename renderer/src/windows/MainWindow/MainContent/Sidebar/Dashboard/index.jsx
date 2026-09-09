import { useRef } from "react"
import TabsContainer from "./TabsContainer"
import DashboardHeader from "./DashboardHeader"

function Dashboard() {
  const DashboardRef = useRef(null)

  return (
    <div
      ref={DashboardRef}
      className="relative isolate text-black bg-gray-50 flex flex-col h-full"
    >
      <DashboardHeader />

      {/* メインコンテンツ */}
      <div className="relative z-0 flex flex-1 min-h-0 overflow-hidden">
        <TabsContainer />
      </div>
    </div>
  )
}

export default Dashboard
