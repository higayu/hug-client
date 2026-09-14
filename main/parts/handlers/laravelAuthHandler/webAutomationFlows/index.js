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

function normalizeScopeValue(value, fieldName) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error(`${fieldName}が指定されていません。`);
  }

  if (normalized.length > 100) {
    throw new Error(`${fieldName}は100文字以内で指定してください。`);
  }

  return normalized;
}

function normalizeFlowKey(flowKey) {
  const normalized = String(flowKey ?? "").trim();

  if (!normalized) {
    throw new Error("flow_keyが指定されていません。");
  }

  if (!/^[A-Za-z0-9._-]+$/.test(normalized)) {
    throw new Error("flow_keyの形式が正しくありません。");
  }

  return normalized;
}

function normalizeTriggerType(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const normalized = String(value).trim();

  if (normalized.length > 100) {
    throw new Error("trigger_typeは100文字以内で指定してください。");
  }

  return normalized;
}

function buildFlowParams(payload = {}) {
  const params = {
    app_key: normalizeScopeValue(payload?.app_key, "app_key"),
    webview_key: normalizeScopeValue(payload?.webview_key, "webview_key"),
  };

  const triggerType = normalizeTriggerType(payload?.trigger_type);

  if (triggerType) {
    params.trigger_type = triggerType;
  }

  return params;
}

async function fetchWebAutomationFlows(payload = {}) {
  const params = buildFlowParams(payload);

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.get("/web-automation-flows", { params }),
    "Web自動化フロー一覧の取得に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const flows = unwrapData(result);

  if (!Array.isArray(flows)) {
    return {
      success: false,
      connected: true,
      message: "Web自動化フロー一覧の形式が正しくありません。",
      data: null,
      meta: { authenticated: true },
      error: {
        status: null,
        statusText: null,
        code: "INVALID_WEB_AUTOMATION_FLOWS_RESPONSE",
        validationErrors: null,
        details: result ?? null,
      },
    };
  }

  return {
    success: true,
    connected: true,
    message: "Web自動化フローを取得しました。",
    data: flows,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      app_key: params.app_key,
      webview_key: params.webview_key,
      trigger_type: params.trigger_type ?? null,
      count: result?.meta?.count ?? flows.length,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function fetchWebAutomationFlow(flowKey, payload = {}) {
  const normalizedFlowKey = normalizeFlowKey(flowKey);
  const params = buildFlowParams(payload);
  delete params.trigger_type;

  const path = `/web-automation-flows/${encodeURIComponent(normalizedFlowKey)}`;

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.get(path, { params }),
    "Web自動化フローの取得に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const flow = unwrapData(result);

  if (!flow || typeof flow !== "object" || Array.isArray(flow)) {
    return {
      success: false,
      connected: true,
      message: "Web自動化フローの形式が正しくありません。",
      data: null,
      meta: {
        authenticated: true,
        flowKey: normalizedFlowKey,
      },
      error: {
        status: null,
        statusText: null,
        code: "INVALID_WEB_AUTOMATION_FLOW_RESPONSE",
        validationErrors: null,
        details: result ?? null,
      },
    };
  }

  return {
    success: true,
    connected: true,
    message: "Web自動化フローを取得しました。",
    data: flow,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      flowKey: normalizedFlowKey,
      app_key: params.app_key,
      webview_key: params.webview_key,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function listHandler(_event, payload = {}) {
  try {
    return await fetchWebAutomationFlows(payload);
  } catch (error) {
    console.error("❌ [Laravel WebAutomationFlows] list error:", error);
    return formatError(error, "Web自動化フロー一覧の取得に失敗しました。");
  }
}

async function getHandler(_event, flowKey, payload = {}) {
  try {
    return await fetchWebAutomationFlow(flowKey, payload);
  } catch (error) {
    console.error("❌ [Laravel WebAutomationFlows] get error:", error);
    return formatError(error, "Web自動化フローの取得に失敗しました。");
  }
}

module.exports = {
  normalizeScopeValue,
  normalizeFlowKey,
  normalizeTriggerType,
  buildFlowParams,
  fetchWebAutomationFlows,
  fetchWebAutomationFlow,
  listHandler,
  getHandler,
};
