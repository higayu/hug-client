const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

async function upsertAiPrompt(payload = {}) {
  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.upsertAiPrompt(payload),
    "AIプロンプトの保存に失敗しました。",
  );

  if (result?.success === false) return result;

  return {
    success: true,
    connected: true,
    message: "AIプロンプトを保存しました。",
    data: unwrapData(result),
    meta: {
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

const handler = async (_event, payload = {}) => {
  try {
    return await upsertAiPrompt(payload);
  } catch (error) {
    console.error("❌ [Laravel Procedure] upsertAiPrompt error:", error);
    return formatError(error, "AIプロンプトの保存に失敗しました。");
  }
};

module.exports = { upsertAiPrompt, handler };
