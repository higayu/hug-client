import React, { useEffect } from "react"
import { useAppState } from "@/AppStateContext"
import PromptBox from "@/components/common/PromptBox"
import AccountInfoPanel from "@/components/ui/AccountInfoPanel"

import { AI_PROMPT_COMPONENT_MAP } from "./PromptBox"
import { sendPromptToChatGPT } from "./send/sendPromptToChatGPT";

export default function OpenAiContent({ activePromptKey, onPromptChange, onPromptTabsChange }) {
  const { appState, PROMPTS } = useAppState()

  useEffect(() => {
    console.log("🟦 OpenAiContent コンポーネント初期化（マウント）")
    console.log(" appState:", appState)
    console.log("PROMPTSのデータ", PROMPTS)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center w-full p-2 space-y-3">
      <div>ChatGPT</div>
      <PromptBox 
        sendPrompt={sendPromptToChatGPT}
        aiName="ChatGpt"
        componentMap={AI_PROMPT_COMPONENT_MAP}
        activeKey={activePromptKey}
        onActiveKeyChange={onPromptChange}
        onTabsChange={onPromptTabsChange} 
      />
      
      <AccountInfoPanel
        title="OpenAI アカウント情報"
        items={[
          { label: "MAIL", value: appState.OPENAI_MAIL },
          { label: "PASSWORD", value: appState.OPENAI_PASSWORD },
        ]}
      />
    </div>
  )
}
