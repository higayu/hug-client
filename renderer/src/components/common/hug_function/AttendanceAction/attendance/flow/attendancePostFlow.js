/**
 * web_automation_flows / web_automation_flow_steps / web_automation_rules
 * を使って入退室POSTを実行するための小さなランタイム。
 *
 * 既存のonclick解析・POST処理をDB設定へ寄せる目的で使用する。
 */

import { decodeHtmlEntities } from "../_shared/htmlEntities.js";
import { postAttendanceDataListInWebview } from "../post/postAttendanceInWebview.js";

const APP_KEY = "hug-banso-navi";
const WEBVIEW_KEY = "*";
const FLOW_CACHE_TTL_MS = 60 * 1000;

const flowCache = new Map();

function normalizeJson(value, fallback = {}) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
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

function replaceTemplateString(value, variables) {
  if (typeof value !== "string") return value;

  return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
    const normalizedKey = String(key || "").trim();
    const replacement = variables?.[normalizedKey];
    return replacement == null ? "" : String(replacement);
  });
}

function expandTemplates(value, variables) {
  if (Array.isArray(value)) {
    return value.map((item) => expandTemplates(item, variables));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        replaceTemplateString(key, variables),
        expandTemplates(item, variables),
      ])
    );
  }

  return replaceTemplateString(value, variables);
}

function normalizeBooleanActive(value) {
  return value !== false && value !== 0 && value !== "0";
}

function sortActiveRuleSteps(flow) {
  return Array.isArray(flow?.steps)
    ? [...flow.steps]
        .filter((step) => normalizeBooleanActive(step?.is_active))
        .sort(
          (a, b) => Number(a?.step_order ?? 0) - Number(b?.step_order ?? 0)
        )
    : [];
}

async function fetchFlow(flowKey, { force = false } = {}) {
  const normalizedFlowKey = String(flowKey || "").trim();
  if (!normalizedFlowKey) {
    return { ok: false, error: "flowKey が空です" };
  }

  const cached = flowCache.get(normalizedFlowKey);
  if (
    !force &&
    cached?.flow &&
    Date.now() - Number(cached.loadedAt || 0) < FLOW_CACHE_TTL_MS
  ) {
    return { ok: true, flow: cached.flow, cached: true };
  }

  const api = window.electronAPI?.laravel_webAutomationFlow_get;
  if (typeof api !== "function") {
    return {
      ok: false,
      error: "laravel_webAutomationFlow_get が preload に公開されていません",
    };
  }

  const result = await api(normalizedFlowKey, {
    app_key: APP_KEY,
    webview_key: WEBVIEW_KEY,
  });

  if (!result?.success) {
    return {
      ok: false,
      error:
        result?.message ||
        result?.error ||
        `${normalizedFlowKey} の取得に失敗しました`,
      details: result,
    };
  }

  const flow = unwrapData(result);
  if (!flow) {
    return { ok: false, error: `${normalizedFlowKey} が見つかりません` };
  }

  const normalizedFlow = {
    ...flow,
    config_json: normalizeJson(flow.config_json),
    steps: sortActiveRuleSteps(flow).map((step) => ({
      ...step,
      input_json: normalizeJson(step.input_json),
      config_json: normalizeJson(step.config_json),
      rule: step.rule
        ? {
            ...step.rule,
            config_json: normalizeJson(step.rule.config_json),
          }
        : step.rule,
    })),
  };

  flowCache.set(normalizedFlowKey, {
    flow: normalizedFlow,
    loadedAt: Date.now(),
  });

  return { ok: true, flow: normalizedFlow, cached: false };
}

