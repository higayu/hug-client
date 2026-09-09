// renderer/src/components/Sidebar/Dashboard/TabsContainer.jsx
import ToolContent from './SelectChildren'
import InsertChildren from './InsertChildren'
import UpdateManager from './UpdateManager'
import { useAppState } from '@/AppStateContext';
import SpeechToText from './SpeechToText';
import FanContent from './FanContent';

function TabsContainer() {
  const {
    activeSidebarTab: activeTab,
    DEBUG_FLG,
  } = useAppState()

  return (
    <div className="flex flex-col w-full h-full">
      {/* --- コンテンツ切り替え --- */}
      <div className="flex-1 overflow-auto bg-white">

        {activeTab === 'FanContent' && (
          <div className="h-full flex flex-col">
            <FanContent />
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="h-full flex flex-col">
            <ToolContent />
          </div>
        )}

        {activeTab === 'insertManageChildren' && (
          <div className="h-full flex flex-col">
            <InsertChildren />
          </div>
        )}

        {activeTab === 'updateManager' && (
          <div className="h-full flex flex-col">
            <UpdateManager />
          </div>
        )}

        {DEBUG_FLG && activeTab === 'speechToText' && (
          <div className="h-full flex flex-col">
            <SpeechToText />
          </div>
        )}

      </div>
    </div>
  )
}

export default TabsContainer
