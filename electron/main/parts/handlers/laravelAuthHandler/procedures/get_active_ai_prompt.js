const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

async function getActiveAiPrompt(payload = {}) {
  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.getActiveAiPrompt(payload),
    "有効なAIプロンプトの取得に失敗しました。",
  );

  if (result?.success === false) return result;

  return {
    success: true,
    connected: true,
    message: "有効なAIプロンプトを取得しました。",
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
    return await getActiveAiPrompt(payload);
  } catch (error) {
    console.error("❌ [Laravel Procedure] getActiveAiPrompt error:", error);
    return formatError(error, "有効なAIプロンプトの取得に失敗しました。");
  }
};

module.exports = { getActiveAiPrompt, handler };
