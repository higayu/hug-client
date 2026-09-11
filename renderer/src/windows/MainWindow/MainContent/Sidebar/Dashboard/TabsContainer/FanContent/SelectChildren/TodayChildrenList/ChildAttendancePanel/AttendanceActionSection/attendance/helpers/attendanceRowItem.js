/**
 * サイドバー列データ + 拡張一覧行をマージして perform*Action 用 item を組み立てる
 */

import { formatYmdToHugInterviewDate } from "@/utils/professionalSupport/formatInterviewDate.js";
import {
  extractEnterButtonOnclick,
  extractExitButtonOnclick,
} from "../_shared/extractors.js";
import { parseEnterOnclick } from "../post/enterPost.js";
import { argsFromLeaveButton } from "../post/leavePost.js";
import { HUG_TIME_RE } from "./formHelpers.js";
import { fetchAttendanceRowByChildId } from "../fetch/fetchAttendanceListInWebview.js";

function parseEnterIsMailFromHtml(column5Html) {
  const onclick = extractEnterButtonOnclick(column5Html);
  if (onclick) {
    try {
      return parseEnterOnclick(onclick).is_mail;
    } catch {
      /* fallthrough */
    }
  }
  const raw = String(column5Html || "");
  const attr = raw.match(/data-cidsetting\s*=\s*"([^"]+)"/i)?.[1];
  if (!attr) return null;
  try {
    const arr = JSON.parse(attr.replace(/&quot;/g, '"'));
    if (!Array.isArray(arr) || arr[0] == null) return null;
    return Number(arr[0]);
  } catch {
    return null;
  }
}

function extractRIdFromRowClass(html) {
  const m = String(html || "").match(/children(\d+)/);
  return m ? m[1] : "";
}

/**
 * 列データのみから item を組み立て（一覧取得失敗時のフォールバック）
 */
export function buildRowItemFromColumns({
  children_id,
  children_name,
  column5,
  column5Html,
  column6,
  column6Html,
  dateStr,
}) {
  const enterOnclick = extractEnterButtonOnclick(column5Html) || "";
  const leaveOnclick = extractExitButtonOnclick(column6Html) || "";
  const detailPageDate = formatYmdToHugInterviewDate(dateStr) || "";

  let r_id = "";
  let enterIsMailResolved = parseEnterIsMailFromHtml(column5Html);
  if (enterOnclick) {
    try {
      const p = parseEnterOnclick(enterOnclick);
      r_id = p.r_id;
      enterIsMailResolved = p.is_mail;
    } catch {
      /* ignore */
    }
  }

  const enterTime = HUG_TIME_RE.test(String(column5 || "").trim())
    ? String(column5).trim()
    : "";
  const leaveTime = HUG_TIME_RE.test(String(column6 || "").trim())
    ? String(column6).trim()
    : "";

  const enterTextNorm = String(column5 || "").replace(/\s+/g, " ").trim();
  const hasEnterBtn = enterOnclick.includes("sendEnterMail");
  const isAbsenceStatus =
    enterTextNorm.includes("欠席") && !hasEnterBtn;

  let leaveIsMail = null;
  if (leaveOnclick) {
    try {
      leaveIsMail = argsFromLeaveButton(leaveOnclick).is_mail;
    } catch {
      /* ignore */
    }
  }

  return {
    c_id: String(children_id),
    name: children_name || "",
    r_id: r_id || extractRIdFromRowClass(column5Html),
    enterOnclick,
    leaveOnclick,
    enterTime,
    leaveTime,
    detailPageDate,
    enterIsMailResolved,
    isEnterMailEnabled: enterIsMailResolved === 1,
    leaveIsMail,
    isAbsenceStatus,
    absenceLabel: isAbsenceStatus ? enterTextNorm : "",
    hugAlertPref: { amPmFlag: 0, alertType: 1, alertAfterMinutes: 120 },
  };
}

/**
 * 拡張 content.js の行を優先し、列 HTML で onclick を補完
 */
export function mergeFetchedRowWithColumns(fetchedItem, columnData) {
  const {
    column5,
    column5Html,
    column6,
    column6Html,
    children_name,
  } = columnData;

  const fallback = buildRowItemFromColumns({
    children_id: fetchedItem.c_id,
    children_name: fetchedItem.name || children_name,
    column5,
    column5Html,
    column6,
    column6Html,
    dateStr: null,
  });

  return {
    ...fallback,
    ...fetchedItem,
    name: fetchedItem.name || children_name || fallback.name,
    enterOnclick: fetchedItem.enterOnclick || fallback.enterOnclick,
    leaveOnclick: fetchedItem.leaveOnclick || fallback.leaveOnclick,
    enterTime: fetchedItem.enterTime || fallback.enterTime,
    leaveTime: fetchedItem.leaveTime || fallback.leaveTime,
    detailPageDate: fetchedItem.detailPageDate || fallback.detailPageDate,
    enterIsMailResolved:
      fetchedItem.enterIsMailResolved ?? fallback.enterIsMailResolved,
    isEnterMailEnabled:
      fetchedItem.isEnterMailEnabled ?? fallback.isEnterMailEnabled,
    leaveIsMail: fetchedItem.leaveIsMail ?? fallback.leaveIsMail,
    isAbsenceStatus:
      fetchedItem.isAbsenceStatus ?? fallback.isAbsenceStatus,
    absenceLabel: fetchedItem.absenceLabel || fallback.absenceLabel,
    c_id: String(fetchedItem.c_id),
  };
}

/**
 * 入退室 action 用の item を解決（一覧 fetch → マージ）
 */
export async function resolveAttendanceRowItem({
  facilityId,
  dateStr,
  children_id,
  children_name,
  column5,
  column5Html,
  column6,
  column6Html,
}) {
  const columnData = {
    column5,
    column5Html,
    column6,
    column6Html,
    children_name,
  };

  const fetched = await fetchAttendanceRowByChildId({
    facilityId,
    dateStr,
    childId: children_id,
  });

  if (fetched.ok && fetched.item) {
    return {
      ok: true,
      item: mergeFetchedRowWithColumns(fetched.item, columnData),
      webview: fetched.webview,
    };
  }

  console.warn(
    "[ATTENDANCE] 一覧 fetch 失敗、列データで item を組み立て:",
    fetched.error
  );

  return {
    ok: true,
    item: buildRowItemFromColumns({
      children_id,
      children_name,
      column5,
      column5Html,
      column6,
      column6Html,
      dateStr,
    }),
    webview: null,
  };
}
