/**
 * 拡張 timer.js runAttendanceUpdate 相当（利用者一覧の再取得）
 *
 * HUG側のメール通知モーダルで選択ボタンを押した直後は、
 * HUG本体のAjax/DB更新がまだ完了していない場合がある。
 * そのためメール通知ありの入退室後は、対象児童の更新結果が
 * 実際に取得HTMLへ反映されるまで短時間リトライできるようにする。
 */

import { fetchAttendanceViaHugTab } from "../fetchAttendanceViaHugTab";
import { extractColumnData } from "../attendanceTable";
import {
  setExtractedData,
  setTableData,
} from "@/store/slices/attendanceSlice.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TIME_RE = /^\d{1,2}:\d{2}$/;

function findTargetRow(extracted, targetChildrenId) {
  if (!targetChildrenId || !Array.isArray(extracted?.data)) return null;
  return (
    extracted.data.find(
      (row) => String(row?.children_id || "") === String(targetChildrenId),
    ) || null
  );
}

function isAttendanceActionReflected(row, action) {
  if (!row) return false;

  if (action === "enter") {
    const text = String(row.column5 || "").trim();
    const html = String(row.column5Html || "");
    return TIME_RE.test(text) || !html.includes("sendEnterMail");
  }

  if (action === "leave") {
    const text = String(row.column6 || "").trim();
    const html = String(row.column6Html || "");
    return TIME_RE.test(text) || (Boolean(row.column6Html) && !html.includes("sendLeaveMail"));
  }

  return true;
}

/**
 * @param {{
 *   facilityId: string,
 *   dateStr: string,
 *   dispatch: Function,
 *   updateAppState?: Function,
 *   silent?: boolean,
 *   targetChildrenId?: string|number,
 *   action?: "enter"|"leave"|string,
 *   verifyUpdated?: boolean,
 *   retryCount?: number,
 *   retryDelayMs?: number,
 * }} opts
 */
export async function runAttendanceUpdate({
  facilityId,
  dateStr,
  dispatch,
  updateAppState,
  silent = true,
  targetChildrenId = null,
  action = "",
  verifyUpdated = false,
  retryCount = 5,
  retryDelayMs = 500,
}) {
  const maxAttempts = verifyUpdated ? Math.max(1, Number(retryCount) || 1) : 1;
  let lastResult = null;
  let lastExtracted = null;
  let reflected = !verifyUpdated;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await fetchAttendanceViaHugTab({ facilityId, dateStr });
    lastResult = result;

    if (!result.ok) {
      if (attempt >= maxAttempts) {
        throw new Error(result.error || "利用者一覧の更新に失敗しました");
      }
      await sleep(retryDelayMs);
      continue;
    }

    const extracted = await extractColumnData(result.html);
    lastExtracted = extracted;

    if (!verifyUpdated) {
      reflected = true;
      break;
    }

    const targetRow = findTargetRow(extracted, targetChildrenId);
    reflected = isAttendanceActionReflected(targetRow, action);

    if (!silent) {
      console.log("[ATTENDANCE] 更新反映確認", {
        attempt,
        maxAttempts,
        targetChildrenId,
        action,
        reflected,
        column5: targetRow?.column5,
        column6: targetRow?.column6,
      });
    }

    if (reflected) break;

    if (attempt < maxAttempts) {
      await sleep(retryDelayMs);
    }
  }

  if (!lastResult?.ok) {
    throw new Error(lastResult?.error || "利用者一覧の更新に失敗しました");
  }

  if (verifyUpdated && !reflected) {
    throw new Error(
      `HUG側の${action === "leave" ? "退室" : "入室"}更新が利用者一覧へ反映されるまで確認できませんでした`,
    );
  }

  const extracted = lastExtracted;
  const tableData = {
    success: true,
    html: lastResult.html,
    rowCount: lastResult.rowCount,
    pageTitle: lastResult.pageTitle,
    pageUrl: lastResult.pageUrl,
    facility_id: facilityId,
    date_str: dateStr,
  };

  dispatch(setTableData(tableData));

  if (extracted?.success) {
    dispatch(setExtractedData(extracted));

    if (updateAppState) {
      const attendanceData = {
        facilityId,
        dateStr,
        extractedAt: new Date().toISOString(),
        rowCount: extracted.rowCount,
        data: extracted.data,
      };

      updateAppState({ attendanceData });

      if (typeof window !== "undefined" && window.AppState) {
        window.AppState.attendanceData = attendanceData;
      }
    }
  }

  if (!silent) {
    console.log("[ATTENDANCE] runAttendanceUpdate 完了", {
      rowCount: extracted?.rowCount,
      reflected,
    });
  }

  return { tableData, extracted, reflected };
}
