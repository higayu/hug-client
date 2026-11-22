import {
  extractEnterButtonOnclick,
  extractExitButtonOnclick,
} from "../_shared/extractors.js";
import { isEnterMailEnabled, isLeaveMailEnabled } from "./mailDialog.js";
import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
  HUG_TIME_RE,
} from "./formHelpers.js";
import { buildRowItemFromColumns } from "./attendanceRowItem.js";

export { HUG_TIME_RE };

/** 入室 POST 可能 */
export function canPostEnter(column5Html) {
  const onclick = extractEnterButtonOnclick(column5Html);
  return Boolean(onclick && onclick.includes("sendEnterMail"));
}

/** 退室 POST 可能 */
export function canPostLeave(column6Html, enterTime) {
  const onclick = extractExitButtonOnclick(column6Html);
  return (
    Boolean(onclick && onclick.includes("sendLeaveMail")) &&
    HUG_TIME_RE.test(String(enterTime || "").trim())
  );
}

export function hasEnterMail(column5Html, children_id, children_name, dateStr) {
  const item = buildRowItemFromColumns({
    children_id,
    children_name,
    column5Html,
    dateStr,
  });
  return isEnterMailEnabled(item);
}

export function hasLeaveMail(column6Html, children_id, children_name, dateStr) {
  const item = buildRowItemFromColumns({
    children_id,
    children_name,
    column6Html,
    dateStr,
  });
  return isLeaveMailEnabled(item);
}

export function isAfternoonEnterBlocked(column5Html, children_id, dateStr) {
  const item = buildRowItemFromColumns({
    children_id,
    column5Html,
    dateStr,
  });
  return isAfternoonEnterHeldUntilHalfTime(
    item.hugAlertPref,
    getHalfTime(),
    new Date()
  );
}

export function buildEnterButtonTitle(column5Html, children_id, dateStr) {
  const item = buildRowItemFromColumns({ children_id, column5Html, dateStr });
  const parts = [];
  if (isEnterMailEnabled(item)) {
    parts.push("メール確認あり（is_mail=1）");
    parts.push("本番ボタンがあれば本番フローへ委譲");
  }
  parts.push("ajax_attendance.php へ POST（Cache）");
  if (
    isAfternoonEnterHeldUntilHalfTime(item.hugAlertPref, getHalfTime(), new Date())
  ) {
    parts.unshift(`午後枠：${getHalfTime()} まで入室不可`);
  }
  return parts.join(" / ");
}

export function buildLeaveButtonTitle(column6Html, children_id, dateStr) {
  const item = buildRowItemFromColumns({ children_id, column6Html, dateStr });
  const parts = [];
  if (isLeaveMailEnabled(item)) {
    parts.push("メール確認あり（is_mail=1）");
    parts.push("本番ボタンがあれば本番フローへ委譲");
  }
  parts.push("ajax_attendance.php へ POST（Cache）");
  return parts.join(" / ");
}
