// renderer/src/components/Sidebar/AiInquiry/MainContainer/index.jsx

import { useAppState } from '@/AppStateContext'

import ChatPage from './Pages/ChatPage'
import PersonalRecordPage from './Pages/PersonalRecordPage'

export const MainContainer = () => {
  const {
    AI_INQUIRY_SELECTED_ITEM_ID,
  } = useAppState()

  const renderContent = () => {
    switch (
      AI_INQUIRY_SELECTED_ITEM_ID
    ) {

      case 'personalRecord':
        return <PersonalRecordPage />

      case 'chat':
      default:
        return <ChatPage />
    }
  }

  return (
    <main
      className="
        min-h-0
        min-w-0
        flex-1
        overflow-hidden
        bg-gray-50
      "
    >
      {renderContent()}
    </main>
  )
}

export default MainContainer