const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("./auth/authenticated");
const { formatError, unwrapData } = require("./auth/utils");

async function execute(operation, successMessage, errorMessage) {
  const result = await executeAuthenticatedOperation(operation, errorMessage);

  if (result?.success === false) return result;

  return {
    success: true,
    connected: true,
    message: successMessage,
    data: unwrapData(result),
    meta: {
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

const createHandler = (operation, successMessage, errorMessage) =>
  async (_event, payload = {}) => {
    try {
      return await execute(
        () => operation(payload),
        successMessage,
        errorMessage,
      );
    } catch (error) {
      console.error(`[Laravel Health Analysis] ${errorMessage}`, error);
      return formatError(error, errorMessage);
    }
  };

module.exports = {
  analyzeHandler: createHandler(
    (payload) => laravelApiClient.analyzeHealth(payload),
    "健康分析が完了しました。",
    "健康分析に失敗しました。",
  ),
  statisticsHandler: createHandler(
    ({ year, month }) => laravelApiClient.getHealthStatistics(year, month),
    "健康分析統計を取得しました。",
    "健康分析統計の取得に失敗しました。",
  ),
  abnormalChildrenHandler: createHandler(
    ({ year, month, limit }) =>
      laravelApiClient.getAbnormalChildren(year, month, limit),
    "異常児童一覧を取得しました。",
    "異常児童一覧の取得に失敗しました。",
  ),
  logsHandler: createHandler(
    (payload) => laravelApiClient.getHealthAnalysisLogs(payload),
    "健康分析ログを取得しました。",
    "健康分析ログの取得に失敗しました。",
  ),
  showLogHandler: createHandler(
    ({ logId }) => laravelApiClient.getHealthAnalysisLog(logId),
    "健康分析ログ詳細を取得しました。",
    "健康分析ログ詳細の取得に失敗しました。",
  ),
};
