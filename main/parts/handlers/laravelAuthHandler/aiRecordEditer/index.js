const laravelApiClient = require(
  "../../../../../src/laravelApiClient"
);

const {
  executeAuthenticatedOperation,
} = require("../auth/authenticated");

const {
  formatError,
  unwrapData,
} = require("../auth/utils");

const ENDPOINTS = {
  personal: "/ai-record-editer/personal-record/correct",
  professional: "/ai-record-editer/professional-support/correct",
};

function normalizePayload(payload = {}) {
  const prompt = typeof payload.prompt === "string"
    ? payload.prompt.trim()
    : "";

  const message = typeof payload.message === "string"
    ? payload.message.trim()
    : "";

  if (!prompt) {
    throw new Error("AI校正用のpromptが空です。");
  }

  if (!message) {
    throw new Error("AI校正対象のmessageが空です。");
  }

  return { prompt, message };
}

async function correct(type, payload = {}) {
  const path = ENDPOINTS[type];

  if (!path) {
    throw new Error(`未対応のAI校正種別です: ${type}`);
  }

  const normalizedPayload = normalizePayload(payload);

  console.log("📤 [Laravel AiRecordEditer] correct request:", {
    type,
    path,
    promptLength: normalizedPayload.prompt.length,
    messageLength: normalizedPayload.message.length,
  });

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.post(path, normalizedPayload),
    "AI文章校正に失敗しました。"
  );

  console.log("📥 [Laravel AiRecordEditer] correct response:", {
    type,
    success: result?.success,
  });

  if (result?.success === false) {
    return result;
  }

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
      return await correct(type, payload);
    } catch (error) {
      console.error(`❌ [Laravel AiRecordEditer] ${type} error:`, error);
      return formatError(error, "AI文章校正に失敗しました。");
    }
  };
}

module.exports = {
  correct,
  personalHandler: createHandler("personal"),
  professionalHandler: createHandler("professional"),
};
