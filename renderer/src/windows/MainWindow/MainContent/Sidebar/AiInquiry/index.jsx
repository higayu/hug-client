// src/components/Sidebar/AiInquiry/index.jsx

import MainContainer from './MainContainer'
import VerticalNav from './VerticalNav'

import './index.css'

export const AiInquiry = () => {
  return (
    <div
      className="
        flex
        h-full
        min-h-0
        min-w-0
        bg-gray-50
        dark:bg-gray-900
      "
    >
      <VerticalNav />

      <main
        className="
          min-h-0
          min-w-0
          flex-1
          overflow-y-auto
        "
      >
        <MainContainer />
      </main>
    </div>
  )
}

export default AiInquiry