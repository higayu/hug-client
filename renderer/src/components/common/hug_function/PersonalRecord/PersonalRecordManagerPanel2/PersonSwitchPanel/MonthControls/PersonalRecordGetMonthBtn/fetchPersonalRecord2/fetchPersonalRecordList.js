/**
 * アクティブ webview の HUG セッションで個人記録（contact_book）一覧を取得し、
 * 出席行の編集ページから活動内容（note）を読み取る。
 * （renderer の fetch では Cookie が付かないため webview 内で実行）
 *
 * Google拡張機能 test_個人記録のデータ取得（content.js + editpage.js）と同じ流れ。
 *
 * @param {Electron.WebviewTag} webview
 * @param {{
 *   childId: string,
 *   facilityId?: string,
 *   dateStart: string,
 *   dateEnd: string,
 *   onlyPresent?: boolean,
 * }} opts
 *   onlyPresent 既定 true … 出席行のみ note を取得
 * @returns {Promise<
 *   | {
 *       ok: true;
 *       listUrl: string;
 *       records: Array<{
 *         date: string;
 *         childName: string;
 *         attendance: string;
 *         editPath: string;
 *         note: string | null;
 *         noteError?: string;
 *         permissionError?: boolean;
 *       }>;
 *       rowCount: number;
 *       presentCount: number;
 *     }
 *   | { ok: false; error: string }
 * >}
 */
