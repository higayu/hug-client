/**
 * webview 内で record_proceedings.php を POST 検索し、
 * 専門的支援実施加算の保存済み一覧を取得する。
 *
 * @param {Electron.WebviewTag} webview
 * @param {{
 *   childId: string,
 *   facilityId?: string,
 *   interviewDate: string,
 *   interviewDateEnd?: string,
 * }} opts
 * @returns {Promise<
 *   | { ok: true; rowCount: number; rows: object[]; registered: boolean }
 *   | { ok: false; error: string }
 * >}
 */
export async function fetchProfessionalSupportSavedRecordsInWebview(
  webview,
  opts
) {
  const {
    childId,
    facilityId = "3",
    interviewDate,
    interviewDateEnd = interviewDate,
  } = opts || {};

  if (!webview) {
    return { ok: false, error: "webview がありません" };
  }
  if (!childId) {
    return { ok: false, error: "児童ID（childId）がありません" };
  }
  if (!interviewDate) {
    return { ok: false, error: "実施日（interviewDate）がありません" };
  }

  const script = `
    (async () => {
      const C_ID = ${JSON.stringify(String(childId))};
      const F_ID = ${JSON.stringify(String(facilityId))};
      const INTERVIEW_DATE = ${JSON.stringify(String(interviewDate))};
      const INTERVIEW_DATE_END = ${JSON.stringify(String(interviewDateEnd))};
      const ADDING_CHILDREN_ID = "55";
      const RECORD_PROCEEDINGS_URL =
        "https://www.hug-ayumu.link/hug/wm/record_proceedings.php";
      const TABLE_SELECTOR =
        "div.contents div.ibox div.mb40 table.table";

      const normalizeText = (el) =>
        (el && el.textContent ? el.textContent : "")
          .replace(/\\s+/g, " ")
          .trim();

      const extractRecordId = (onclick) => {
        const match = String(onclick || "").match(/[?&]id=(\\d+)/);
        return match ? match[1] : null;
      };

      const getCsrfToken = (doc) => {
        const el = doc.querySelector('[name="csrf_token_from_client"]');
        return el && el.value ? el.value.trim() : "";
      };

      const getModeToken = (doc) => {
        const el = doc.querySelector('[name="mode_token"]');
        return (el && el.value ? el.value.trim() : "") || "nomode";
      };

      const fetchSearchFormDoc = async () => {
        false && ("[HUG WM] 保存済み確認 GET URL:", RECORD_PROCEEDINGS_URL);
        const response = await fetch(RECORD_PROCEEDINGS_URL, {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const html = await response.text();
        if (!response.ok) {
          throw new Error("検索フォーム取得 HTTP error: " + response.status);
        }
        const doc = new DOMParser().parseFromString(html, "text/html");
        if (!doc.querySelector("#form_id") && !getCsrfToken(doc)) {
          throw new Error(
            "検索フォームが取得できません。HUGへのログイン状態を確認してください"
          );
        }
        return doc;
      };

      const buildSearchParams = (doc) => {
        const csrf = getCsrfToken(doc);
        if (!csrf) {
          throw new Error("csrf_token_from_client が取得できません");
        }
        const params = new URLSearchParams();
        params.set("mode", "search");
        params.set("mode_token", getModeToken(doc));
        params.set("csrf_token_from_client", csrf);
        params.set("f_ary[" + F_ID + "]", F_ID);
        params.set("c_id", C_ID);
        params.append("search", "");
        params.set("interview_date", INTERVIEW_DATE);
        params.set("interview_date_end", INTERVIEW_DATE_END);
        params.set("s_ary[1]", "放課後等デイサービス");
        params.set("s_ary[2]", "児童発達支援");
        params.set("adding_children_id", ADDING_CHILDREN_ID);
        params.set("recorder", "");
        return params;
      };

      const isMeaningfulRow = (row) => {
        if (row.recordId) return true;
        const keys = [
          "childName",
          "additionName",
          "facilityName",
          "service",
          "recorder",
          "interviewDate",
          "status",
          "signed",
          "lastUpdated",
        ];
        return keys.some((k) => String(row[k] || "").trim() !== "");
      };

      const parseResultTable = (doc) => {
        const table = doc.querySelector(TABLE_SELECTOR);
        if (!table) return { rows: [] };

        const rows = [...table.querySelectorAll("tbody tr")].map((tr) => {
            const cells = [...tr.querySelectorAll("td")];
            const detailOnclick =
              (cells[0] &&
                cells[0].querySelector("[onclick]") &&
                cells[0]
                  .querySelector("[onclick]")
                  .getAttribute("onclick")) ||
              "";
            const statusEl =
              cells[7] && cells[7].querySelector(".label");
            return {
              recordId: extractRecordId(detailOnclick),
              childName: normalizeText(cells[1]),
              additionName: normalizeText(cells[2]),
              facilityName: normalizeText(cells[3]),
              service: normalizeText(cells[4]),
              recorder: normalizeText(cells[5]),
              interviewDate: normalizeText(cells[6]),
              status:
                (statusEl && statusEl.textContent
                  ? statusEl.textContent.trim()
                  : "") || normalizeText(cells[7]),
              signed: normalizeText(cells[8]),
              lastUpdated: normalizeText(cells[9])
            };
          });

        return { rows: rows.filter(isMeaningfulRow) };
      };

      try {
        const formDoc = await fetchSearchFormDoc();
        const body = buildSearchParams(formDoc);

        false && ("[HUG WM] 保存済み確認 POST URL:", RECORD_PROCEEDINGS_URL);
        false && (
          "[HUG WM] 保存済み確認 POST params:",
          Object.fromEntries(body)
        );

        const response = await fetch(RECORD_PROCEEDINGS_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: body.toString()
        });

        const html = await response.text();
        if (!response.ok) {
          throw new Error("検索POST HTTP error: " + response.status);
        }

        const resultDoc = new DOMParser().parseFromString(html, "text/html");
        const { rows } = parseResultTable(resultDoc);
        const rowCount = rows.length;
        const registered = rowCount > 0;

        false && (
          "[HUG WM] 保存済み確認:",
          registered ? "保存済み" : "保存なし",
          "(" + rowCount + "件)"
        );
        if (rowCount > 0) {
          console.table(rows);
        }

        return { ok: true, rowCount, rows, registered };
      } catch (error) {
        console.error("[HUG WM] 保存済み確認エラー:", error);
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
      error: e?.message ? String(e.message) : String(e),
    };
  }
}
