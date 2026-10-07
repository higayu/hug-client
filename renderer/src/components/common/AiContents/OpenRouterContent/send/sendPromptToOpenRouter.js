import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToOpenRouter({ textValue, apiKey, model }) {
  if (!apiKey) throw new Error("OPEN_ROUTER_API_KEY is not configured");
  if (!textValue || !textValue.trim()) throw new Error("Prompt is empty");
  return executeAiAutomationFlow({
    flowKey: "ai_openrouter_prompt_send",
    input: { textValue: textValue.trim(), apiKey, model },
  });
}
