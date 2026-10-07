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

function normalizeAppKey(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error("app_keyが指定されていません。");
  }

  if (normalized.length > 100) {
    throw new Error("app_keyは100文字以内で指定してください。");
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

function normalizeEngineVersion(value) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const normalized = Number(value);

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error("engine_versionは1以上の整数で指定してください。");
  }

  return normalized;
}

function buildFlowParams(payload = {}) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new TypeError("V2 Flow取得パラメータはオブジェクトで指定してください。");
  }

  const params = {
    app_key: normalizeAppKey(payload.app_key),
  };

  const engineVersion = normalizeEngineVersion(
    payload.engine_version
  );

  if (engineVersion !== null) {
    params.engine_version = engineVersion;
  }

  return params;
}

async function fetchWebAutomationV2Flows(payload = {}) {
  const params = buildFlowParams(payload);

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.get(
        "/web-automation-v2/flows",
        { params }
      ),
    "Web自動化V2フロー一覧の取得に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const flows = unwrapData(result);

  if (!Array.isArray(flows)) {
    return {
      success: false,
      connected: true,
      message: "Web自動化V2フロー一覧の形式が正しくありません。",
      data: null,
      meta: {
        authenticated: true,
        app_key: params.app_key,
        engine_version: params.engine_version ?? null,
      },
      error: {
        status: null,
        statusText: null,
        code: "INVALID_WEB_AUTOMATION_V2_FLOWS_RESPONSE",
        validationErrors: null,
        details: result ?? null,
      },
    };
  }

  return {
    success: true,
    connected: true,
    message: "Web自動化V2フローを取得しました。",
    data: flows,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      app_key: params.app_key,
      engine_version: params.engine_version ?? null,
      count: flows.length,
      reauthenticated:
        result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function fetchWebAutomationV2Flow(
  flowKey,
  payload = {}
) {
  const normalizedFlowKey = normalizeFlowKey(flowKey);
  const params = buildFlowParams(payload);
  const path =
    `/web-automation-v2/flows/${encodeURIComponent(normalizedFlowKey)}`;

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.get(path, { params }),
    "Web自動化V2フローの取得に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  const flow = unwrapData(result);

  if (
    !flow ||
    typeof flow !== "object" ||
    Array.isArray(flow)
  ) {
    return {
      success: false,
      connected: true,
      message: "Web自動化V2フローの形式が正しくありません。",
      data: null,
      meta: {
        authenticated: true,
        flow_key: normalizedFlowKey,
        app_key: params.app_key,
        engine_version: params.engine_version ?? null,
      },
      error: {
        status: null,
        statusText: null,
        code: "INVALID_WEB_AUTOMATION_V2_FLOW_RESPONSE",
        validationErrors: null,
        details: result ?? null,
      },
    };
  }

  return {
    success: true,
    connected: true,
    message: "Web自動化V2フローを取得しました。",
    data: flow,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      flow_key: normalizedFlowKey,
      app_key: params.app_key,
      engine_version: params.engine_version ?? null,
      reauthenticated:
        result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function listHandler(_event, payload = {}) {
  try {
    return await fetchWebAutomationV2Flows(payload);
  } catch (error) {
    console.error(
      "❌ [Laravel WebAutomationV2Flows] list error:",
      error
    );

    return formatError(
      error,
      "Web自動化V2フロー一覧の取得に失敗しました。"
    );
  }
}

async function getHandler(
  _event,
  flowKey,
  payload = {}
) {
  try {
    return await fetchWebAutomationV2Flow(
      flowKey,
      payload
    );
  } catch (error) {
    console.error(
      "❌ [Laravel WebAutomationV2Flows] get error:",
      error
    );

    return formatError(
      error,
      "Web自動化V2フローの取得に失敗しました。"
    );
  }
}

module.exports = {
  normalizeAppKey,
  normalizeFlowKey,
  normalizeEngineVersion,
  buildFlowParams,
  fetchWebAutomationV2Flows,
  fetchWebAutomationV2Flow,
  listHandler,
  getHandler,
};
