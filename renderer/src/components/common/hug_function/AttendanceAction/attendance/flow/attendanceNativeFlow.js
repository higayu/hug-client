import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  tryNativeEnter,
  tryNativeLeave,
} from "../update/nativeDelegateInWebview.js";

const APP_KEY = "hug-banso-navi";
const WEBVIEW_KEY = "*";
const FLOW_CACHE_TTL_MS = 60 * 1000;

const flowCache = new Map();

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

  if (executor !== "native-onclick") {
    throw new Error(
      `${flow.flow_key} は native-onclick executor ではありません: ${executor || "未設定"}`,
    );
  }

  if (rule?.action_type && rule.action_type !== "execute-function") {
    throw new Error(
      `${rule.rule_key} の action_type が execute-function ではありません`,
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
 * DBのWebAutomation Flow/Ruleを実行時に取得し、HUG本体のnative onclickを実行する。
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

  const flow = await getAttendanceAutomationFlow(flowKey, {
    force: Boolean(ctx.forceReloadFlow),
  });
  const step = getExecutableRuleStep(flow);
  const rule = step.rule;
  const nativeConfig = validateNativeRule(flow, rule, action);
  const mailFlg = resolveMailFlg(flow, rule, ctx);

  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("入退室処理用のHUG自動処理WebViewを取得できませんでした");
  }

  const options = {
    facilityId: ctx.facilityId || item.facilityId || item.f_id,
    dateStr: ctx.dateStr || item.date || item.detailPageDate,
    mailFlg,
    nativeConfig,
  };

  console.log("[Attendance DB Flow] execute", {
    flowKey: flow.flow_key,
    stepKey: step.step_key,
    ruleKey: rule.rule_key,
    action,
    mailFlg,
    nativeConfig,
  });

  const result =
    action === "enter"
      ? await tryNativeEnter(webview, item, options)
      : await tryNativeLeave(webview, item, options);

  return {
    ...result,
    success: true,
    mode: "web-automation-native-onclick",
    flowKey: flow.flow_key,
    ruleKey: rule.rule_key,
    mail_flg: mailFlg,
    flow,
    step,
    rule,
  };
}
