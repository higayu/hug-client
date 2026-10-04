import React from 'react'
import { FaRobot } from 'react-icons/fa'

import { useTabs } from '@/hooks/useTabs'

export default function OpenAiTabButton() {
  const { addOpenAiTab } = useTabs()

  return (
    <button
      type="button"
      onClick={addOpenAiTab}
      className="
        min-w-[150px]
        flex items-center justify-center gap-2
        bg-indigo-600 hover:bg-indigo-700
        text-white rounded-xl shadow-md
        px-3 py-2 transition-colors
      "
      title="新しいタブで開く"
    >
      <FaRobot size={18} />
      <span>OpenAIを起動</span>
    </button>
  )
}
