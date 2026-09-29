import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import store from "@/store/store.js";
import {
  tryNativeEnter,
  tryNativeLeave,
} from "../update/nativeDelegateInWebview.js";

const APP_KEY = "hug-banso-navi";
const WEBVIEW_KEY = "*";
const FLOW_CACHE_TTL_MS = 60 * 1000;

const flowCache = new Map();

function isDeveloperModeEnabled(ctx = {}) {
  if (typeof ctx.developerMode === "boolean") {
    return ctx.developerMode;
  }

  const state = store.getState?.() || {};
  const appState = state?.appState || {};
  const databaseState = state?.databaseState || {};

  const value =
    appState.DEBUG_FLG ??
    appState.DEVELOPER_MODE ??
    appState.developerMode ??
    appState.isDeveloperMode ??
    databaseState.DEVELOPER_MODE ??
    databaseState.developerMode ??
    databaseState.isDeveloperMode ??
    false;

  return value === true || value === 1 || value === "1" || value === "true";
}

function createExecutionUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `web-auto-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getWebviewUrl(webview) {
  try {
    return webview?.getURL?.() || webview?.getAttribute?.("src") || null;
  } catch {
    return webview?.getAttribute?.("src") || null;
  }
}

function getExecutionLogId(response) {
  return (
    response?.data?.id ??
    response?.data?.data?.id ??
    response?.id ??
    null
  );
}

async function createExecutionLog(payload) {
  const api = window.electronAPI?.laravel_webAutomationExecutionLog_create;
  if (typeof api !== "function") {
    console.warn(
      "[Attendance Execution Log] create API が preload に公開されていません",
    );
    return null;
  }

  try {
    const response = await api(payload);
    if (!response?.success) {
      console.warn("[Attendance Execution Log] create failed", response);
      return null;
    }
    return getExecutionLogId(response);
  } catch (error) {
    console.warn("[Attendance Execution Log] create error", error);
    return null;
  }
}

async function updateExecutionLog(id, payload) {
  if (!id) return false;

  const api = window.electronAPI?.laravel_webAutomationExecutionLog_update;
  if (typeof api !== "function") {
    console.warn(
      "[Attendance Execution Log] update API が preload に公開されていません",
    );
    return false;
  }

  try {
    const response = await api(id, payload);
    if (!response?.success) {
      console.warn("[Attendance Execution Log] update failed", response);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Attendance Execution Log] update error", error);
    return false;
  }
}

function buildLogBase({
  executionUuid,
  flow,
  step,
  rule,
  action,
  webview,
  item,
  options,
  mailFlg,
  nativeConfig,
  pageUrlBefore,
}) {
  return {
    execution_uuid: executionUuid,
    app_key: APP_KEY,
    webview_key: WEBVIEW_KEY,
    flow_id: flow?.id ?? null,
    flow_key: flow?.flow_key ?? null,
    flow_step_id: step?.id ?? null,
    step_key: step?.step_key ?? null,
    rule_id: rule?.id ?? null,
    rule_key: rule?.rule_key ?? null,
    webview_id: webview?.id || "hug-automation-webview",
    target_url: rule?.target_url_pattern || flow?.target_url_pattern || null,
    page_url_before: pageUrlBefore,
    action_type: rule?.action_type || null,
    executor:
      rule?.config_json?.execute ||
      flow?.config_json?.executor ||
      rule?.parser_type ||
      null,
    function_name: nativeConfig?.functionName || rule?.function_name || null,
    target_selector: nativeConfig?.selectorTemplate || rule?.target_selector || null,
    input_json: {
      action,
      recordId: item?.recordId ?? item?.record_id ?? item?.id ?? null,
      childId: item?.c_id ?? item?.childId ?? item?.children_id ?? null,
      facilityId: options?.facilityId ?? null,
      date: options?.dateStr ?? null,
      mailFlg,
    },
  };
}

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
  if (result?.data?.data && !Array.isArray(result.data.data)) {
    return result.data.data;
  }
  if (result?.data && !Array.isArray(result.data)) {
    return result.data;
  }
  return result ?? null;
}

function isActive(value) {
  return value !== false && value !== 0 && value !== "0";
}

function normalizeFlow(flow) {
  const steps = Array.isArray(flow?.steps)
    ? [...flow.steps]
        .filter((step) => isActive(step?.is_active))
        .sort((a, b) => Number(a?.step_order ?? 0) - Number(b?.step_order ?? 0))
        .map((step) => ({
          ...step,
          input_json: normalizeJson(step.input_json),
          config_json: normalizeJson(step.config_json),
          rule: step.rule
            ? {
                ...step.rule,
                config_json: normalizeJson(step.rule.config_json),
              }
            : null,
        }))
    : [];

  return {
    ...flow,
    config_json: normalizeJson(flow?.config_json),
    steps,
  };
}

export async function getAttendanceAutomationFlow(
  flowKey,
  { force = false } = {},
) {
  const key = String(flowKey || "").trim();
  if (!key) {
    throw new Error("入退室WebAutomationの flowKey がありません");
  }

  const cached = flowCache.get(key);
  if (
    !force &&
    cached?.flow &&
    Date.now() - cached.loadedAt < FLOW_CACHE_TTL_MS
  ) {
    return cached.flow;
  }

  const api = window.electronAPI?.laravel_webAutomationFlow_get;
  if (typeof api !== "function") {
    throw new Error(
      "laravel_webAutomationFlow_get が preload に公開されていません",
    );
  }

  const response = await api(key, {
    app_key: APP_KEY,
    webview_key: WEBVIEW_KEY,
  });

  if (!response?.success) {
    throw new Error(
      response?.message ||
        response?.error ||
        `${key} のWebAutomation Flow取得に失敗しました`,
    );
  }

  const rawFlow = unwrapData(response);
  if (!rawFlow) {
    throw new Error(`${key} のWebAutomation Flowが見つかりません`);
  }

  const flow = normalizeFlow(rawFlow);
  if (!isActive(flow?.is_active)) {
    throw new Error(`${key} は無効なWebAutomation Flowです`);
  }

  flowCache.set(key, {
    flow,
    loadedAt: Date.now(),
  });

  return flow;
}

function getExecutableRuleStep(flow) {
  const step = flow?.steps?.find(
    (candidate) =>
      candidate?.step_type === "rule" &&
      candidate?.rule &&
      isActive(candidate.rule?.is_active),
  );

  if (!step?.rule) {
    throw new Error(
      `${flow?.flow_key || "WebAutomation Flow"} に有効なRule Stepがありません`,
    );
  }

  return step;
}

function resolveMailFlg(flow, rule, ctx = {}) {
  const flowMode = flow?.config_json?.mailMode;
  const ruleMode = rule?.config_json?.mailMode;
  const mailMode = ruleMode || flowMode;

  if (mailMode === "with_mail") return 1;
  if (mailMode === "no_mail") return 0;

  return Number(ctx.mailFlg ?? ctx.mail_flg) === 1 ? 1 : 0;
}

function validateNativeRule(flow, rule, action) {
  const flowConfig = flow?.config_json || {};
  const ruleConfig = rule?.config_json || {};

  const configuredAction = String(flowConfig.action || "").trim();
  if (configuredAction && configuredAction !== action) {
    throw new Error(
      `${flow.flow_key} のactionが不一致です: ${configuredAction} / expected=${action}`,
    );
  }

  const executor = String(
    ruleConfig.execute ||
      flowConfig.executor ||
      rule?.parser_type ||
      "",
  ).trim();

  // 実行は常にWebView内の実DOMボタン click()。
  // DB移行中の旧 native-onclick 定義も同じDOM click経路へ読み替える。
  if (!["dom-click", "native-onclick"].includes(executor)) {
    throw new Error(
      `${flow.flow_key} は dom-click executor ではありません: ${executor || "未設定"}`,
    );
  }

  if (rule?.action_type && !["click", "execute-function"].includes(rule.action_type)) {
    throw new Error(
      `${rule.rule_key} の action_type が click ではありません: ${rule.action_type}`,
    );
  }

  return {
    reloadAttendanceDetailBeforeExecute:
      ruleConfig.reloadAttendanceDetailBeforeExecute ??
      flowConfig.reloadAttendanceDetailBeforeExecute ??
      true,
    functionName:
      rule?.function_name ||
      ruleConfig.functionName ||
      (action === "enter" ? "sendEnterMail" : "sendLeaveMail"),
    cellIdPrefix:
      ruleConfig.cellIdPrefix ||
      (action === "enter" ? "enter" : "leave"),
    selectorTemplate:
      ruleConfig.selectorTemplate ||
      rule?.target_selector ||
      null,
  };
}

/**
 * DBのWebAutomation Flow/Ruleを実行時に取得し、HUG本体WebView上の実ボタンをDOM clickする。
 */
export async function executeAttendanceNativeFlow(
  flowKey,
  action,
  item,
  ctx = {},
) {
  if (!item) {
    throw new Error("入退室対象データがありません");
  }

  const startedAtMs = Date.now();
  const executionUuid = createExecutionUuid();
  const developerMode = isDeveloperModeEnabled(ctx);

  let flow = null;
  let step = null;
  let rule = null;
  let webview = null;
  let nativeConfig = null;
  let mailFlg = Number(ctx.mailFlg ?? ctx.mail_flg) === 1 ? 1 : 0;
  let options = null;
  let pageUrlBefore = null;
  let executionLogId = null;

  try {
    flow = await getAttendanceAutomationFlow(flowKey, {
      force: Boolean(ctx.forceReloadFlow),
    });
    step = getExecutableRuleStep(flow);
    rule = step.rule;
    nativeConfig = validateNativeRule(flow, rule, action);
    mailFlg = resolveMailFlg(flow, rule, ctx);

    webview = ctx.webview || (await getHugWebviewForCache());
    if (!webview) {
      throw new Error("入退室処理用のHUG自動処理WebViewを取得できませんでした");
    }

    options = {
      facilityId: ctx.facilityId || item.facilityId || item.f_id,
      dateStr: ctx.dateStr || item.date || item.detailPageDate,
      mailFlg,
      nativeConfig,
    };

    pageUrlBefore = getWebviewUrl(webview);

    console.log("[Attendance DB Flow] execute", {
      flowKey: flow.flow_key,
      stepKey: step.step_key,
      ruleKey: rule.rule_key,
      action,
      mailFlg,
      nativeConfig,
      developerMode,
    });

    // 開発者モードでは開始時点からログを残す。
    if (developerMode) {
      executionLogId = await createExecutionLog({
        ...buildLogBase({
          executionUuid,
          flow,
          step,
          rule,
          action,
          webview,
          item,
          options,
          mailFlg,
          nativeConfig,
          pageUrlBefore,
        }),
        status: "running",
        started_at: new Date(startedAtMs).toISOString(),
        debug_json: {
          developerMode: true,
          reloadAttendanceDetailBeforeExecute:
            nativeConfig.reloadAttendanceDetailBeforeExecute,
        },
      });
    }

    const result =
      action === "enter"
        ? await tryNativeEnter(webview, item, options)
        : await tryNativeLeave(webview, item, options);

    const durationMs = Date.now() - startedAtMs;
    const pageUrlAfter = getWebviewUrl(webview);

    // 成功ログは開発者モード時だけ保存。
    if (developerMode && executionLogId) {
      await updateExecutionLog(executionLogId, {
        status: "success",
        page_url_after: pageUrlAfter,
        finished_at: new Date().toISOString(),
        duration_ms: durationMs,
        result_json: {
          success: true,
          mode: "web-automation-dom-click",
          mailFlg,
          statusMessage: result?.statusMessage ?? null,
          result,
        },
        debug_json: {
          developerMode: true,
          action,
          flowKey: flow?.flow_key ?? flowKey,
          stepKey: step?.step_key ?? null,
          ruleKey: rule?.rule_key ?? null,
          nativeConfig,
        },
      });
    }

    return {
      ...result,
      success: true,
      mode: "web-automation-dom-click",
      flowKey: flow.flow_key,
      ruleKey: rule.rule_key,
      mail_flg: mailFlg,
      flow,
      step,
      rule,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAtMs;
    const pageUrlAfter = getWebviewUrl(webview);

    const failedPayload = {
      ...(flow && step && rule
        ? buildLogBase({
            executionUuid,
            flow,
            step,
            rule,
            action,
            webview,
            item,
            options: options || {
              facilityId: ctx.facilityId || item.facilityId || item.f_id,
              dateStr: ctx.dateStr || item.date || item.detailPageDate,
            },
            mailFlg,
            nativeConfig,
            pageUrlBefore,
          })
        : {
            execution_uuid: executionUuid,
            app_key: APP_KEY,
            webview_key: WEBVIEW_KEY,
            flow_key: flow?.flow_key || flowKey,
            flow_id: flow?.id ?? null,
            flow_step_id: step?.id ?? null,
            step_key: step?.step_key ?? null,
            rule_id: rule?.id ?? null,
            rule_key: rule?.rule_key ?? null,
            webview_id: webview?.id || "hug-automation-webview",
            page_url_before: pageUrlBefore,
            action_type: rule?.action_type || null,
            executor:
              rule?.config_json?.execute ||
              flow?.config_json?.executor ||
              rule?.parser_type ||
              null,
            function_name:
              nativeConfig?.functionName || rule?.function_name || null,
            target_selector:
              nativeConfig?.selectorTemplate || rule?.target_selector || null,
            input_json: {
              action,
              recordId: item?.recordId ?? item?.record_id ?? item?.id ?? null,
              childId:
                item?.c_id ?? item?.childId ?? item?.children_id ?? null,
              facilityId:
                ctx.facilityId || item?.facilityId || item?.f_id || null,
              date: ctx.dateStr || item?.date || item?.detailPageDate || null,
              mailFlg,
            },
          }),
      status: "failed",
      page_url_after: pageUrlAfter,
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      error_code: error?.code || "ATTENDANCE_NATIVE_FLOW_FAILED",
      error_message: error?.message || String(error),
      debug_json: {
        developerMode,
        action,
        flowKey: flow?.flow_key || flowKey,
        stepKey: step?.step_key ?? null,
        ruleKey: rule?.rule_key ?? null,
        nativeConfig,
        stack: error?.stack || null,
      },
    };

    // 失敗時は開発者モードに関係なく必ず保存する。
    if (executionLogId) {
      await updateExecutionLog(executionLogId, failedPayload);
    } else {
      await createExecutionLog({
        ...failedPayload,
        started_at: new Date(startedAtMs).toISOString(),
      });
    }

    throw error;
  }
}

