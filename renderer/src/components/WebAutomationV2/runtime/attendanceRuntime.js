import store from "@/store/store.js";
import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { extractColumnData } from "@/components/common/hug_function/AttendanceAction/attendance/attendanceTable/index.js";
import { setExtractedData, setTableData } from "@/store/slices/attendanceSlice";
import { loadAttendanceDetailInWebview } from "@/components/common/hug_function/AttendanceAction/attendance/_shared/webview.js";
import { fetchAttendanceRowByChildId } from "@/components/common/hug_function/AttendanceAction/attendance/fetch/fetchAttendanceListInWebview.js";

function unwrapHtml(value) {
  if (typeof value === "string") return value;
  return value?.html || value?.value || "";
}

async function extractAttendanceRecordId({ config, context }) {
  const childId = String(config.childId || context.childId || context.childrenId || "");
  if (!childId) throw new Error("attendance-record-id: childIdがありません");

  const state = store.getState().appState || {};
  const facilityId = String(config.facilityId || context.facilityId || state.FACILITY_ID || "1");
  const dateStr = String(config.dateStr || context.dateStr || state.CURRENT_YMD || "");
  const fetched = await fetchAttendanceRowByChildId({ facilityId, dateStr, childId });
  if (!fetched?.ok || !fetched?.item) throw new Error(fetched?.error || "attendance recordの取得に失敗しました");

  const recordId = fetched.item.r_id || fetched.item.hug_record_id;
  if (!recordId) throw new Error(`attendance record idが見つかりません: childId=${childId}`);
  return String(recordId);
}


async function executeAttendanceAbsence({ config, context, runtime }) {
  const webview = await runtime.resolveWebview(config.webviewKey || "hug-automation-webview");
  const column5Html = String(context.column5Html || context.html || context.absenceHtml || "");
  const targetChildId = String(context.childId || context.childrenId || "");

  const doc = new DOMParser().parseFromString(`<div>${column5Html}</div>`, "text/html");
  const prefixes = Array.isArray(config.idPrefixes) && config.idPrefixes.length
    ? config.idPrefixes
    : ["absence_", "absense_"];
  const el = Array.from(doc.querySelectorAll("[id]")).find((node) =>
    prefixes.some((prefix) => String(node.id || "").startsWith(prefix))
  );
  const absenceId = el?.id || "";
  if (!absenceId) throw new Error("欠席ボタンID(absence_...)を抽出できませんでした");

  const parts = absenceId.split(config.separator || "_");
  const childPartIndex = Number(config.parts?.childId ?? 2);
  if (config.validateChildId !== false && targetChildId && String(parts[childPartIndex] || "") !== targetChildId) {
    throw new Error(`欠席ボタンの児童IDが一致しません: expected=${targetChildId}, actual=${parts[childPartIndex] || ""}`);
  }

  const dialog = config.dialog || {};
  const result = await webview.executeJavaScript(`
    (async () => {
      const id = ${JSON.stringify(absenceId)};
      const button = document.getElementById(id);
      if (!button) return { success:false, error:'欠席ボタンが見つかりません: ' + id };
      button.click();
      const startedAt = Date.now();
      const timeoutMs = ${JSON.stringify(Number(dialog.timeoutMs || 2000))};
      const pollIntervalMs = ${JSON.stringify(Number(dialog.pollIntervalMs || 100))};
      const dialogId = ${JSON.stringify(dialog.id || 'addtend_dialog')};
      const wrapperSelector = ${JSON.stringify(dialog.wrapperSelector || '.ui-dialog')};
      while (Date.now() - startedAt < timeoutMs) {
        const target = document.getElementById(dialogId);
        const wrapper = target ? target.closest(wrapperSelector) : null;
        if (wrapper && getComputedStyle(wrapper).display !== 'none') {
          return { success:true, absenceId:id, pageUrl:location.href };
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
      return { success:false, error:dialogId + ' が開きませんでした', absenceId:id, pageUrl:location.href };
    })()
  `);
  if (!result?.success) throw new Error(result?.error || "欠席処理に失敗しました");
  return result;
}

