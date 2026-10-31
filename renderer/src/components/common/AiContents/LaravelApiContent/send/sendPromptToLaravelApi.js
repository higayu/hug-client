import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToLaravelApi({ textValue, prompt, message, promptKey = "personal" }) {
  const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  // Laravel側のFlowは prompt / message を別フィールドで要求するため維持する。
  // UI側で組み立てた全送信テキストも受け取り、引数の食い違いを検出する。
  if (typeof textValue === "string" && !textValue.trim()) {
    throw new Error("Laravel APIに送信するテキストが空です");
  }
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
