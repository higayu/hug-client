// renderer/src/utils/ToDayChildrenList/attendancePageHandler.js
import { fetchAndExtractAttendanceData } from "@/store/slices/attendanceSlice.js";
/**
 * 利用者ページからテーブルを抽出し、Redux・AppState・Electronに保存する関数
 */
export async function handleAttendancePageLoad({
  newWebview,
  targetUrl,
  facility_id,
  date_str,
  dispatch,
  updateAppState,
  showInfoToast,
}) {
  void 0;
  try {
    const selector = "table";
    let result;

    try {
      const selectorStr = JSON.stringify(selector);

      result = await newWebview.executeJavaScript(`
        (function() {
          try {
            var selector = ${selectorStr};
            var table = null;

            try {
              table = document.querySelector(selector);
            } catch (e) {
              console.warn("⚠️ [ATTENDANCE] セレクターエラー:", e.message);
            }

            if (!table) table = document.querySelector("table");
            if (!table) {
              var tables = document.querySelectorAll("table");
              if (tables.length > 0) table = tables[0];
            }

            if (!table) {
              return {
                success: false,
                error: "テーブルが見つかりません",
                html: null,
                pageTitle: document.title || "",
                pageUrl: window.location.href || "",
                debugInfo: {
                  bodyHTMLLength: document.body ? document.body.innerHTML.length : 0,
                  allElementsCount: document.querySelectorAll('*').length,
                  readyState: document.readyState
                }
              };
            }

            var rows = table.querySelectorAll("tr");
            var htmlString = table.outerHTML;
            return {
              success: true,
              html: htmlString,
              className: table.className || "",
              rowCount: rows.length,
              pageTitle: document.title || "",
              pageUrl: window.location.href || "",
              htmlSize: htmlString.length
            };
          } catch (error) {
            return {
              success: false,
              error: "JavaScript実行エラー: " + (error.message || String(error)),
              html: null,
              pageTitle: document.title || "不明",
              pageUrl: window.location.href || "不明",
              debugInfo: {
                errorName: error.name || "",
                errorMessage: error.message || String(error),
                readyState: document.readyState || ""
              }
            };
          }
        })();
      `);
    } catch (jsError) {
      console.error("❌ [ATTENDANCE] executeJavaScript実行エラー:", jsError);
      throw new Error(`JavaScript実行エラー: ${jsError.message}`);
    }

    // === Reduxで取得＋抽出 ===
    if (result?.success && result.html) {
      const reduxResult = await dispatch(
        fetchAndExtractAttendanceData({
          facility_id,
          date_str,
          options: { html: result.html },
        })
      );

      if (!fetchAndExtractAttendanceData.fulfilled.match(reduxResult)) {
        throw new Error(reduxResult.payload || reduxResult.error || "不明なエラー");
      }

      const { tableData, extractedData } = reduxResult.payload;
      void 0;

      // === appStateへ保存 ===
      if (extractedData) {
        const attendanceData = {
          facilityId: facility_id,
          dateStr: date_str,
          extractedAt: new Date().toISOString(),
          rowCount: extractedData.rowCount,
          data: extractedData.data,
        };

        updateAppState({ attendanceData });
        if (window.AppState) window.AppState.attendanceData = attendanceData;

        // === Electron側へJsonファイルの保存（任意） ===
        // if (window.electronAPI?.saveAttendanceColumnData) {
        //   await window.electronAPI.saveAttendanceColumnData({
        //     facilityId: facility_id,
        //     dateStr: date_str,
        //     extractedData: extractedData.data,
        //   });
        // }

        showInfoToast(`✅ 利用者データを抽出・保存しました。\n行数: ${attendanceData.rowCount || "不明"}`);
      } else {
        showInfoToast("⚠️ データ抽出に失敗しました（テーブルは取得済み）");
      }
    } else {
      showInfoToast(`⚠️ 取得失敗: ${result?.error || "不明なエラー"}`);
    }
  } catch (error) {
    console.error("❌ 利用者データ取得エラー:", error);
    showInfoToast(`❌ エラー: ${error.message}`);
  }
}
