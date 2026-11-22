const client = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("./auth/authenticated");
const { formatError, unwrapData } = require("./auth/utils");

function id(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error("プロンプト・履歴IDが不正です。");
  return number;
}

function handler(action) {
  return async (_event, payload = {}) => {
    try {
      const base = `/ai-prompts/${id(payload.promptId)}/histories`;
      const result = await executeAuthenticatedOperation(() => {
        if (action === "list") return client.get(base, { params: { page: id(payload.page ?? 1) } });
        const historyId = id(payload.historyId);
        if (action === "show") return client.get(`${base}/${historyId}`);
        return client.post(`${base}/${historyId}/restore`, { expected_history_id: id(payload.expectedHistoryId) });
      }, "プロンプト履歴の操作に失敗しました。");
      if (result?.success === false) return result;
      return { success: true, data: unwrapData(result), message: result?.message };
    } catch (error) {
      return formatError(error, "プロンプト履歴の操作に失敗しました。");
    }
  };
}

module.exports = { listHandler: handler("list"), showHandler: handler("show"), restoreHandler: handler("restore") };
