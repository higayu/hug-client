// main/parts/handlers/laravelAuthHandler/procedures/call.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");  // 修正
const { formatError, unwrapData } = require("../auth/utils");

async function callProcedure(procedureName, params = []) {
  console.log("📤 [Laravel Procedure] call:", { procedure: procedureName, params });

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.callProcedure(procedureName, params),
    `プロシージャ ${procedureName} の実行に失敗しました。`
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: `プロシージャ ${procedureName} を実行しました。`,
    data: unwrapData(result),
    meta: {
      authenticated: true,
      procedure: procedureName,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

const handler = async (_event, procedureName, params = []) => {
  try {
    console.log("📤 [Laravel Procedure] IPC call:", { procedure: procedureName, params });

    const result = await callProcedure(procedureName, params);

    if (result.success) {
      console.log("✅ [Laravel Procedure] call DONE:", {
        procedure: procedureName,
        data: result.data,
      });
    } else {
      console.error("❌ [Laravel Procedure] call failed:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ [Laravel Procedure] call error:", error);
    return formatError(error, `プロシージャ ${procedureName} の実行に失敗しました。`);
  }
};

module.exports = {
  callProcedure,
  handler,
};