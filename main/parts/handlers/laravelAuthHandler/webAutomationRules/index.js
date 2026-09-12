// main/parts/handlers/laravelAuthHandler/webAutomationRules/index.js

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

/**
 * category をAPIへ渡せる形式に正規化する。
 */
function normalizeCategory(category) {
  if (
    category === undefined ||
    category === null ||
    String(category).trim() === ""
  ) {
    return null;
  }

  const normalized =
    String(category).trim();

  if (normalized.length > 100) {
    throw new Error(
      "categoryは100文字以内で指定してください。"
    );
  }

  return normalized;
}

/**
 * rule_key を正規化する。
 *
 * Laravel側の route 制約:
 * [A-Za-z0-9._-]+
 */
function normalizeRuleKey(ruleKey) {
  const normalized =
    String(ruleKey ?? "").trim();

  if (!normalized) {
    throw new Error(
      "rule_keyが指定されていません。"
    );
  }

  if (
    !/^[A-Za-z0-9._-]+$/.test(
      normalized
    )
  ) {
    throw new Error(
      "rule_keyの形式が正しくありません。"
    );
  }

  return normalized;
}

/**
 * 有効なWeb自動化ルール一覧を取得する。
 *
 * GET /api/web-automation-rules
 * GET /api/web-automation-rules?category=attendance
 */
async function fetchWebAutomationRules(
  payload = {}
) {
  const category =
    normalizeCategory(
      payload?.category
    );

  const params = {};

  if (category) {
    params.category = category;
  }

  console.log(
    "📥 [Laravel WebAutomationRules] list request:",
    {
      path:
        "/web-automation-rules",
      params,
    }
  );

  const result =
    await executeAuthenticatedOperation(
      () =>
        laravelApiClient.get(
          "/web-automation-rules",
          {
            params,
          }
        ),
      "Web自動化ルールの取得に失敗しました。"
    );

  if (result?.success === false) {
    return result;
  }

  const rules =
    unwrapData(result);

  if (!Array.isArray(rules)) {
    return {
      success: false,
      connected: true,
      message:
        "Web自動化ルール一覧の形式が正しくありません。",
      data: null,
      meta: {
        authenticated: true,
      },
      error: {
        status: null,
        statusText: null,
        code:
          "INVALID_WEB_AUTOMATION_RULES_RESPONSE",
        validationErrors: null,
        details: result ?? null,
      },
    };
  }

  return {
    success: true,
    connected: true,
    message:
      "Web自動化ルールを取得しました。",
    data: rules,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      category,
      count:
        result?.meta?.count ??
        rules.length,
      reauthenticated:
        result?.meta
          ?.reauthenticated ??
        false,
    },
    error: null,
  };
}

/**
 * rule_key を指定して有効なWeb自動化ルールを取得する。
 *
 * GET /api/web-automation-rules/{ruleKey}
 */
async function fetchWebAutomationRule(
  ruleKey
) {
  const normalizedRuleKey =
    normalizeRuleKey(ruleKey);

  const path =
    `/web-automation-rules/${encodeURIComponent(
      normalizedRuleKey
    )}`;

  console.log(
    "📥 [Laravel WebAutomationRules] show request:",
    {
      path,
      ruleKey:
        normalizedRuleKey,
    }
  );

  const result =
    await executeAuthenticatedOperation(
      () =>
        laravelApiClient.get(path),
      "Web自動化ルールの取得に失敗しました。"
    );

  if (result?.success === false) {
    return result;
  }

  const rule =
    unwrapData(result);

  if (
    !rule ||
    typeof rule !== "object" ||
    Array.isArray(rule)
  ) {
    return {
      success: false,
      connected: true,
      message:
        "Web自動化ルールの形式が正しくありません。",
      data: null,
      meta: {
        authenticated: true,
        ruleKey:
          normalizedRuleKey,
      },
      error: {
        status: null,
        statusText: null,
        code:
          "INVALID_WEB_AUTOMATION_RULE_RESPONSE",
        validationErrors: null,
        details: result ?? null,
      },
    };
  }

  return {
    success: true,
    connected: true,
    message:
      "Web自動化ルールを取得しました。",
    data: rule,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      ruleKey:
        normalizedRuleKey,
      reauthenticated:
        result?.meta
          ?.reauthenticated ??
        false,
    },
    error: null,
  };
}


