/**
 * 拡張 content.js fetchAttendanceData / extractAttendanceDataFromHtml 相当
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";

/**
 * @param {Electron.WebviewTag} webview
 * @param {{ facilityId: string, dateStr: string }} opts
 */
export async function fetchAttendanceListInWebview(webview, opts) {
  const { facilityId, dateStr } = opts || {};
  if (!webview) return { ok: false, error: "webview がありません" };
  if (!facilityId || !dateStr) {
    return { ok: false, error: "施設IDまたは日付がありません" };
  }

  const script = `
    (async () => {
      const F_ID = ${JSON.stringify(String(facilityId))};
      const DATE_STR = ${JSON.stringify(String(dateStr))};
      const params = new URLSearchParams({
        mode: "detail",
        f_id: F_ID,
        date: DATE_STR
      });
      const TARGET_URL =
        "https://www.hug-ayumu.link/hug/wm/attendance.php?" + params.toString();

      const normalizeText = (el) =>
        (el && el.textContent ? el.textContent : "")
          .replace(/\\s+/g, " ")
          .trim();

      const extractRecordId = (onclick) => {
        const match = String(onclick || "").match(/[?&]id=(\\d+)/);
        return match ? match[1] : null;
      };

      const RE_SEND_ENTER_IS_MAIL =
        /sendEnterMail\\s*\\(\\s*['"]?[^'",)]+['"]?\\s*,\\s*([^,]+)/;
      const RE_SEND_LEAVE_IS_MAIL =
        /sendLeaveMail\\s*\\(\\s*['"]?[^'",)]+['"]?\\s*,\\s*([^,]+)/;

      const parseEnterIsMailFromOnclick = (enterOnclick) => {
        const m = String(enterOnclick || "").match(RE_SEND_ENTER_IS_MAIL);
        if (!m) return null;
        const n = Number(String(m[1]).trim());
        return Number.isNaN(n) ? null : n;
      };

      const parseEnterIsMailFromCidSetting = (enterTd) => {
        const raw = enterTd?.getAttribute?.("data-cidsetting");
        if (!raw) return null;
        try {
          const arr = JSON.parse(raw.replace(/&quot;/g, '"'));
          if (!Array.isArray(arr) || arr[0] == null || arr[0] === "") return null;
          return Number(String(arr[0]).trim());
        } catch {
          return null;
        }
      };

      const resolveEnterIsMail = (enterTd, enterOnclick) => {
        const fromOnclick = parseEnterIsMailFromOnclick(enterOnclick);
        if (fromOnclick != null) return fromOnclick;
        return parseEnterIsMailFromCidSetting(enterTd);
      };

      const parseLeaveIsMailFromOnclick = (leaveOnclick) => {
        const m = String(leaveOnclick || "").match(RE_SEND_LEAVE_IS_MAIL);
        if (!m) return null;
        const n = Number(String(m[1]).trim());
        return Number.isNaN(n) ? null : n;
      };

      const extractAbsenceFromEnterCell = (enterTd) => {
        if (!enterTd) return { isAbsenceStatus: false, absenceLabel: "" };
        const enterMailBtn = enterTd.querySelector(
          "button[onclick*='sendEnterMail']"
        );
        const enterTextNorm = enterTd.innerText.replace(/\\s+/g, " ").trim();
        const mentionsAbsence = enterTextNorm.includes("欠席");
        const isAbsenceStatus = mentionsAbsence && !enterMailBtn;
        return {
          isAbsenceStatus,
          absenceLabel: isAbsenceStatus ? enterTextNorm : ""
        };
      };

      const extractTime = (cell) => {
        if (!cell) return "";
        const text = cell.innerText.trim();
        const match = text.match(/\\b\\d{1,2}:\\d{2}\\b/);
        return match ? match[0] : "";
      };

      const extractListFromDoc = (doc) => {
        const listTable = doc.querySelector(
          "table.sortTable01:not(.sortTableAdding):not(.js_adding_table)"
        );
        if (!listTable) return [];

        const detailPageDate =
          doc.querySelector('input[name="date"]')?.value ||
          doc.querySelector('[name="date"]')?.value ||
          "";

        const attendanceList = [];

        listTable.querySelectorAll("tbody tr").forEach((tr, rowIndex) => {
          const link = tr.querySelector(
            ".realname a[href*='profile_children.php']"
          );
          const match = link?.getAttribute("href")?.match(/id=(\\d+)/);
          const c_id = match ? match[1] : "";
          const name = link ? normalizeText(link) : "";
          const ridMatch = tr.className.match(/children(\\d+)/);
          const r_id = ridMatch ? ridMatch[1] : "";

          const enterTd = tr.querySelector("td.enter");
          const leaveTd = tr.querySelector("td.leave");
          const enterTime = extractTime(enterTd);
          const leaveTime = extractTime(leaveTd);

          const enterBtn = enterTd?.querySelector(
            "button[onclick*='sendEnterMail']"
          );
          const enterOnclick = enterBtn?.getAttribute("onclick") ?? "";
          const leaveBtn = leaveTd?.querySelector(
            "button[onclick*='sendLeaveMail']"
          );
          const leaveOnclick = leaveBtn?.getAttribute("onclick") ?? "";

          const { isAbsenceStatus, absenceLabel } =
            extractAbsenceFromEnterCell(enterTd);

          const enterIsMailResolved = resolveEnterIsMail(enterTd, enterOnclick);
          const leaveIsMail = parseLeaveIsMailFromOnclick(leaveOnclick);

          attendanceList.push({
            rowIndex,
            r_id,
            c_id,
            name,
            enterTime,
            leaveTime,
            enterOnclick,
            leaveOnclick,
            enterIsMailResolved,
            isEnterMailEnabled: enterIsMailResolved === 1,
            leaveIsMail,
            detailPageDate,
            isAbsenceStatus,
            absenceLabel
          });
        });

        return attendanceList;
      };

      try {
        const response = await fetch(TARGET_URL, {
          method: "GET",
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error("HTTP error: " + response.status);
        }
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const rows = extractListFromDoc(doc);
        return { ok: true, rows, detailPageDate: rows[0]?.detailPageDate || "" };
      } catch (e) {
        return {
          ok: false,
          error: e && e.message ? String(e.message) : String(e),
          rows: []
        };
      }
    })()
  `;

  try {
    return await webview.executeJavaScript(script);
  } catch (e) {
    return { ok: false, error: e?.message ? String(e.message) : String(e), rows: [] };
  }
}

/**
 * Cache で一覧を取得し児童IDの行を返す
 */
export async function fetchAttendanceRowByChildId({
  facilityId,
  dateStr,
  childId,
}) {
  const webview = await getHugWebviewForCache();
  const result = await fetchAttendanceListInWebview(webview, {
    facilityId,
    dateStr,
  });

  if (!result.ok) {
    return { ok: false, error: result.error, item: null };
  }

  const item =
    (result.rows || []).find((r) => String(r.c_id) === String(childId)) ||
    null;

  if (!item) {
    return { ok: false, error: "出席一覧に児童が見つかりません", item: null };
  }

  return { ok: true, item, webview };
}