function splitFunctionArguments(argsText) {
  const result = [];
  let current = "";
  let quote = "";
  let escaped = false;

  for (let i = 0; i < argsText.length; i += 1) {
    const char = argsText[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = "";
      }
      current += char;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }

    if (char === ",") {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim() !== "" || argsText.endsWith(",")) {
    result.push(current.trim());
  }

  return result.map((value) => {
    const trimmed = String(value ?? "").trim();
    const quoted = trimmed.match(/^(['"])(.*)\1$/s);
    return quoted ? quoted[2] : trimmed;
  });
}

function parseFunctionArgumentsFromOnclick(onclickAttr, rule) {
  const config = rule?.config_json || {};
  const functionName = String(rule?.function_name || config.functionName || "").trim();

  if (!functionName) {
    throw new Error(`${rule?.rule_key || "Rule"} の function_name がありません`);
  }

  const normalizedOnclick = decodeHtmlEntities(onclickAttr);
  const escapedFunctionName = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = normalizedOnclick.match(
    new RegExp(`${escapedFunctionName}\\s*\\((.*)\\)`, "s")
  );

  if (!match) {
    throw new Error(`${functionName} の onclick を解析できません`);
  }

  const args = splitFunctionArguments(match[1]);
  const acceptedCounts = Array.isArray(config.acceptedArgumentCounts)
    ? config.acceptedArgumentCounts.map((count) => Number(count))
    : [];

  if (acceptedCounts.length > 0 && !acceptedCounts.includes(args.length)) {
    throw new Error(
      `${functionName} の引数数が不正です: ${args.length} / accepted=${acceptedCounts.join(",")}`
    );
  }

  const parsed = { ...(config.defaults || {}) };
  const mapping = config.arguments || {};

  Object.entries(mapping).forEach(([key, index]) => {
    const argIndex = Number(index);
    if (Number.isInteger(argIndex) && argIndex >= 0 && argIndex < args.length) {
      parsed[key] = args[argIndex];
    }
  });

  return parsed;
}

function numberOrString(value) {
  if (value === "" || value === null || value === undefined) return value;
  const text = String(value).trim();
  if (/^-?\d+$/.test(text)) return Number(text);
  return text;
}

function buildDataListFromRule({ rule, parsedArgs, mailFlg, patch = {} }) {
  const config = rule?.config_json || {};
  const post = config.post || {};
  const attendanceType = Number(post.attendanceType || patch.attendance_type || 0);

  if (![1, 2].includes(attendanceType)) {
    throw new Error(
      `${rule?.rule_key || "Rule"} の config_json.post.attendanceType が不正です`
    );
  }

  // HUG の ajax_attendance.php は既存実装で動作確認済みの data_list 形式を
  // そのまま維持する。解析方法・attendanceType 等は DB Rule を参照するが、
  // 値の型とキー構成は旧実装と完全互換にする。
  if (attendanceType === 1) {
    return {
      attendance_type: 1,
      r_id: String(parsedArgs.recordId ?? "").trim(),
      mail_flg: Number(mailFlg) === 1 ? 1 : 0,
      c_id: Number(parsedArgs.childId),
      f_id: Number(parsedArgs.facilityId),
      attend_flg: Number(parsedArgs.attendFlg),
      linkage: Number(parsedArgs.linkage),
      date: String(parsedArgs.date ?? "").trim(),
      strength_action: Number(parsedArgs.strengthAction),
      special_support: Number(parsedArgs.specialSupport ?? 0),
      meal_add: Number(parsedArgs.mealAdd ?? 0),
    };
  }

  // 退室は旧正常実装 leaveDataListFromOnclick() と同じキー・型・順序に固定する。
  // onclick の解析自体は DB Rule(config_json.arguments) の結果 parsedArgs を使用する。
  return {
    date: String(patch?.date ?? "").trim(),
    enter_time_hi: String(patch?.enter_time_hi ?? "").trim(),
    leave_time_hi: String(patch?.leave_time_hi ?? "").trim(),
    diff_check_time: Number(patch?.diff_check_time),
    interval_time: String(patch?.interval_time ?? ""),
    attendance_type: 2,
    r_id: String(parsedArgs.recordId ?? "").trim(),
    c_id: Number(parsedArgs.childId),
    f_id: Number(parsedArgs.facilityId),
    attend_flg: Number(parsedArgs.attendFlg),
    linkage: Number(parsedArgs.linkage),
    mail_flg: Number(mailFlg) === 1 ? 1 : 0,
    hidden_mail_only: String(
      patch?.hidden_mail_only ?? parsedArgs.hiddenMailOnly ?? ""
    ),
  };
}

function validateAttendanceDataList(dataList, attendanceType) {
  const required = attendanceType === 1
    ? ["r_id", "c_id", "f_id", "date"]
    : [
        "date",
        "enter_time_hi",
        "leave_time_hi",
        "diff_check_time",
        "interval_time",
        "r_id",
        "c_id",
        "f_id",
      ];

  const missing = required.filter((key) => {
    const value = dataList?.[key];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    throw new Error(
      `attendance data_list の必須項目が不足しています: ${missing.join(", ")}`
    );
  }

  if (attendanceType === 2 && !Number.isFinite(Number(dataList.diff_check_time))) {
    throw new Error("退室 diff_check_time が不正です");
  }
}


function assertStepInputMatches(stepInput, parsedArgs, variables) {
  const expectedChildId = String(stepInput?.childId || variables?.childId || "").trim();
  const parsedChildId = String(parsedArgs?.childId || "").trim();

  if (expectedChildId && parsedChildId && expectedChildId !== parsedChildId) {
    throw new Error(
      `Flow入力のchildIdとonclickのchildIdが一致しません: input=${expectedChildId}, onclick=${parsedChildId}`
    );
  }

  const expectedFacilityId = String(
    stepInput?.facilityId || variables?.facilityId || ""
  ).trim();
  const parsedFacilityId = String(parsedArgs?.facilityId || "").trim();

  if (expectedFacilityId && parsedFacilityId && expectedFacilityId !== parsedFacilityId) {
    throw new Error(
      `Flow入力のfacilityIdとonclickのfacilityIdが一致しません: input=${expectedFacilityId}, onclick=${parsedFacilityId}`
    );
  }
}

/**
 * @param {Electron.WebviewTag} webview
 * @param {object} params
 * @param {'attendance_enter_no_mail'|'attendance_enter_with_mail'|'attendance_leave_no_mail'|'attendance_leave_with_mail'} params.flowKey
 * @param {'enter'|'leave'} params.action
 * @param {object} params.item
 * @param {number} params.mailFlg
 * @param {object} [params.patch]
 * @param {object} [params.variables]
 */
export async function executeAttendancePostFlow(webview, params = {}) {
  const {
    flowKey,
    action,
    item,
    mailFlg = 0,
    patch = {},
    variables = {},
  } = params;

  if (!webview) {
    return { success: false, error: "webview がありません" };
  }

  const flowResult = await fetchFlow(flowKey);
  if (!flowResult.ok) {
    return { success: false, error: flowResult.error, flowError: flowResult };
  }

  const flow = flowResult.flow;
  const step = flow.steps.find(
    (candidate) => candidate?.step_type === "rule" && candidate?.rule
  );

  if (!step?.rule) {
    return {
      success: false,
      error: `${flowKey} に実行可能なRule Stepがありません`,
    };
  }

  const rule = step.rule;
  if (!normalizeBooleanActive(rule?.is_active)) {
    return { success: false, error: `${rule.rule_key || "Rule"} は無効です` };
  }

  const config = rule.config_json || {};
  const post = config.post || {};
  const expectedAttendanceType = action === "enter" ? 1 : 2;

  if (Number(post.attendanceType) !== expectedAttendanceType) {
    return {
      success: false,
      error: `${rule.rule_key || "Rule"} の attendanceType が ${expectedAttendanceType} ではありません`,
    };
  }

  const onclickAttr = action === "enter" ? item?.enterOnclick : item?.leaveOnclick;
  if (!onclickAttr) {
    return {
      success: false,
      error: `${action === "enter" ? "入室" : "退室"} onclick がありません`,
    };
  }

  try {
    const runtimeVariables = {
      ...variables,
      childId: variables.childId ?? item?.childId ?? item?.children_id,
      facilityId: variables.facilityId ?? item?.facilityId,
      date: variables.date ?? variables.dateStr ?? item?.detailPageDate,
      dateStr: variables.dateStr ?? variables.date ?? item?.detailPageDate,
      isMail: Number(mailFlg) === 1 ? 1 : 0,
      mailFlg: Number(mailFlg) === 1 ? 1 : 0,
      mail_flg: Number(mailFlg) === 1 ? 1 : 0,
    };

    const stepInput = expandTemplates(step.input_json || {}, runtimeVariables);
    const parsedArgs = parseFunctionArgumentsFromOnclick(onclickAttr, rule);

    assertStepInputMatches(stepInput, parsedArgs, runtimeVariables);

    const dataList = buildDataListFromRule({
      rule,
      parsedArgs,
      mailFlg,
      patch,
    });

    validateAttendanceDataList(dataList, expectedAttendanceType);

    console.log("[AttendancePostFlow] POST dataList:", {
      flowKey: flow.flow_key,
      stepKey: step.step_key,
      ruleKey: rule.rule_key,
      mailFlg,
      stepInput,
      postConfig: post,
      parsedArgs,
      patch,
      dataList,
    });

    const postResult = await postAttendanceDataListInWebview(
      webview,
      dataList,
      post
    );

    return {
      ...postResult,
      flow,
      step,
      rule,
      dataList: postResult?.dataList || dataList,
      mode: "web-automation-flow",
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message ? String(error.message) : String(error),
    };
  }
}
