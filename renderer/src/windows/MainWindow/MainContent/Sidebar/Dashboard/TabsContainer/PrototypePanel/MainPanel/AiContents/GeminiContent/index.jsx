import React, { useCallback, useState } from "react";
import { useAppState } from "@/AppStateContext";
import { useToast } from '@/provider/ToastProvider/ToastContext'
import PromptBox from "@/components/common/PromptBox";
import AccountInfoPanel from "@/components/ui/AccountInfoPanel";
import { AI_PROMPT_COMPONENT_MAP } from "./PromptBox"
import { sendPromptToGemini } from "./send/sendPromptToGemini";

export default function GeminiContent({ activePromptKey, onPromptChange, onPromptTabsChange }) {
  const { appState } = useAppState();
  const { showSuccessToast, showErrorToast, showInfoToast } = useToast();
  const [geminiResults, setGeminiResults] = useState({});

  const sendPrompt = useCallback(
    async ({ textValue, promptKey = "personal" }) => {
      const apiKey = appState.GEMINI_API_KEY;
      const model = appState.GEMINI_MODEL || "gemini-3.5-flash";

      if (!apiKey) {
        showErrorToast("GEMINI_API_KEY が設定されていません");
        throw new Error("GEMINI_API_KEY is not configured");
      }

      showInfoToast("Gemini API に送信中…");

      try {
        const text = await sendPromptToGemini({ textValue, apiKey, model });
        setGeminiResults((prev) => ({
          ...prev,
          [promptKey]: text,
        }));

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          }
        } catch (clipboardError) {
          console.warn("[GeminiContent] clipboard write skipped:", clipboardError);
        }

        showSuccessToast("Gemini API の応答を取得しました");
        return true;
      } catch (error) {
        console.error("[GeminiContent] send error:", error);
        showErrorToast("Gemini API の送信に失敗しました");
        throw error;
      }
    },
    [appState.GEMINI_API_KEY, appState.GEMINI_MODEL, showErrorToast, showInfoToast, showSuccessToast]
  );

  const renderGeminiResultArea = useCallback(
    ({ promptKey, label }) => (
      <div className="flex flex-col gap-1">
        <label className="font-bold text-gray-700 block mb-1">
          {label || "Gemini API 返却値"}
        </label>
        <textarea
          className="w-full h-40 p-2 border bg-gray-50 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Gemini API の返却値がここに入ります"
          value={geminiResults[promptKey] || ""}
          onChange={(e) =>
            setGeminiResults((prev) => ({
              ...prev,
              [promptKey]: e.target.value,
            }))
          }
        />
      </div>
    ),
    [geminiResults]
  );

  return (
    <div className="flex flex-col items-center justify-center w-full p-2 space-y-3">
      <h2>Gemini-API</h2>
      <PromptBox
        componentMap={AI_PROMPT_COMPONENT_MAP}
        activeKey={activePromptKey}
        onActiveKeyChange={onPromptChange}
        onTabsChange={onPromptTabsChange}
        sendPrompt={sendPrompt}
        aiName="Gemini"
        renderGeminiResultArea={renderGeminiResultArea}
      />

      <AccountInfoPanel
        title="Gemini API 設定"
        items={[
          { label: "API KEY", value: appState.GEMINI_API_KEY },
          { label: "MODEL", value: appState.GEMINI_MODEL || "gemini-3.5-flash" },
        ]}
      />
    </div>
  );
}
