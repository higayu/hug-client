import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToDeepSeek({ textValue }) {
  if (!textValue || !textValue.trim()) return false;
  try {
    return Boolean(await executeAiAutomationFlow({
      flowKey: "ai_deepseek_prompt_send",
      input: { textValue: textValue.trim() },
    }));
  } catch (error) {
    console.error("[DeepSeek DB Flow] send failed", error);
    return false;
  }
}
