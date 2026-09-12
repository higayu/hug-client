import PrototypePanel from './PrototypePanel'
import InsertChildren from './InsertChildren'
import UpdateManager from './UpdateManager'
import { useAppState } from '@/AppStateContext'
import SpeechToText from './SpeechToText'
import FanContent from './FanContent'

function TabsContainer({ spaceId }) {
  const {
    activeSidebarTab: activeTab,
    DEBUG_FLG,
  } = useAppState()

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-auto bg-white">
        {activeTab === 'FanContent' && (
          <div className="h-full flex flex-col">
            <FanContent spaceId={spaceId} />
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="h-full flex flex-col">
            <PrototypePanel spaceId={spaceId} />
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
