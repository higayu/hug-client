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

function normalizePayload(payload) {
  if (
    payload === undefined ||
    payload === null
  ) {
    return {};
  }

  if (
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new TypeError(
      "Web自動化実行ログのデータはオブジェクトで指定してください。"
    );
  }

  return payload;
}

function normalizeLogId(id) {
  const normalized = Number(id);

  if (
    !Number.isInteger(normalized) ||
    normalized <= 0
  ) {
    throw new Error(
      "Web自動化実行ログIDが正しくありません。"
    );
  }

  return normalized;
}

function buildSuccessResult(
  result,
  fallbackMessage,
  extraMeta = {}
) {
  const log = unwrapData(result);

  if (
    !log ||
    typeof log !== "object" ||
    Array.isArray(log)
  ) {
    return {
      success: false,
      connected: true,
      message:
        "Web自動化実行ログのレスポンス形式が正しくありません。",
      data: null,
      meta: {
        authenticated: true,
        ...extraMeta,
      },
      error: {
        status: null,
        statusText: null,
        code:
          "INVALID_WEB_AUTOMATION_EXECUTION_LOG_RESPONSE",
        validationErrors: null,
        details: result ?? null,
      },
    };
  }

  return {
    success: true,
    connected: true,
    message:
      result?.message ?? fallbackMessage,
    data: log,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      ...extraMeta,
      reauthenticated:
        result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

/**
 * Web自動化実行ログを新規作成する。
 *
 * POST /api/web-automation-execution-logs
 */
async function createWebAutomationExecutionLog(
  payload = {}
) {
  const normalizedPayload =
    normalizePayload(payload);

  console.log(
    "📝 [Laravel WebAutomationExecutionLogs] create request:",
    {
      path:
        "/web-automation-execution-logs",
      flowKey:
        normalizedPayload.flow_key ?? null,
      ruleKey:
        normalizedPayload.rule_key ?? null,
      status:
        normalizedPayload.status ?? "running",
    }
  );

  const result =
    await executeAuthenticatedOperation(
      () =>
        laravelApiClient.post(
          "/web-automation-execution-logs",
          normalizedPayload
        ),
      "Web自動化実行ログの保存に失敗しました。"
    );

  if (result?.success === false) {
    return result;
  }

  return buildSuccessResult(
    result,
    "Web自動化実行ログを保存しました。"
  );
}

/**
 * Web自動化実行ログを更新する。
 *
 * PATCH /api/web-automation-execution-logs/{id}
 */
async function updateWebAutomationExecutionLog(
  id,
  payload = {}
) {
  const normalizedId =
    normalizeLogId(id);

  const normalizedPayload =
    normalizePayload(payload);

  const path =
    `/web-automation-execution-logs/${normalizedId}`;

  console.log(
    "📝 [Laravel WebAutomationExecutionLogs] update request:",
    {
      path,
      id: normalizedId,
      status:
        normalizedPayload.status ?? null,
    }
  );

  const result =
    await executeAuthenticatedOperation(
      () =>
        laravelApiClient.patch(
          path,
          normalizedPayload
        ),
      "Web自動化実行ログの更新に失敗しました。"
    );

  if (result?.success === false) {
    return result;
  }

  return buildSuccessResult(
    result,
    "Web自動化実行ログを更新しました。",
    {
      executionLogId:
        normalizedId,
    }
  );
}

async function createHandler(
  _event,
  payload = {}
) {
  try {
    return await createWebAutomationExecutionLog(
      payload
    );
  } catch (error) {
    console.error(
      "❌ [Laravel WebAutomationExecutionLogs] create error:",
      error
    );

    return formatError(
      error,
      "Web自動化実行ログの保存に失敗しました。"
    );
  }
}

async function updateHandler(
  _event,
  id,
  payload = {}
) {
  try {
    return await updateWebAutomationExecutionLog(
      id,
      payload
    );
  } catch (error) {
    console.error(
      "❌ [Laravel WebAutomationExecutionLogs] update error:",
      error
    );

    return formatError(
      error,
      "Web自動化実行ログの更新に失敗しました。"
    );
  }
}

module.exports = {
  normalizePayload,
  normalizeLogId,
  createWebAutomationExecutionLog,
  updateWebAutomationExecutionLog,
  createHandler,
  updateHandler,
};
