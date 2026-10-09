const laravelApiClient = require(
  "../../../../src/laravelApiClient"
);

const {
  executeAuthenticatedOperation,
} = require("./auth/authenticated");

const {
  formatError,
  unwrapData,
} = require("./auth/utils");

const DEFAULT_APP_KEY = "hug-banso-navi";
const EXECUTOR_ENGINE_VERSION = 1;

// Renderer側はexecutionUuidだけを保持すればよいように、
// Laravelが採番した実行ログIDをMainプロセス内で対応付ける。
const executionLogIdByUuid = new Map();

function normalizeObject(value, fieldName = "payload") {
  if (value == null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${fieldName}はオブジェクトで指定してください。`);
  }

  return value;
}

function normalizeFlowKey(value) {
  const flowKey = String(value ?? "").trim();

  if (!flowKey) {
    throw new Error("flowKeyが指定されていません。");
  }

  if (!/^[A-Za-z0-9._-]+$/.test(flowKey)) {
    throw new Error("flowKeyの形式が正しくありません。");
  }

  if (flowKey.length > 150) {
    throw new Error("flowKeyは150文字以内で指定してください。");
  }

  return flowKey;
}

function normalizeAppKey(value) {
  const appKey = String(value ?? DEFAULT_APP_KEY).trim();

  if (!appKey) {
    return DEFAULT_APP_KEY;
  }

  if (appKey.length > 100) {
    throw new Error("appKeyは100文字以内で指定してください。");
  }

  return appKey;
}

function normalizeExecutionUuid(value) {
  const uuid = String(value ?? "").trim();

  if (!uuid) {
    throw new Error("executionUuidが指定されていません。");
  }

  return uuid;
}

function normalizeJsonValue(value) {
  if (value === undefined) {
    return null;
  }

  return value;
}

/**
 * V2 published Flow + 仮想JSファイル群を一括取得する。
 *
 * GET /api/web-automation-v2/flows/{flowKey}
 */
async function getFlowBundle(payload = {}) {
  const normalized = normalizeObject(payload);
  const flowKey = normalizeFlowKey(normalized.flowKey ?? normalized.flow_key);
  const appKey = normalizeAppKey(normalized.appKey ?? normalized.app_key);
  const engineVersion = Number(
    normalized.engineVersion ??
      normalized.engine_version ??
      EXECUTOR_ENGINE_VERSION
  );

  const path = `/web-automation-v2/flows/${encodeURIComponent(flowKey)}`;

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.get(path, {
        params: {
          app_key: appKey,
          engine_version:
            Number.isInteger(engineVersion) && engineVersion > 0
              ? engineVersion
              : EXECUTOR_ENGINE_VERSION,
        },
      }),
    "WebAutomation V2 Flowの取得に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const data = unwrapData(result);
  const flow = data?.flow;
  const files = data?.files;

  if (!flow || typeof flow !== "object" || Array.isArray(flow)) {
    throw new Error("WebAutomation V2 Flowのレスポンス形式が正しくありません。");
  }

  if (!Array.isArray(files)) {
    throw new Error("WebAutomation V2 Filesのレスポンス形式が正しくありません。");
  }

  return {
    success: true,
    ok: true,
    connected: true,
    message: result?.message ?? "WebAutomation V2 Flowを取得しました。",
    flow,
    files,
    data: {
      flow,
      files,
    },
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      appKey,
      flowKey,
      engineVersion,
      fileCount: files.length,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function startExecutionLog(payload = {}) {
  const normalized = normalizeObject(payload);
  const executionUuid = normalizeExecutionUuid(
    normalized.executionUuid ?? normalized.execution_uuid
  );

  const requestBody = {
    execution_uuid: executionUuid,
    app_key: normalizeAppKey(normalized.appKey ?? normalized.app_key),
    flow_id: normalized.flowId ?? normalized.flow_id ?? null,
    flow_key: normalizeFlowKey(normalized.flowKey ?? normalized.flow_key),
    flow_version: normalized.flowVersion ?? normalized.flow_version ?? null,
    entry_file: normalized.entryFile ?? normalized.entry_file ?? null,
    entry_export: normalized.entryExport ?? normalized.entry_export ?? null,
    input_json: normalizeJsonValue(normalized.input ?? normalized.input_json),
    status: "running",
  };

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.post("/web-automation-v2/execution-logs", requestBody),
    "WebAutomation V2実行開始ログの保存に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const log = unwrapData(result);
  const logId = Number(log?.id);

  if (Number.isInteger(logId) && logId > 0) {
    executionLogIdByUuid.set(executionUuid, logId);
  }

  return {
    success: true,
    ok: true,
    data: log,
    executionUuid,
    executionLogId:
      Number.isInteger(logId) && logId > 0 ? logId : null,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
    },
    error: null,
  };
}

async function finishExecutionLog(payload = {}) {
  const normalized = normalizeObject(payload);
  const executionUuid = normalizeExecutionUuid(
    normalized.executionUuid ?? normalized.execution_uuid
  );

  const explicitLogId = Number(
    normalized.executionLogId ?? normalized.execution_log_id
  );

  const logId =
    Number.isInteger(explicitLogId) && explicitLogId > 0
      ? explicitLogId
      : executionLogIdByUuid.get(executionUuid);

  if (!Number.isInteger(logId) || logId <= 0) {
    throw new Error(
      `WebAutomation V2実行ログIDが見つかりません。 executionUuid=${executionUuid}`
    );
  }

  const status = String(normalized.status ?? "success").trim();

  const requestBody = {
    status,
    result_json:
      normalized.result !== undefined
        ? normalized.result
        : normalized.result_json ?? null,
    error_message:
      normalized.errorMessage ?? normalized.error_message ?? null,
    duration_ms:
      normalized.durationMs ?? normalized.duration_ms ?? null,
  };

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.patch(
        `/web-automation-v2/execution-logs/${logId}`,
        requestBody
      ),
    "WebAutomation V2実行ログの更新に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  executionLogIdByUuid.delete(executionUuid);

  return {
    success: true,
    ok: true,
    data: unwrapData(result),
    executionUuid,
    executionLogId: logId,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
    },
    error: null,
  };
}


// ============================================================
// 管理者向け V2 API
// ============================================================

function normalizePositiveInt(value, fallback = null) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function normalizeAdminFlowId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("flowIdが正しくありません。");
  }

  return id;
}

/**
 * 管理者向け Flow一覧。draft / published / disabled を含めて取得する。
 *
 * GET /api/web-automation-v2/admin/flows
 */
async function adminGetFlows(payload = {}) {
  const normalized = normalizeObject(payload);
  const appKey = normalizeAppKey(normalized.appKey ?? normalized.app_key);

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.get("/web-automation-v2/admin/flows", {
        params: {
          app_key: appKey,
        },
      }),
    "WebAutomation V2管理用Flow一覧の取得に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const data = unwrapData(result);
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(result?.data)
        ? result.data
        : [];

  return {
    success: true,
    ok: true,
    data: items,
    items,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      appKey,
    },
    error: null,
  };
}

/**
 * 管理者向け Flow詳細。files / memos を含めて取得する。
 *
 * GET /api/web-automation-v2/admin/flows/{id}
 */
async function adminGetFlow(flowIdOrKey, payload = {}) {
  const normalized = normalizeObject(payload);
  const appKey = normalizeAppKey(normalized.appKey ?? normalized.app_key);
  const raw = String(flowIdOrKey ?? "").trim();

  if (!raw) {
    throw new Error("flowIdまたはflowKeyが指定されていません。");
  }

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.get(
        `/web-automation-v2/admin/flows/${encodeURIComponent(raw)}`,
        {
          params: {
            app_key: appKey,
            version:
              normalizePositiveInt(normalized.version, null),
            include_files:
              normalized.include_files === false ? 0 : 1,
            include_memos:
              normalized.include_memos === false ? 0 : 1,
          },
        }
      ),
    "WebAutomation V2管理用Flow詳細の取得に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const data = unwrapData(result);

  return {
    success: true,
    ok: true,
    data,
    flow: data,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      appKey,
    },
    error: null,
  };
}

/**
 * 管理者向け Flow更新。Flow本体・files・memosを一括保存する。
 *
 * PATCH /api/web-automation-v2/admin/flows/{id}
 */
async function adminUpdateFlow(flowId, payload = {}) {
  const id = normalizeAdminFlowId(flowId);
  const normalized = normalizeObject(payload);

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.patch(
        `/web-automation-v2/admin/flows/${id}`,
        normalized
      ),
    "WebAutomation V2管理用Flowの保存に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const data = unwrapData(result);

  return {
    success: true,
    ok: true,
    data,
    flow: data,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
    },
    error: null,
  };
}

/**
 * 管理者向け V2 ExecutionLog一覧。
 *
 * GET /api/web-automation-v2/admin/execution-logs
 */
async function adminGetExecutionLogs(payload = {}) {
  const normalized = normalizeObject(payload);
  const appKey = normalizeAppKey(normalized.appKey ?? normalized.app_key);
  const limit = Math.min(
    500,
    Math.max(1, normalizePositiveInt(normalized.limit, 100))
  );

  const params = {
    app_key: appKey,
    limit,
  };

  if (normalized.flowKey ?? normalized.flow_key) {
    params.flow_key = normalizeFlowKey(
      normalized.flowKey ?? normalized.flow_key
    );
  }

  if (normalized.status) {
    params.status = String(normalized.status).trim();
  }

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.get(
        "/web-automation-v2/admin/execution-logs",
        { params }
      ),
    "WebAutomation V2管理用実行ログ一覧の取得に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const data = unwrapData(result);
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(result?.data)
        ? result.data
        : [];

  return {
    success: true,
    ok: true,
    data: items,
    items,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      appKey,
      limit,
    },
    error: null,
  };
}

async function adminFlowsGetAllHandler(_event, payload = {}) {
  try {
    return await adminGetFlows(payload);
  } catch (error) {
    console.error("❌ [WebAutomationV2] adminGetFlows error:", error);
    return formatError(
      error,
      "WebAutomation V2管理用Flow一覧の取得に失敗しました。"
    );
  }
}

async function adminFlowGetHandler(_event, flowIdOrKey, payload = {}) {
  try {
    return await adminGetFlow(flowIdOrKey, payload);
  } catch (error) {
    console.error("❌ [WebAutomationV2] adminGetFlow error:", error);
    return formatError(
      error,
      "WebAutomation V2管理用Flow詳細の取得に失敗しました。"
    );
  }
}

async function adminFlowUpdateHandler(_event, flowId, payload = {}) {
  try {
    return await adminUpdateFlow(flowId, payload);
  } catch (error) {
    console.error("❌ [WebAutomationV2] adminUpdateFlow error:", error);
    return formatError(
      error,
      "WebAutomation V2管理用Flowの保存に失敗しました。"
    );
  }
}

async function adminExecutionLogsGetAllHandler(_event, payload = {}) {
  try {
    return await adminGetExecutionLogs(payload);
  } catch (error) {
    console.error("❌ [WebAutomationV2] adminGetExecutionLogs error:", error);
    return formatError(
      error,
      "WebAutomation V2管理用実行ログ一覧の取得に失敗しました。"
    );
  }
}

async function getFlowBundleHandler(_event, payload = {}) {
  try {
    return await getFlowBundle(payload);
  } catch (error) {
    console.error("❌ [WebAutomationV2] getFlowBundle error:", error);
    return formatError(
      error,
      "WebAutomation V2 Flowの取得に失敗しました。"
    );
  }
}

async function executionLogStartHandler(_event, payload = {}) {
  try {
    return await startExecutionLog(payload);
  } catch (error) {
    console.error("❌ [WebAutomationV2] executionLogStart error:", error);
    return formatError(
      error,
      "WebAutomation V2実行開始ログの保存に失敗しました。"
    );
  }
}

async function executionLogFinishHandler(_event, payload = {}) {
  try {
    return await finishExecutionLog(payload);
  } catch (error) {
    console.error("❌ [WebAutomationV2] executionLogFinish error:", error);
    return formatError(
      error,
      "WebAutomation V2実行ログの更新に失敗しました。"
    );
  }
}

module.exports = {
  getFlowBundle,
  startExecutionLog,
  finishExecutionLog,

  adminGetFlows,
  adminGetFlow,
  adminUpdateFlow,
  adminGetExecutionLogs,

  getFlowBundleHandler,
  executionLogStartHandler,
  executionLogFinishHandler,

  adminFlowsGetAllHandler,
  adminFlowGetHandler,
  adminFlowUpdateHandler,
  adminExecutionLogsGetAllHandler,
};