/**
 * Web自動化ルールを更新する。
 *
 * PATCH /api/web-automation-rules/{ruleKey}
 *
 * Laravel側で role_id = 1 の管理者だけ更新可能。
 * 権限がない場合はLaravelの403レスポンスをそのまま返す。
 */
async function updateWebAutomationRule(
  ruleKey,
  payload = {}
) {
  const normalizedRuleKey =
    normalizeRuleKey(ruleKey);

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new Error(
      "更新データをオブジェクトで指定してください。"
    );
  }

  const path =
    `/web-automation-rules/${encodeURIComponent(
      normalizedRuleKey
    )}`;

  console.log(
    "📝 [Laravel WebAutomationRules] update request:",
    {
      path,
      ruleKey:
        normalizedRuleKey,
      keys:
        Object.keys(payload),
    }
  );

  const result =
    await executeAuthenticatedOperation(
      () =>
        laravelApiClient.patch(
          path,
          payload
        ),
      "Web自動化ルールの更新に失敗しました。"
    );

  if (result?.success === false) {
    return result;
  }

  const rule =
    unwrapData(result);

  if (
    !rule ||
    typeof rule !== "object" ||
    Array.isArray(rule)
  ) {
    return {
      success: false,
      connected: true,
      message:
        "更新後のWeb自動化ルールの形式が正しくありません。",
      data: null,
      meta: {
        authenticated: true,
        ruleKey:
          normalizedRuleKey,
      },
      error: {
        status: null,
        statusText: null,
        code:
          "INVALID_WEB_AUTOMATION_RULE_UPDATE_RESPONSE",
        validationErrors: null,
        details:
          result ?? null,
      },
    };
  }

  return {
    success: true,
    connected: true,
    message:
      result?.message ??
      "Web自動化ルールを更新しました。",
    data: rule,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      ruleKey:
        normalizedRuleKey,
      reauthenticated:
        result?.meta
          ?.reauthenticated ??
        false,
    },
    error: null,
  };
}

/**
 * IPC:
 * laravel:web-automation-rules:update
 */
async function updateHandler(
  _event,
  ruleKey,
  payload = {}
) {
  try {
    return await updateWebAutomationRule(
      ruleKey,
      payload
    );
  } catch (error) {
    console.error(
      "❌ [Laravel WebAutomationRules] update error:",
      error
    );

    return formatError(
      error,
      "Web自動化ルールの更新に失敗しました。"
    );
  }
}

/**
 * IPC:
 * laravel:web-automation-rules:list
 */
async function listHandler(
  _event,
  payload = {}
) {
  try {
    return await fetchWebAutomationRules(
      payload
    );
  } catch (error) {
    console.error(
      "❌ [Laravel WebAutomationRules] list error:",
      error
    );

    return formatError(
      error,
      "Web自動化ルール一覧の取得に失敗しました。"
    );
  }
}

/**
 * IPC:
 * laravel:web-automation-rules:get
 */
async function getHandler(
  _event,
  ruleKey
) {
  try {
    return await fetchWebAutomationRule(
      ruleKey
    );
  } catch (error) {
    console.error(
      "❌ [Laravel WebAutomationRules] get error:",
      error
    );

    return formatError(
      error,
      "Web自動化ルールの取得に失敗しました。"
    );
  }
}

module.exports = {
  normalizeCategory,
  normalizeRuleKey,
  fetchWebAutomationRules,
  fetchWebAutomationRule,
  updateWebAutomationRule,
  listHandler,
  getHandler,
  updateHandler,
};
