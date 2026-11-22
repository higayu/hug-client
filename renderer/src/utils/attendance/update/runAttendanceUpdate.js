/**
 * 拡張 timer.js runAttendanceUpdate 相当（利用者一覧の再取得）
 */

import { fetchAttendanceViaHugTab } from "@/utils/attendance/fetchAttendanceViaHugTab";
import { extractColumnData } from "@/utils/attendance/attendanceTable";
import {
  setExtractedData,
  setTableData,
} from "@/store/slices/attendanceSlice.js";

/**
 * @param {{
 *   facilityId: string,
 *   dateStr: string,
 *   dispatch: Function,
 *   updateAppState?: Function,
 *   silent?: boolean,
 * }} opts
 */
export async function runAttendanceUpdate({
  facilityId,
  dateStr,
  dispatch,
  updateAppState,
  silent = true,
}) {
  const result = await fetchAttendanceViaHugTab({ facilityId, dateStr });

  if (!result.ok) {
    throw new Error(result.error || "利用者一覧の更新に失敗しました");
  }

  const extracted = await extractColumnData(result.html);

  const tableData = {
    success: true,
    html: result.html,
    rowCount: result.rowCount,
    pageTitle: result.pageTitle,
    pageUrl: result.pageUrl,
    facility_id: facilityId,
    date_str: dateStr,
  };

  dispatch(setTableData(tableData));

  if (extracted?.success) {
    dispatch(setExtractedData(extracted));

    if (updateAppState) {
      updateAppState({
        attendanceData: {
          facilityId,
          dateStr,
          extractedAt: new Date().toISOString(),
          rowCount: extracted.rowCount,
          data: extracted.data,
        },
      });
      if (typeof window !== "undefined" && window.AppState) {
        window.AppState.attendanceData = {
          facilityId,
          dateStr,
          extractedAt: new Date().toISOString(),
          rowCount: extracted.rowCount,
          data: extracted.data,
        };
      }
    }
  }

  if (!silent) {
    console.log("[ATTENDANCE] runAttendanceUpdate 完了", {
      rowCount: extracted?.rowCount,
    });
  }

  return { tableData, extracted };
}
