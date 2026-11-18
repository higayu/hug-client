import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

export async function sendPromptToLaravelApi({ textValue, prompt, message, childId, promptKey = "personal" }) {
  if (promptKey === "personal" || promptKey === "professional1") {
    const isProfessional = promptKey === "professional1";
    const api = isProfessional
      ? window.electronAPI?.laravel_aiRecordEditer_correctProfessionalSupportTwoStage
      : window.electronAPI?.laravel_aiRecordEditer_correctPersonalRecordWithPlan;
    if (!api) throw new Error("Laravelの計画を使用したAI機能を読み込むため、アプリを再起動してください。");
    if (!childId || !message?.trim()) throw new Error("対象児童とAIに送信するテキストを指定してください。");
    const result = await api({ child_id: childId, message: message.trim() });
    const data = result?.data?.data ?? result?.data;
    if (!result?.success || data?.success === false) throw new Error(result?.message || data?.message || "AI記録の生成に失敗しました。");
    if (typeof data?.message !== "string" || !data.message.trim()) throw new Error("AI記録の応答が空です。");
    return data.message;
  }
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
