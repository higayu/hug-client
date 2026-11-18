const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("./auth/authenticated");
const { formatError, unwrapData } = require("./auth/utils");

/**
 * AiRecordEditer 専用AI校正。
 *
 * payload:
 * {
 *   prompt: string,
 *   message: string,
 * }
 */
const ENDPOINTS = {
  personal: "/ai-record-editer/personal-record/correct",
  personalWithPlan: "/ai-record-editer/personal-record/with-plan/correct",
  professional: "/ai-record-editer/professional-support/correct",
  professionalTwoStage: "/ai-record-editer/professional-support/two-stage/correct",
};

function normalizePayload(payload = {}) {
  const prompt = typeof payload.prompt === "string"
    ? payload.prompt.trim()
    : "";
  const message = typeof payload.message === "string"
    ? payload.message.trim()
    : "";

  if (!prompt) throw new Error("AI校正用のpromptが空です。");
  if (!message) throw new Error("AI校正対象のmessageが空です。");

  return { prompt, message };
}

async function correctByType(type, payload = {}) {
  const endpoint = ENDPOINTS[type];
  if (!endpoint) throw new Error(`未対応のAI校正種別です: ${type}`);

  const usesStoredPlan = type === "personalWithPlan" || type === "professionalTwoStage";
  const normalizedPayload = usesStoredPlan
    ? { child_id: Number(payload.child_id), message: typeof payload.message === "string" ? payload.message.trim() : "" }
    : normalizePayload(payload);
  if (usesStoredPlan && (!Number.isSafeInteger(normalizedPayload.child_id) || normalizedPayload.child_id < 1 || !normalizedPayload.message)) {
    throw new Error("対象児童とAIに送信するテキストを指定してください。");
  }
  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.post(endpoint, normalizedPayload, { timeout: type === "professionalTwoStage" ? 600000 : 120000 }),
    "AI文章校正に失敗しました。",
  );

  if (result?.success === false) return result;

  return {
    success: true,
    connected: true,
    message: "AI文章校正が完了しました。",
    data: unwrapData(result),
    meta: {
      authenticated: true,
      type,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

function createHandler(type) {
  return async (_event, payload = {}) => {
    try {
      return await correctByType(type, payload);
    } catch (error) {
      console.error(`[Laravel AiRecordEditer] ${type} correct error:`, error);
      return formatError(error, "AI文章校正に失敗しました。");
    }
  };
}

module.exports = {
  personalHandler: createHandler("personal"),
  personalWithPlanHandler: createHandler("personalWithPlan"),
  professionalHandler: createHandler("professional"),
  professionalTwoStageHandler: createHandler("professionalTwoStage"),
};