async function verifyAttendanceUpdated({ config, context }) {
  const childId = String(config.childId || context.childId || "");
  const action = String(
    config.action ||
    (String(context.flowKey || "").includes("leave") ? "leave" :
      String(context.flowKey || "").includes("enter") ? "enter" : "")
  );
  const state = store.getState().appState || {};
  const facilityId = String(config.facilityId || context.facilityId || state.FACILITY_ID || "1");
  const dateStr = String(config.dateStr || context.dateStr || state.CURRENT_YMD || "");
  if (!childId) throw new Error("verify: childIdがありません");

  const fetched = await fetchAttendanceRowByChildId({ facilityId, dateStr, childId });
  if (!fetched?.ok || !fetched?.item) return { success: false, error: fetched?.error || "対象行の再取得に失敗しました" };

  const item = fetched.item;
  const timePattern = /^\d{1,2}:\d{2}$/;
  if (action === "enter") {
    const ok = timePattern.test(String(item.column5 || "").trim());
    return { success: ok, item, error: ok ? null : "入室時刻への更新を確認できません" };
  }
  if (action === "leave") {
    const ok = timePattern.test(String(item.column6 || "").trim());
    return { success: ok, item, error: ok ? null : "退室時刻への更新を確認できません" };
  }
  return { success: true, item };
}

export function createAttendanceRuntime({ dispatch = store.dispatch, updateAppState, waitForUserChoice } = {}) {
  return {
    appKey: "hug-banso-navi",
    engineVersion: 1,

    resolveWebview: async (webviewKey) => {
      if (!webviewKey || webviewKey === "hug-automation-webview" || webviewKey === "hugview") {
        return getHugWebviewForCache();
      }
      return document.getElementById(webviewKey) || getHugWebviewForCache();
    },

    reloadWebview: async (webview, targetUrl, config, context = {}) => {
      if (String(targetUrl || "").includes("attendance.php")) {
        const state = store.getState().appState || {};
        const facilityId = config.facilityId || context.facilityId || state.FACILITY_ID || "1";
        const dateStr = config.dateStr || context.dateStr || state.CURRENT_YMD;
        await loadAttendanceDetailInWebview(webview, facilityId, dateStr);
        return { success: true, pageUrl: webview.getURL?.() || targetUrl || "" };
      }
      if (targetUrl) webview.src = targetUrl;
      else webview.reload?.();
      return { success: true, pageUrl: targetUrl || webview.getURL?.() || "" };
    },

    parsers: {
      "html-table": async ({ config, context }) => {
        const sourceKey = config.sourceKey || config.inputKey || "attendanceHtml";
        const html = unwrapHtml(context[sourceKey]);
        const parser = new DOMParser();
        const doc = parser.parseFromString(String(html || ""), "text/html");
        const selector =
          config.selector ||
          "table.sortTable01:not(.sortTableAdding):not(.js_adding_table)";
        const table = doc.querySelector(selector) || doc.querySelector("table");
        if (!table) throw new Error(`出席表が見つかりません: ${selector}`);
        const result = await extractColumnData(table.outerHTML);
        if (!result?.success) throw new Error(result?.error || "出席表パースに失敗しました");
        return result.data;
      },
      "attendance-table": async ({ config, context }) => {
        const sourceKey = config.sourceKey || config.inputKey || "attendanceHtml";
        const html = unwrapHtml(context[sourceKey]);
        const parser = new DOMParser();
        const doc = parser.parseFromString(String(html || ""), "text/html");
        const selector =
          config.selector ||
          "table.sortTable01:not(.sortTableAdding):not(.js_adding_table)";
        const table = doc.querySelector(selector) || doc.querySelector("table");
        if (!table) throw new Error(`出席表が見つかりません: ${selector}`);
        const result = await extractColumnData(table.outerHTML);
        if (!result?.success) throw new Error(result?.error || "出席表パースに失敗しました");
        return result.data;
      },
    },

    extractors: {
      "attendance-record-id": extractAttendanceRecordId,
      "attendance-absence": executeAttendanceAbsence,
    },

    verifiers: {
      "attendance-cell-updated": verifyAttendanceUpdated,
      "attendance-refetch-until-updated": verifyAttendanceUpdated,
    },

    dispatchers: {
      "attendance-today-users": async ({ config, context }) => {
        const rows = config.value ?? context.attendanceRows ?? [];
        const html = unwrapHtml(context.attendanceHtml);
        const state = store.getState().appState || {};
        const facilityId = context.facilityId || state.FACILITY_ID || "1";
        const dateStr = context.dateStr || state.CURRENT_YMD;

        const extracted = { success: true, data: rows, rowCount: Array.isArray(rows) ? rows.length : 0 };
        dispatch(setExtractedData(extracted));
        dispatch(setTableData({
          success: true,
          html,
          rowCount: extracted.rowCount,
          facility_id: facilityId,
          date_str: dateStr,
        }));

        const attendanceData = {
          facilityId,
          dateStr,
          extractedAt: new Date().toISOString(),
          rowCount: extracted.rowCount,
          data: rows,
        };
        updateAppState?.({ attendanceData });
        if (window.AppState) window.AppState.attendanceData = attendanceData;
        return attendanceData;
      },
    },

    waitForUserChoice,
  };
}
