import React, { useEffect } from "react"
import { useAppState } from "@/AppStateContext";
import PromptBox from "@/components/common/PromptBox"
import AccountInfoPanel from "@/components/ui/AccountInfoPanel";
import { AI_PROMPT_COMPONENT_MAP } from "./PromptBox"
import { sendPromptToDeepSeek } from "./send/sendPromptToDeepSeek";

export default function DeepSeekContent({ activePromptKey, onPromptChange, onPromptTabsChange }) {
  const { appState, PROMPTS } = useAppState()

  useEffect(() => {
    console.log("🟦 OpenAiContent コンポーネント初期化（マウント）")
    console.log(" appState:", appState)
    console.log("PROMPTSのデータ", PROMPTS)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center w-full p-2 space-y-3">
      <PromptBox 
        sendPrompt={sendPromptToDeepSeek}
        aiName="DeepSeek"
        componentMap={AI_PROMPT_COMPONENT_MAP}
        activeKey={activePromptKey}
        onActiveKeyChange={onPromptChange}
        onTabsChange={onPromptTabsChange} 
      />

      <AccountInfoPanel
        title="OpenAI アカウント情報"
        items={[
          { label: "MAIL", value: appState.DEEPSEEK_MAIL },
          { label: "PASSWORD", value: appState.DEEPSEEK_PASSWORD },
        ]}
      />
    </div>
  )
}
