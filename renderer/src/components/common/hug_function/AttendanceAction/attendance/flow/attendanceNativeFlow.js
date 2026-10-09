import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  tryNativeEnter,
  tryNativeLeave,
} from "../update/nativeDelegateInWebview.js";

/**
 * 入退室処理はDBを使用せず、Renderer側の固定設定で実行する。
 *
 * HUG本体の attendance.php detail 画面を開き、
 * 実DOM上の入室/退室ボタンを button.click() する。
 * そのため sendEnterMail / sendLeaveMail やHUG側Ajax処理は
 * HUG本体のJavaScriptへそのまま委譲する。
 */

const DIRECT_ATTENDANCE_FLOWS = {
  attendance_enter_no_mail: {
    action: "enter",
    mailMode: "no_mail",
    ruleKey: "attendance_enter_no_mail",
    nativeConfig: {
      reloadAttendanceDetailBeforeExecute: true,
      detectMailDialog: false,
      functionName: "sendEnterMail",
      cellIdPrefix: "enter",
      selectorTemplate:
        '#enter{{recordId}} button[onclick*="sendEnterMail"]',
      mailDialogSelector: "#addtend_dialog_mail",
      mailDialogButtonSelector:
        '.send_mail_button[data-send_mail="{{sendMail}}"]',
      mailDialogTimeoutMs: 10000,
      attendanceActionCompletionTimeoutMs: 12000,
    },
  },

  attendance_leave_no_mail: {
    action: "leave",
    mailMode: "no_mail",
    ruleKey: "attendance_leave_no_mail",
    nativeConfig: {
      reloadAttendanceDetailBeforeExecute: true,
      detectMailDialog: false,
      functionName: "sendLeaveMail",
      cellIdPrefix: "leave",
      selectorTemplate:
        '#leave{{recordId}} button[onclick*="sendLeaveMail"]',
      mailDialogSelector: "#addtend_dialog_mail",
      mailDialogButtonSelector:
        '.send_mail_button[data-send_mail="{{sendMail}}"]',
      mailDialogTimeoutMs: 10000,
      attendanceActionCompletionTimeoutMs: 12000,
    },
  },

  attendance_enter_with_mail: {
    action: "enter",
    mailMode: "with_mail",
    ruleKey: "attendance_enter_with_mail",
    nativeConfig: {
      reloadAttendanceDetailBeforeExecute: true,
      detectMailDialog: true,
      functionName: "sendEnterMail",
      cellIdPrefix: "enter",
      selectorTemplate:
        '#enter{{recordId}} button[onclick*="sendEnterMail"]',
      mailDialogSelector: "#addtend_dialog_mail",
      mailDialogButtonSelector:
        '.send_mail_button[data-send_mail="{{sendMail}}"]',
      mailDialogTimeoutMs: 10000,
      attendanceActionCompletionTimeoutMs: 12000,
    },
  },

  attendance_leave_with_mail: {
    action: "leave",
    mailMode: "with_mail",
    ruleKey: "attendance_leave_with_mail",
    nativeConfig: {
      reloadAttendanceDetailBeforeExecute: true,
      detectMailDialog: true,
      functionName: "sendLeaveMail",
      cellIdPrefix: "leave",
      selectorTemplate:
        '#leave{{recordId}} button[onclick*="sendLeaveMail"]',
      mailDialogSelector: "#addtend_dialog_mail",
      mailDialogButtonSelector:
        '.send_mail_button[data-send_mail="{{sendMail}}"]',
      mailDialogTimeoutMs: 10000,
      attendanceActionCompletionTimeoutMs: 12000,
    },
  },
};

function getDirectFlowConfig(flowKey, action) {
  const key = String(flowKey || "").trim();
  const config = DIRECT_ATTENDANCE_FLOWS[key];

  if (!config) {
    throw new Error(`未対応の入退室処理です: ${key || "flowKey未指定"}`);
  }

  if (config.action !== action) {
    throw new Error(
      `${key} の処理種別が不一致です: ${config.action} / expected=${action}`,
    );
  }

  return config;
}

function resolveMailFlg(config, ctx = {}) {
  if (config.mailMode === "no_mail") {
    return 0;
  }

  return Number(ctx.mailFlg ?? ctx.mail_flg) === 1 ? 1 : 0;
}

/**
 * 互換用。
 * 以前はDBからFlowを取得していたが、現在はRenderer内の固定設定を返す。
 */
export async function getAttendanceAutomationFlow(flowKey) {
  const config = DIRECT_ATTENDANCE_FLOWS[String(flowKey || "").trim()];

  if (!config) {
    throw new Error(`未対応の入退室処理です: ${flowKey || "flowKey未指定"}`);
  }

  return {
    id: null,
    flow_key: String(flowKey),
    is_active: 1,
    config_json: {
      category: "attendance",
      action: config.action,
      mailMode: config.mailMode,
      executor: "dom-click",
      requiresHugLogin: true,
      useHugCacheWebview: true,
      ...config.nativeConfig,
    },
    steps: [],
  };
}

/**
 * Renderer直書きの入退室処理。
 *
 * 1. HUG自動処理WebViewを取得
 * 2. attendance.php detail を最新状態で読み込み
 * 3. 対象の実DOMボタンをclick()
 * 4. メールありの場合はHUG側メールモーダルを監視してRenderer選択値を反映
 * 5. 入室/退室セルからボタンが消えるまで完了待機
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

  const config = getDirectFlowConfig(flowKey, action);
  const mailFlg = resolveMailFlg(config, ctx);

  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("入退室処理用のHUG自動処理WebViewを取得できませんでした");
  }

  const facilityId =
    ctx.facilityId ??
    item.facilityId ??
    item.f_id ??
    "";

  const dateStr =
    ctx.dateStr ??
    item.date ??
    item.detailPageDate ??
    "";

  if (!facilityId) {
    throw new Error("入退室処理に必要な facilityId がありません");
  }

  if (!dateStr) {
    throw new Error("入退室処理に必要な dateStr がありません");
  }

  console.log("[Attendance Direct] execute", {
    flowKey,
    action,
    mailMode: config.mailMode,
    mailFlg,
    recordId: item?.r_id ?? item?.recordId ?? null,
    childId: item?.c_id ?? item?.childId ?? item?.children_id ?? null,
    facilityId,
    dateStr,
    nativeConfig: config.nativeConfig,
  });

  const options = {
    facilityId,
    dateStr,
    mailFlg,
    nativeConfig: config.nativeConfig,
  };

  const result =
    action === "enter"
      ? await tryNativeEnter(webview, item, options)
      : await tryNativeLeave(webview, item, options);

  // 既存呼び出し側との互換を維持するため、
  // flowKey / ruleKey / mail_flg は従来通り返す。
  return {
    ...result,
    success: true,
    mode: "renderer-direct-dom-click",
    flowKey,
    ruleKey: config.ruleKey,
    mail_flg: mailFlg,
    flow: null,
    step: null,
    rule: null,
  };
}
