import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToLaravelApi({ prompt, message, promptKey = "personal" }) {
  const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  if (!normalizedPrompt) throw new Error("Prompt is empty");
  if (!normalizedMessage) throw new Error("Message is empty");

  return executeAiAutomationFlow({
    flowKey: "ai_laravel_prompt_send",
    input: {
      prompt: normalizedPrompt,
      message: normalizedMessage,
      promptKey,
    },
  });
}
