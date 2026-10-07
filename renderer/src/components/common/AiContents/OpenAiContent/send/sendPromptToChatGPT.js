import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToChatGPT({ textValue }) {
  if (!textValue || !textValue.trim()) return false;
  try {
    return Boolean(await executeAiAutomationFlow({
      flowKey: "ai_chatgpt_prompt_send",
      input: { textValue: textValue.trim() },
    }));
  } catch (error) {
    console.error("[ChatGPT DB Flow] send failed", error);
    return false;
  }
}
