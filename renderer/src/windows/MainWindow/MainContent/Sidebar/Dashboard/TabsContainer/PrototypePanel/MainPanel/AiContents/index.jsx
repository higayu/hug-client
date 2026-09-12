// ./Parts/AiContents/index.jsx
import React, { useEffect, useState } from "react";
import { useAppState } from "@/AppStateContext";
import { usePrompt } from "@/hooks/usePrompt";

import OpenAiContent from "./OpenAiContent";
import GeminiContent from "./GeminiContent";
import OllamaContent from "./OllamaContent";
import DeepSeekContent from "./DeepSeekContent";
import OpenRouterContent from "./OpenRouterContent";

const AI_COMPONENT_MAP = {
  gemini: GeminiContent,
  chatGPT: OpenAiContent,
  ollama: OllamaContent,
  deepseek:DeepSeekContent,
  openrouter:OpenRouterContent,
};

export default function AiContents({ spaceId, activePromptKey, onPromptChange, onPromptTabsChange }) {
  const {
    USE_AI,
    DATABASE_TYPE,
    STAFF_ID,
    updateAppState,
  } = useAppState();
  const { getActiveAiPrompts } = usePrompt();
  const [promptError, setPromptError] = useState("");
  const AiComponent = AI_COMPONENT_MAP[USE_AI];

  useEffect(() => {
    if (String(DATABASE_TYPE).toLowerCase() !== "laravel" || !STAFF_ID) {
      return;
    }

    let cancelled = false;

    const loadPrompts = async () => {
      try {
        setPromptError("");

        const prompts = await getActiveAiPrompts({
          databaseType: DATABASE_TYPE,
          staffId: STAFF_ID,
        });

        console.log("[AiContents] AIプロンプト取得結果:", prompts);

        if (!cancelled && prompts) {
          updateAppState({ PROMPTS: prompts });
        }
      } catch (error) {
        console.error("[AiContents] AIプロンプト取得エラー:", error);

        if (!cancelled) {
          setPromptError(
            error?.message || "AIプロンプトの取得に失敗しました。",
          );
        }
      }
    };

    loadPrompts();

    return () => {
      cancelled = true;
    };
  }, [DATABASE_TYPE, STAFF_ID, getActiveAiPrompts, updateAppState]);

  if (!AiComponent) {
    return (
      <div className="text-sm text-gray-500 p-3">
        使用するAIが選択されていません
      </div>
    );
  }

  return (
    <>
      {promptError && (
        <div className="m-2 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">
          {promptError}
        </div>
      )}
      <AiComponent
        spaceId={spaceId}
        activePromptKey={activePromptKey}
        onPromptChange={onPromptChange}
        onPromptTabsChange={onPromptTabsChange}
      />
    </>
  );
}
