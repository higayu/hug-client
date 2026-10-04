import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToOllama({ textValue, ollamaUrl, model }) {
  if (!textValue || !textValue.trim()) throw new Error("Prompt is empty");
  return executeAiAutomationFlow({
    flowKey: "ai_ollama_prompt_send",
    input: {
      textValue: textValue.trim(),
      ollamaUrl: (ollamaUrl || "http://localhost:11434/api/generate").trim(),
      model,
    },
  });
}
