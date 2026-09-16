import InsertChildren from './InsertChildren'
import UpdateManager from './UpdateManager'
import { useAppState } from '@/AppStateContext'
import SpeechToText from './SpeechToText'
import FanContent from './FanContent'
import SimpleBoard from './SimpleBoard'

function TabsContainer() {
  const {
    activeSidebarTab: activeTab,
    DEBUG_FLG,
  } = useAppState()

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-auto bg-white">
        {activeTab === 'FanContent' && (
          <div className="h-full flex flex-col">
            <FanContent />
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

        {activeTab === 'simpleBoard' && (
          <div className="h-full flex flex-col">
            <SimpleBoard />
          </div>
        )}
      </div>
    </div>
  )
}

export default TabsContainer
