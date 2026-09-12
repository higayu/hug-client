import React, { useCallback, useState } from "react";
import { useAppState } from "@/AppStateContext";
import { useToast } from '@/provider/ToastProvider/ToastContext'
import PromptBox from "@/components/common/PromptBox";
import AccountInfoPanel from "@/components/ui/AccountInfoPanel";
import { AI_PROMPT_COMPONENT_MAP } from "./PromptBox"
import { sendPromptToOpenRouter } from "./send/sendPromptToOpenRouter";

export default function OpenRouterContent({ spaceId, activePromptKey, onPromptChange, onPromptTabsChange }) {
  const { appState } = useAppState();
  const { showSuccessToast, showErrorToast, showInfoToast } = useToast();
  const [openRouterResults, setopenRouterResults] = useState({});

  const sendPrompt = useCallback(
    async ({ textValue, promptKey = "personal" }) => {
      const apiKey = appState.OPEN_ROUTER_API_KEY;
      const model = appState.OPEN_ROUTER_MODEL || "openai/gpt-oss-120b:free";

      if (!apiKey) {
        showErrorToast("OPEN_ROUTER_API_KEY が設定されていません");
        throw new Error("OPEN_ROUTER_API_KEY is not configured");
      }

      showInfoToast("OpenRouter API に送信中…");

      try {
        const text = await sendPromptToOpenRouter({ textValue, apiKey, model });
        setopenRouterResults((prev) => ({
          ...prev,
          [promptKey]: text,
        }));

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          }
        } catch (clipboardError) {
          console.warn("[OpenRouter] clipboard write skipped:", clipboardError);
        }

        showSuccessToast("OpenRouter API の応答を取得しました");
        return true;
      } catch (error) {
        console.error("[OpenRouterContent] send error:", error);
        showErrorToast("OpenRouter の送信に失敗しました");
        throw error;
      }
    },
    [appState.OPEN_ROUTER_API_KEY, appState.OPEN_ROUTER_MODEL, showErrorToast, showInfoToast, showSuccessToast]
  );

  const renderOpenRouterResultArea = useCallback(
    ({ promptKey, label }) => (
      <div className="flex flex-col gap-1">
        <label className="font-bold text-gray-700 block mb-1">
          {label || "OpenRouter API 返却値"}
        </label>
        <textarea
          className="w-full h-40 p-2 border bg-gray-50 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="OpenRouter API の返却値がここに入ります"
          value={openRouterResults[promptKey] || ""}
          onChange={(e) =>
            setopenRouterResults((prev) => ({
              ...prev,
              [promptKey]: e.target.value,
            }))
          }
        />
      </div>
    ),
    [openRouterResults]
  );

  return (
    <div className="flex flex-col items-center justify-center w-full p-2 space-y-3">
      <PromptBox
        spaceId={spaceId}
        componentMap={AI_PROMPT_COMPONENT_MAP}
        activeKey={activePromptKey}
        onActiveKeyChange={onPromptChange}
        onTabsChange={onPromptTabsChange}
        sendPrompt={sendPrompt}
        aiName="OpenRouter"
        renderOpenRouterResultArea={renderOpenRouterResultArea}
      />

      <AccountInfoPanel
        title="OpenRouter設定"
        items={[
          { label: "API KEY", value: appState.OPEN_ROUTER_API_KEY },
          { label: "MODEL", value: appState.OPEN_ROUTER_MODEL || "openai/gpt-oss-120b:free" },
        ]}
      />
    </div>
  );
}
