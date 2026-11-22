import { useRef } from "react"
import TabsContainer from "./TabsContainer"
import DashboardHeader from "./DashboardHeader"

function Dashboard() {
  const sidebarRef = useRef(null)

  return (
    <div
      ref={sidebarRef}
      className="text-black bg-gray-50 flex flex-col h-full"
    >
      <DashboardHeader />

      {/* メインコンテンツ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <TabsContainer />
      </div>
    </div>
  )
}

export default Dashboard