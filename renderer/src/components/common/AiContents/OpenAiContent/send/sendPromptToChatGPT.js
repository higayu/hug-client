import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToChatGPT({ textValue }) {
  const prompt = typeof textValue === "string" ? textValue.trim() : "";
  if (!prompt) {
    throw new Error("ChatGPTに送信するテキストが空です");
  }

  try {
    const result = await executeAiAutomationFlow({
      flowKey: "ai_chatgpt_prompt_send",
      input: { textValue: prompt },
    });
    if (result !== true) {
      throw new Error(`ChatGPT送信フローが成功を返しませんでした（結果: ${String(result)}）`);
    }
    return true;
  } catch (error) {
    // 内容を含むプロンプト本文はログへ出さない。
    console.error("[ChatGPT DB Flow] send failed:", error);
    throw error;
  }
}
