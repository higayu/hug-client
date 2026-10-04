import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache";

const APP_KEY = "hug-banso-navi";
const WEBVIEW_KEY = "*";
const FLOW_KEY = "attendance_fetch_today_users";
const FLOW_CACHE_TTL_MS = 60 * 1000;

let cachedFlow = null;
let cachedAt = 0;

function normalizeJson(value, fallback = {}) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function unwrapData(result) {
  if (result?.data?.data && !Array.isArray(result.data.data)) return result.data.data;
  if (result?.data && !Array.isArray(result.data)) return result.data;
  return result ?? null;
}

function isActive(value) {
  return value !== false && value !== 0 && value !== "0";
}

function normalizeFlow(rawFlow) {
  const steps = Array.isArray(rawFlow?.steps)
    ? [...rawFlow.steps]
        .filter((step) => isActive(step?.is_active))
        .sort((a, b) => Number(a?.step_order ?? 0) - Number(b?.step_order ?? 0))
        .map((step) => ({
          ...step,
          input_json: normalizeJson(step?.input_json),
          config_json: normalizeJson(step?.config_json),
          rule: step?.rule
            ? {
                ...step.rule,
                config_json: normalizeJson(step.rule.config_json),
              }
            : null,
        }))
    : [];

  return {
    ...rawFlow,
    config_json: normalizeJson(rawFlow?.config_json),
    steps,
  };
}

async function getFlow({ force = false } = {}) {
  if (!force && cachedFlow && Date.now() - cachedAt < FLOW_CACHE_TTL_MS) {
    return cachedFlow;
  }

  const api = window.electronAPI?.laravel_webAutomationFlow_get;
  if (typeof api !== "function") {
    throw new Error("laravel_webAutomationFlow_get が preload に公開されていません");
  }

  const response = await api(FLOW_KEY, {
    app_key: APP_KEY,
    webview_key: WEBVIEW_KEY,
  });

  if (!response?.success) {
    throw new Error(
      response?.message ||
        response?.error ||
        `${FLOW_KEY} のWebAutomation Flow取得に失敗しました`,
    );
  }

  const rawFlow = unwrapData(response);
  if (!rawFlow) {
    throw new Error(`${FLOW_KEY} のWebAutomation Flowが見つかりません`);
  }

  const flow = normalizeFlow(rawFlow);
  if (!isActive(flow?.is_active)) {
    throw new Error(`${FLOW_KEY} は無効なWebAutomation Flowです`);
  }

  cachedFlow = flow;
  cachedAt = Date.now();
  return flow;
}

function getRuleStep(flow) {
  const step = flow?.steps?.find(
    (candidate) =>
      candidate?.step_type === "rule" &&
      candidate?.rule &&
      isActive(candidate.rule?.is_active),
  );

  if (!step?.rule) {
    throw new Error(`${FLOW_KEY} に有効なRule Stepがありません`);
  }
  return step;
}

function deepMerge(base, override) {
  if (!base || typeof base !== "object" || Array.isArray(base)) {
    return override;
  }
  if (!override || typeof override !== "object" || Array.isArray(override)) {
    return override === undefined ? base : override;
  }

  const out = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === "object" &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  });
  return out;
}

function replaceTemplateString(value, input) {
  return String(value).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const resolved = String(path)
      .split(".")
      .reduce((current, key) => current?.[key], input);
    return resolved == null ? "" : String(resolved);
  });
}

function resolveTemplates(value, input) {
  if (Array.isArray(value)) return value.map((item) => resolveTemplates(item, input));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveTemplates(item, input)]),
    );
  }
  if (typeof value === "string") return replaceTemplateString(value, input);
  return value;
}

function createExecutionUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `attendance-fetch-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getExecutionLogId(response) {
  return response?.data?.id ?? response?.data?.data?.id ?? response?.id ?? null;
}

async function createExecutionLog(payload) {
  const api = window.electronAPI?.laravel_webAutomationExecutionLog_create;
  if (typeof api !== "function") return null;
  try {
    const response = await api(payload);
    return response?.success ? getExecutionLogId(response) : null;
  } catch (error) {
    console.warn("[Attendance Fetch DB Flow] execution log create failed", error);
    return null;
  }
}

async function updateExecutionLog(id, payload) {
  if (!id) return;
  const api = window.electronAPI?.laravel_webAutomationExecutionLog_update;
  if (typeof api !== "function") return;
  try {
    await api(id, payload);
  } catch (error) {
    console.warn("[Attendance Fetch DB Flow] execution log update failed", error);
  }
}

function validateRule(flow, rule, config) {
  if (rule?.action_type && rule.action_type !== "fetch") {
    throw new Error(`${rule.rule_key} の action_type が fetch ではありません: ${rule.action_type}`);
  }

  const request = config?.request || {};
  if (!request.url) {
    throw new Error(`${rule.rule_key} の request.url がありません`);
  }

  const method = String(request.method || "GET").toUpperCase();
  if (method !== "GET") {
    throw new Error(`${rule.rule_key} の request.method はGETである必要があります: ${method}`);
  }

  const primarySelector =
    config?.table?.primarySelector || rule?.target_selector || null;
  if (!primarySelector) {
    throw new Error(`${rule.rule_key} のテーブルselectorがありません`);
  }

  return {
    ...config,
    request: {
      ...request,
      method,
      credentials: request.credentials || "include",
    },
    table: {
      ...(config?.table || {}),
      primarySelector,
      fallbackSelector: config?.table?.fallbackSelector || "table",
      bodySelector: config?.table?.bodySelector || "tbody",
    },
  };
}

function getWebviewUrl(webview) {
  try {
    return webview?.getURL?.() || webview?.getAttribute?.("src") || null;
  } catch {
    return webview?.getAttribute?.("src") || null;
  }
}

export async function executeAttendanceFetchFlow({
  facilityId,
  dateStr,
  webview: suppliedWebview = null,
  forceReloadFlow = false,
} = {}) {
  if (!facilityId || !dateStr) {
    return { ok: false, error: "施設IDまたは日付が設定されていません" };
  }

  const input = {
    facilityId: String(facilityId),
    dateStr: String(dateStr),
  };

  const startedAtMs = Date.now();
  const executionUuid = createExecutionUuid();
  let flow = null;
  let step = null;
  let rule = null;
  let webview = suppliedWebview;
  let executionLogId = null;
  let pageUrlBefore = null;

  try {
    flow = await getFlow({ force: forceReloadFlow });
    step = getRuleStep(flow);
    rule = step.rule;

    // 設定の優先順位: flow < step < rule
    const mergedConfig = deepMerge(
      deepMerge(flow?.config_json || {}, step?.config_json || {}),
      rule?.config_json || {},
    );
    const runtimeConfig = validateRule(
      flow,
      rule,
      resolveTemplates(mergedConfig, input),
    );

    webview = webview || (await getHugWebviewForCache());
    if (!webview) {
      throw new Error("今日の利用者取得用のHUG WebViewを取得できませんでした");
    }

    pageUrlBefore = getWebviewUrl(webview);

    executionLogId = await createExecutionLog({
      execution_uuid: executionUuid,
      app_key: APP_KEY,
      webview_key: WEBVIEW_KEY,
      flow_id: flow?.id ?? null,
      flow_key: flow?.flow_key ?? FLOW_KEY,
      flow_step_id: step?.id ?? null,
      step_key: step?.step_key ?? null,
      rule_id: rule?.id ?? null,
      rule_key: rule?.rule_key ?? null,
      webview_id: webview?.id || "hug-automation-webview",
      target_url: runtimeConfig?.request?.url || rule?.target_url_pattern || null,
      page_url_before: pageUrlBefore,
      action_type: rule?.action_type || "fetch",
      executor: rule?.parser_type || "attendance-table",
      target_selector: runtimeConfig?.table?.primarySelector || null,
      input_json: input,
      status: "running",
      started_at: new Date(startedAtMs).toISOString(),
      debug_json: {
        flowKey: flow?.flow_key,
        stepKey: step?.step_key,
        ruleKey: rule?.rule_key,
        request: runtimeConfig?.request,
        table: runtimeConfig?.table,
      },
    });

    const script = `
      (async () => {
        const CONFIG = ${JSON.stringify(runtimeConfig)};
        const request = CONFIG.request || {};
        const tableConfig = CONFIG.table || {};
        const loginCheck = CONFIG.loginCheck || {};

        const params = new URLSearchParams();
        Object.entries(request.query || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });

        const queryString = params.toString();
        const targetUrl = request.url + (queryString ? (request.url.includes("?") ? "&" : "?") + queryString : "");

        const extractTableFromDocument = (doc) => {
          let table = doc.querySelector(tableConfig.primarySelector);
          if (!table && tableConfig.fallbackSelector) {
            table = doc.querySelector(tableConfig.fallbackSelector);
          }
          if (!table) {
            const tables = doc.querySelectorAll("table");
            if (tables.length > 0) table = tables[0];
          }
          if (!table) return null;

          const rows = table.querySelectorAll("tr");
          return {
            html: table.outerHTML,
            rowCount: rows.length,
            className: table.className || ""
          };
        };

        try {
          console.log("[HUG WM][DB] fetch開始:", targetUrl);

          const response = await fetch(targetUrl, {
            method: request.method || "GET",
            credentials: request.credentials || "include"
          });

          if (!response.ok) {
            throw new Error("HTTP error: " + response.status);
          }

          const pageHtml = await response.text();
          const doc = new DOMParser().parseFromString(pageHtml, "text/html");

          if (loginCheck.enabled !== false) {
            const selectorMatched = loginCheck.loginInputSelector
              ? doc.querySelector(loginCheck.loginInputSelector) !== null
              : false;
            const titleMatched = loginCheck.titleContains
              ? (doc.title || "").includes(loginCheck.titleContains)
              : false;
            const htmlMatched = loginCheck.htmlContains
              ? pageHtml.includes(loginCheck.htmlContains)
              : false;

            if (selectorMatched || titleMatched || htmlMatched) {
              throw new Error("ログインページが返されました。HUGへのログイン状態を確認してください");
            }
          }

          const tableResult = extractTableFromDocument(doc);
          if (!tableResult) {
            throw new Error("テーブルが見つかりません");
          }

          return {
            ok: true,
            html: tableResult.html,
            rowCount: tableResult.rowCount,
            className: tableResult.className,
            pageTitle: doc.title || "",
            pageUrl: response.url || targetUrl
          };
        } catch (error) {
          console.error("[HUG WM][DB] 利用者テーブル取得エラー:", error);
          return {
            ok: false,
            error: error && error.message ? String(error.message) : String(error)
          };
        }
      })()
    `;

    const result = await webview.executeJavaScript(script);
    const durationMs = Date.now() - startedAtMs;

    if (!result?.ok) {
      const error = new Error(result?.error || "利用者データ取得に失敗しました");
      error.code = "ATTENDANCE_FETCH_RESULT_FAILED";
      throw error;
    }

    await updateExecutionLog(executionLogId, {
      status: "success",
      page_url_after: getWebviewUrl(webview),
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      result_json: {
        ok: true,
        rowCount: result?.rowCount ?? null,
        pageTitle: result?.pageTitle ?? null,
        pageUrl: result?.pageUrl ?? null,
      },
    });

    return {
      ...result,
      flowKey: flow.flow_key,
      ruleKey: rule.rule_key,
      automationConfig: runtimeConfig,
    };
  } catch (error) {
    const failedPayload = {
      status: "failed",
      page_url_after: getWebviewUrl(webview),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAtMs,
      error_code: error?.code || "ATTENDANCE_FETCH_FLOW_FAILED",
      error_message: error?.message || String(error),
      debug_json: {
        flowKey: flow?.flow_key || FLOW_KEY,
        stepKey: step?.step_key ?? null,
        ruleKey: rule?.rule_key ?? null,
        stack: error?.stack || null,
      },
    };

    if (executionLogId) {
      await updateExecutionLog(executionLogId, failedPayload);
    } else {
      await createExecutionLog({
        execution_uuid: executionUuid,
        app_key: APP_KEY,
        webview_key: WEBVIEW_KEY,
        flow_id: flow?.id ?? null,
        flow_key: flow?.flow_key || FLOW_KEY,
        flow_step_id: step?.id ?? null,
        step_key: step?.step_key ?? null,
        rule_id: rule?.id ?? null,
        rule_key: rule?.rule_key ?? null,
        webview_id: webview?.id || "hug-automation-webview",
        page_url_before: pageUrlBefore,
        action_type: rule?.action_type || "fetch",
        executor: rule?.parser_type || "attendance-table",
        input_json: input,
        started_at: new Date(startedAtMs).toISOString(),
        ...failedPayload,
      });
    }

    return {
      ok: false,
      error: error?.message || String(error),
    };
  }
}