export async function fetchPersonalRecordList(webview, opts) {
  const {
    childId,
    facilityId = "3",
    dateStart,
    dateEnd,
    onlyPresent = true,
  } = opts || {};

  if (!webview) {
    return { ok: false, error: "webview がありません" };
  }
  if (!childId) {
    return { ok: false, error: "児童ID（childId）がありません" };
  }
  if (!dateStart || !dateEnd) {
    return { ok: false, error: "期間（dateStart / dateEnd）がありません" };
  }

  const script = `
    (async () => {
      const C_ID = ${JSON.stringify(String(childId))};
      const F_ID = ${JSON.stringify(String(facilityId))};
      const DATE_START = ${JSON.stringify(String(dateStart))};
      const DATE_END = ${JSON.stringify(String(dateEnd))};
      const ONLY_PRESENT = ${onlyPresent ? "true" : "false"};
      const HUG_WM_BASE_URL = "https://www.hug-ayumu.link/hug/wm/";
      const TABLE_SELECTOR =
        'table.table.lh1_5[data-api-url="contact_book.php"][data-concurrent-edit-target="ContactBook"]';

      const parseEditPath = (onclick) => {
        const match = String(onclick || "").match(/location\\.href='([^']+)'/);
        return match ? match[1] : "";
      };

      const isLoginPage = (doc, html) =>
        doc.querySelector('input[name="username"]') !== null ||
        (doc.title || "").includes("ログイン") ||
        String(html || "").includes("login.php");

      // HUG編集ページの権限不足メッセージを検出する
      const getPermissionErrorMessage = (doc) => {
        const cautionBox = doc.querySelector(".caution-box.print");
        if (!cautionBox) return null;

        const cautionTitle = cautionBox.querySelector("h4.caution-title");
        const text = (cautionTitle?.textContent || cautionBox.textContent || "").trim();

        if (
          text.includes("編集権限がありません") ||
          text.includes("権限がありません") ||
          text.includes("編集権限がない")
        ) {
          return text || "編集権限がありません";
        }

        return null;
      };

      const isPermissionErrorMessage = (message) => {
        const text = String(message || "");
        return (
          text.includes("編集権限") ||
          text.includes("権限がありません") ||
          text.includes("編集権限がない")
        );
      };

      const fetchContactBookNote = async (pathAndQuery) => {
        const editUrl = new URL(pathAndQuery, HUG_WM_BASE_URL).href;

        const response = await fetch(editUrl, {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("編集HTML取得エラー: " + response.status);
        }

        const html = await response.text();
        const editDoc = new DOMParser().parseFromString(html, "text/html");

        if (isLoginPage(editDoc, html)) {
          throw new Error(
            "ログインページが返されました。HUGへのログイン状態を確認してください"
          );
        }

        const permissionErrorMessage = getPermissionErrorMessage(editDoc);
        if (permissionErrorMessage) {
          console.warn("[HUG WM] 権限エラー検出:", permissionErrorMessage);
          throw new Error(permissionErrorMessage);
        }

        const textarea = editDoc.querySelector(
          'textarea[name="note"][data-field-key="note"]'
        );

        if (!textarea) {
          throw new Error("note の textarea が見つかりませんでした");
        }

        return (textarea.value || "").trim();
      };

      try {
        const listParams = new URLSearchParams({
          f_id: F_ID,
          date: DATE_START,
          date_end: DATE_END,
          id: C_ID
        });
        const listUrl = HUG_WM_BASE_URL + "contact_book.php?" + listParams.toString();

        console.log("[HUG WM] 個人記録 一覧 fetch開始:", listUrl);

        const listResponse = await fetch(listUrl, {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });

        if (!listResponse.ok) {
          throw new Error("一覧HTML取得エラー: " + listResponse.status);
        }

        const listHtml = await listResponse.text();
        const listDoc = new DOMParser().parseFromString(listHtml, "text/html");

        if (isLoginPage(listDoc, listHtml)) {
          throw new Error(
            "ログインページが返されました。HUGへのログイン状態を確認してください"
          );
        }

        const table = listDoc.querySelector(TABLE_SELECTOR);
        if (!table) {
          throw new Error("対象テーブルが見つかりませんでした");
        }

        const rows = [...table.querySelectorAll("tbody tr")];
        const editTargets = rows
          .map((row) => {
            const cells = row.querySelectorAll("td");
            const dateText = (cells[0]?.textContent || "").trim();
            const childName = (cells[1]?.textContent || "")
              .trim()
              .replace(/\\s+/g, " ");
            const attendanceText = (cells[4]?.textContent || "").trim();

            if (ONLY_PRESENT && attendanceText !== "出席") {
              return null;
            }

            const editButton = cells[7]?.querySelector("button.edit");
            const onclick = editButton?.getAttribute("onclick") || "";
            const editPath = parseEditPath(onclick);

            if (!editPath) {
              return null;
            }

            return {
              date: dateText,
              childName,
              attendance: attendanceText,
              editPath
            };
          })
          .filter(Boolean);

        console.log(
          "[HUG WM] 個人記録 出席レコード数:",
          editTargets.length,
          "/ 行数:",
          rows.length
        );

        const records = [];
        const permissionErrors = [];

        for (const item of editTargets) {
          try {
            const note = await fetchContactBookNote(item.editPath);
            records.push({
              date: item.date,
              childName: item.childName,
              attendance: item.attendance,
              editPath: item.editPath,
              note
            });
            console.log("[HUG WM] 活動内容 note:", {
              date: item.date,
              childName: item.childName,
              note
            });
          } catch (noteErr) {
            const noteError =
              noteErr && noteErr.message
                ? String(noteErr.message)
                : String(noteErr);
            const permissionError = isPermissionErrorMessage(noteError);

            const record = {
              date: item.date,
              childName: item.childName,
              attendance: item.attendance,
              editPath: item.editPath,
              note: null,
              noteError
            };

            if (permissionError) {
              record.permissionError = true;
              permissionErrors.push({
                date: item.date,
                childName: item.childName,
                message: noteError
              });
            }

            records.push(record);
            console.warn("[HUG WM] note取得エラー:", item.date, noteError);
          }
        }

        return {
          ok: true,
          listUrl,
          records,
          rowCount: rows.length,
          presentCount: editTargets.length,
          permissionErrors,
          hasPermissionError: permissionErrors.length > 0
        };
      } catch (error) {
        console.error("[HUG WM] 個人記録取得エラー:", error);
        return {
          ok: false,
          error: error && error.message ? String(error.message) : String(error)
        };
      }
    })()
  `;

  try {
    return await webview.executeJavaScript(script);
  } catch (e) {
    return {
      ok: false,
      error: e && e.message ? String(e.message) : String(e),
    };
  }
}
