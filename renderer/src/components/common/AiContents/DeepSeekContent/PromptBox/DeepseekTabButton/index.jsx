import React from 'react'

import { useTabs } from '@/hooks/useTabs'
import tabIcon from '@assets/images/icon.png'

export default function DeepseekTabButton() {
  const { addDeepseekTab } = useTabs()

  return (
    <button
      type="button"
      onClick={addDeepseekTab}
      className="
        min-w-[150px]
        flex items-center justify-center gap-2
        bg-white hover:bg-blue-300
        text-blue-600
        rounded-xl shadow-md
        px-3 py-2
        transition-colors
      "
      title="新しいタブで開く"
    >
      <img
        src={tabIcon}
        alt="DeepSeek"
        className="w-[20px] h-[20px] object-contain"
      />
      <span>DeepSeekを起動</span>
    </button>
  )
}
