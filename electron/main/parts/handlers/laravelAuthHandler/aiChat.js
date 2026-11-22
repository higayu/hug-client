const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("./auth/authenticated");
const { formatError, unwrapData } = require("./auth/utils");

async function sendMessage(payload = {}) {
  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.post("/ai-chat/messages", payload),
    "AIチャットへの送信に失敗しました。",
  );

  if (result?.success === false) return result;

  return {
    success: true,
    connected: true,
    message: "AIチャットの応答を取得しました。",
    data: unwrapData(result),
    meta: {
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function checkConnection(payload = {}) {
  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.post("/ai-chat/check-connection", payload),
    "AIチャットサーバーへの接続確認に失敗しました。",
  );

  if (result?.success === false) return result;

  return {
    success: true,
    connected: true,
    message: "AIチャットサーバーへ接続しました。",
    data: unwrapData(result),
    meta: {
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

const messageHandler = async (_event, payload = {}) => {
  try {
    return await sendMessage(payload);
  } catch (error) {
    console.error("[Laravel AI Chat] message error:", error);
    return formatError(error, "AIチャットへの送信に失敗しました。");
  }
};

const checkConnectionHandler = async (_event, payload = {}) => {
  try {
    return await checkConnection(payload);
  } catch (error) {
    console.error("[Laravel AI Chat] check connection error:", error);
    return formatError(error, "AIチャットサーバーへの接続確認に失敗しました。");
  }
};

module.exports = {
  chartsHandler: async (_event, params = {}) => {
    try {
      const days = Number(params?.days ?? 30);
      const scope = params?.scope ?? "company";
      if (![7, 30, 90].includes(days) || !["personal", "company", "all"].includes(scope)) {
        throw new Error("グラフの期間・集計範囲が不正です。");
      }
      const result = await executeAuthenticatedOperation(
        () => laravelApiClient.get("/ai/usage-charts", { params: { days, scope, ...(params?.company_id ? { company_id: params.company_id } : {}) } }),
        "AI使用量グラフの取得に失敗しました。",
      );
      if (result?.success === false) return result;
      return { success: true, data: unwrapData(result) };
    } catch (error) {
      return formatError(error, "AI使用量グラフの取得に失敗しました。");
    }
  },
  settingsHandler: async () => {
    try {
      const result = await executeAuthenticatedOperation(
        () => laravelApiClient.get("/ai/settings"),
        "AI設定・使用量の取得に失敗しました。",
      );
      if (result?.success === false) return result;
      return { success: true, data: unwrapData(result) };
    } catch (error) {
      return formatError(error, "AI設定・使用量の取得に失敗しました。");
    }
  },
  sendMessage,
  checkConnection,
  messageHandler,
  checkConnectionHandler,
};
