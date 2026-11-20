
import { executeAiAutomationFlow } from "../../common/webAutomation/executeAiAutomationFlow.js";

// ==========================================
// APIエラー情報を保持したErrorを生成
// ==========================================

function createLaravelApiError(result, data) {
  const errorData = result?.error ?? data?.error ?? {};

  const message =
    result?.message ||
    data?.message ||
    errorData?.message ||
    "AI記録の生成に失敗しました。";

  const error = new Error(message);

  error.type =
    errorData?.type ??
    result?.meta?.error_type ??
    "unknown";

  error.code =
    errorData?.code ??
    result?.code ??
    null;

  error.status =
    errorData?.status ??
    errorData?.http_status ??
    result?.status ??
    null;

  error.timeout_ms =
    errorData?.timeout_ms ??
    result?.meta?.timeout_ms ??
    null;

  error.original_message =
    errorData?.original_message ??
    null;

  error.details = errorData;

  return error;
}

// ==========================================
// エラー情報の補完
// ==========================================

function normalizeCaughtError(error) {
  if (error instanceof Error) {
    if (!error.type) {
      const code = String(error.code ?? "").toUpperCase();

      if (
        code === "ECONNABORTED" ||
        code === "ETIMEDOUT" ||
        /timeout of \d+ms exceeded/i.test(error.message)
      ) {
        error.type = "timeout";
      } else {
        error.type = "unknown";
      }
    }

    return error;
  }

  const normalizedError = new Error(
    error?.message || "AI記録の生成に失敗しました。"
  );

  normalizedError.type =
    error?.type ??
    error?.error?.type ??
    "unknown";

  normalizedError.code =
    error?.code ??
    error?.error?.code ??
    null;

  normalizedError.status =
    error?.status ??
    error?.error?.status ??
    null;

  normalizedError.timeout_ms =
    error?.timeout_ms ??
    error?.error?.timeout_ms ??
    null;

  return normalizedError;
}

// ==========================================
// Laravel API送信
// ==========================================

export async function sendPromptToLaravelApi({
  textValue,
  prompt,
  message,
  childId,
  promptKey = "personal",
}) {
  // ------------------------------------------
  // Laravelの保存済み計画を使用するAI校正
  // ------------------------------------------

  if (promptKey === "personal" || promptKey === "professional1") {
    const isProfessional = promptKey === "professional1";

    const api = isProfessional
      ? window.electronAPI
          ?.laravel_aiRecordEditer_correctProfessionalSupportTwoStage
      : window.electronAPI
          ?.laravel_aiRecordEditer_correctPersonalRecordWithPlan;

    if (!api) {
      throw new Error(
        "Laravelの計画を使用したAI機能を読み込むため、アプリを再起動してください。"
      );
    }

    if (!childId || !message?.trim()) {
      throw new Error(
        "対象児童とAIに送信するテキストを指定してください。"
      );
    }

    try {
      // ------------------------------------------
      // Electron IPC経由でLaravel APIを実行
      // ------------------------------------------

      const result = await api({
        child_id: childId,
        message: message.trim(),
      });

      const data = result?.data?.data ?? result?.data;

      // ------------------------------------------
      // API失敗時はエラー情報を保持する
      // ------------------------------------------

      if (!result?.success || data?.success === false) {
        throw createLaravelApiError(result, data);
      }

      // ------------------------------------------
      // レスポンス内容の確認
      // ------------------------------------------

      if (
        typeof data?.message !== "string" ||
        !data.message.trim()
      ) {
        const emptyError = new Error(
          "Laravel APIからの応答が空でした。"
        );

        emptyError.type = "empty_response";
        emptyError.code = "EMPTY_RESPONSE";

        throw emptyError;
      }

      // ------------------------------------------
      // 正常終了
      // ------------------------------------------

      return data.message;
    } catch (error) {
      const normalizedError = normalizeCaughtError(error);

      console.error(
        "[sendPromptToLaravelApi] Laravel AI error:",
        {
          promptKey,
          type: normalizedError.type,
          code: normalizedError.code,
          status: normalizedError.status,
          timeout_ms: normalizedError.timeout_ms,
          message: normalizedError.message,
        }
      );

      throw normalizedError;
    }
  }

  // ------------------------------------------
  // WebAutomation Flow経由のAI送信
  // ------------------------------------------

  const normalizedPrompt =
    typeof prompt === "string" ? prompt.trim() : "";

  const normalizedMessage =
    typeof message === "string" ? message.trim() : "";

  // Laravel側のFlowはprompt / messageを
  // 別フィールドで要求するため維持する。

  if (typeof textValue === "string" && !textValue.trim()) {
    throw new Error(
      "Laravel APIに送信するテキストが空です"
    );
  }

  if (!normalizedPrompt) {
    throw new Error("Prompt is empty");
  }

  if (!normalizedMessage) {
    throw new Error("Message is empty");
  }

  try {
    // ------------------------------------------
    // 既存のFlow処理を実行
    // ------------------------------------------

    return await executeAiAutomationFlow({
      flowKey: "ai_laravel_prompt_send",
      input: {
        prompt: normalizedPrompt,
        message: normalizedMessage,
        promptKey,
      },
    });
  } catch (error) {
    const normalizedError = normalizeCaughtError(error);

    console.error(
      "[sendPromptToLaravelApi] Laravel Flow error:",
      {
        promptKey,
        type: normalizedError.type,
        code: normalizedError.code,
        status: normalizedError.status,
        message: normalizedError.message,
      }
    );

    throw normalizedError;
  }
}
