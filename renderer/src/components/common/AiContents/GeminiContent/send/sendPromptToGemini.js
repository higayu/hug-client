import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToGemini({ textValue, apiKey, model }) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  if (!textValue || !textValue.trim()) throw new Error("Prompt is empty");
  return executeAiAutomationFlow({
    flowKey: "ai_gemini_prompt_send",
    input: { textValue: textValue.trim(), apiKey, model },
  });
}
