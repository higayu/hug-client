import React, { useCallback, useState } from "react";
import { useAppState } from "@/AppStateContext";
import { useToast } from '@/provider/ToastProvider/ToastContext'
import PromptPanel from "@/components/common/PromptPanel";
import { AI_PROMPT_COMPONENT_MAP } from "./PromptBox"
import { sendPromptToLaravelApi } from "./send/sendPromptToLaravelApi";

export default function LaravelApiContent({ spaceId, activePromptKey, onPromptChange, onPromptTabsChange }) {
  const { appState } = useAppState();
  const { showSuccessToast, showErrorToast, showInfoToast } = useToast();
  const [laravelApiResults, setLaravelApiResults] = useState({});

  const sendPrompt = useCallback(
    async ({ prompt, message, promptKey = "personal" }) => {

      showInfoToast("Laravel API に送信中…");
      try {
        const text = await sendPromptToLaravelApi({
          prompt,
          message,
          promptKey,
        });
        setLaravelApiResults((prev) => ({
          ...prev,
          [promptKey]: text,
        }));

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          }
        } catch (clipboardError) {
          console.warn("[LaravelApiContent] clipboard write skipped:", clipboardError);
        }

        showSuccessToast("Laravel API の応答を取得しました");
        return true;
      } catch (error) {
        console.error("[LaravelApiContent] send error:", error);
        showErrorToast("Laravel API の送信に失敗しました");
        throw error;
      }
    },
    [showErrorToast, showInfoToast, showSuccessToast]
  );

  const renderLaravelApiResultArea = useCallback(
    ({ promptKey, label }) => (
      <div className="flex flex-col gap-1">
        <label className="font-bold text-gray-700 block mb-1">
          {label || "Laravel API 返却値"}
        </label>
        <textarea
          className="w-full h-40 p-2 border bg-gray-50 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Laravel API の返却値がここに入ります"
          value={laravelApiResults[promptKey] || ""}
          onChange={(e) =>
            setLaravelApiResults((prev) => ({
              ...prev,
              [promptKey]: e.target.value,
            }))
          }
        />
      </div>
    ),
    [laravelApiResults]
  );

  return (
    <div className="flex flex-col items-center justify-center w-full p-2 space-y-3">
      <PromptPanel
        spaceId={spaceId}
        componentMap={AI_PROMPT_COMPONENT_MAP}
        activeKey={activePromptKey}
        onActiveKeyChange={onPromptChange}
        onTabsChange={onPromptTabsChange}
        sendPrompt={sendPrompt}
        aiName="Laravel API"
        renderLaravelApiResultArea={renderLaravelApiResultArea}
      />
    </div>
  );
}
