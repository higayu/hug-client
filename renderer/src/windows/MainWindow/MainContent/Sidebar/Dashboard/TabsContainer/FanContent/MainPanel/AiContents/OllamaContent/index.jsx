import React, { useCallback, useState } from "react";
import { useAppState } from "@/AppStateContext";
import { useToast } from '@/provider/ToastProvider/ToastContext'
import PromptBox from "@/components/common/PromptBox";
import AccountInfoPanel from "@/components/ui/AccountInfoPanel";
import { AI_PROMPT_COMPONENT_MAP } from "./PromptBox"
import { sendPromptToOllama } from "./send/sendPromptToOllama";

export default function OllamaContent({ activePromptKey, onPromptChange, onPromptTabsChange }) {
  const { appState } = useAppState();
  const { showSuccessToast, showErrorToast, showInfoToast } = useToast();
  const [ollamaResults, setOllamaResults] = useState({});

  const sendPrompt = useCallback(
    async ({ textValue, promptKey = "personal" }) => {
      const ollamaUrl = appState.OLLAMA_URL || "http://localhost:11434/api/generate";
      const model = appState.OLLAMA_MODEL || "gemma4:latest";

      showInfoToast("Ollama に送信中…");

      try {
        const text = await sendPromptToOllama({ textValue, ollamaUrl, model });
        setOllamaResults((prev) => ({
          ...prev,
          [promptKey]: text,
        }));

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          }
        } catch (clipboardError) {
          console.warn("[OllamaContent] clipboard write skipped:", clipboardError);
        }

        showSuccessToast("Ollama の応答を取得しました");
        return true;
      } catch (error) {
        console.error("[OllamaContent] send error:", error);
        showErrorToast("Ollama の送信に失敗しました: " + error.message);
        throw error;
      }
    },
    [appState.OLLAMA_URL, appState.OLLAMA_MODEL, showErrorToast, showInfoToast, showSuccessToast]
  );

  const renderOllamaResultArea = useCallback(
    ({ promptKey, label }) => (
      <div className="flex flex-col gap-1">
        <label className="font-bold text-gray-700 block mb-1">
          {label ? label.replace("Gemini API", "Ollama") : "Ollama 返却値"}
        </label>
        <textarea
          className="w-full h-40 p-2 border bg-gray-50 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Ollama の返却値がここに入ります"
          value={ollamaResults[promptKey] || ""}
          onChange={(e) =>
            setOllamaResults((prev) => ({
              ...prev,
              [promptKey]: e.target.value,
            }))
          }
        />
      </div>
    ),
    [ollamaResults]
  );

  return (
    <div className="flex flex-col items-center justify-center w-full p-2 space-y-3">
      <PromptBox
        componentMap={AI_PROMPT_COMPONENT_MAP}
        activeKey={activePromptKey}
        onActiveKeyChange={onPromptChange}
        onTabsChange={onPromptTabsChange}
        sendPrompt={sendPrompt}
        aiName="Ollama"
        renderOllamaResultArea={renderOllamaResultArea}
      />

      <AccountInfoPanel
        title="Ollama 設定"
        items={[
          { label: "URL", value: appState.OLLAMA_URL || "http://localhost:11434/api/generate" },
          { label: "MODEL", value: appState.OLLAMA_MODEL || "gemma4:latest" },
        ]}
      />
    </div>
  );
}
