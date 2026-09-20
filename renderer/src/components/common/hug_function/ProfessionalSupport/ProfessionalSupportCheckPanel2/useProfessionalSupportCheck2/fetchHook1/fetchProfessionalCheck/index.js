/**
 * アクティブ webview の HUG セッションで
 * 「専門的支援実施加算」の月初〜指定日までの保存済み件数を取得する。
 *
 * renderer の fetch では Cookie が付かないため webview 内で実行する。
 *
 * @param {Electron.WebviewTag} webview
 * @param {{ childId: string, facilityId?: string, interviewDate?: string }} opts
 * @returns {Promise<
 *   | {
 *       ok: true;
 *       cId: string;
 *       interview_date: string;
 *       interview_date_end: string;
 *       s_id: string;
 *       f_id: string;
 *       days: number;
 *       label: string;
 *       rows: object[];
 *     }
 *   | { ok: false; error: string }
 * >}
 */
export async function fetchProfessionalSupportUseDaysInWebview(webview, opts) {
  const { childId, facilityId = "3", interviewDate = "" } = opts || {};

  if (!webview) {
    return { ok: false, error: "webview がありません" };
  }

  if (!childId) {
    return { ok: false, error: "児童ID（childId）がありません" };
  }

  if (!interviewDate) {
    return { ok: false, error: "面談日（interview_date）がありません" };
  }
  
  const interviewDateEndForLog = String(interviewDate || "")
  const interviewDateStartForLog = interviewDateEndForLog.slice(0, 8) + "01"

  console.log('始め日', interviewDateStartForLog)
  console.log('終わり日', interviewDateEndForLog)

  const script = `
    (async () => {
      const C_ID = ${JSON.stringify(String(childId))};
      const F_ID = ${JSON.stringify(String(facilityId))};
      const INTERVIEW_DATE_END_INPUT = ${JSON.stringify(String(interviewDate || ""))};

      const ADDING_CHILDREN_ID = "55";
      const RECORD_PROCEEDINGS_URL =
        "https://www.hug-ayumu.link/hug/wm/record_proceedings.php";

      const TABLE_SELECTOR =
        "div.contents div.ibox div.mb40 table.table";

      const normalizeText = (el) =>
        (el?.textContent ?? "").replace(/\\s+/g, " ").trim();

      const pad2 = (value) => String(value).padStart(2, "0");

      const toJapaneseDate = (value) => {
        const text = String(value || "").trim();

        if (!text) return "";

        const jp = text.match(/^(\\d{4})年(\\d{1,2})月(\\d{1,2})日$/);
        if (jp) {
          return jp[1] + "年" + pad2(jp[2]) + "月" + pad2(jp[3]) + "日";
        }

        const ymd = text.match(/^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})$/);
        if (ymd) {
          return ymd[1] + "年" + pad2(ymd[2]) + "月" + pad2(ymd[3]) + "日";
        }

        return text;
      };

      const getMonthStartJapaneseDate = (dateText) => {
        const jpDate = toJapaneseDate(dateText);
        const match = jpDate.match(/^(\\d{4})年(\\d{1,2})月(\\d{1,2})日$/);

        if (!match) {
          throw new Error("日付形式を解析できません: " + dateText);
        }

        return match[1] + "年" + pad2(match[2]) + "月01日";
      };

      const extractRecordId = (onclick) => {
        const match = String(onclick || "").match(/[?&]id=(\\d+)/);
        return match ? match[1] : null;
      };

      const getCsrfToken = (doc) =>
        doc.querySelector('[name="csrf_token_from_client"]')?.value?.trim() || "";

      const getModeToken = (doc) =>
        doc.querySelector('[name="mode_token"]')?.value?.trim() || "nomode";

      const fetchSearchFormDoc = async () => {
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

      const buildSearchParams = (doc, interviewDateStart, interviewDateEnd) => {
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

        params.set("interview_date", interviewDateStart);
        params.set("interview_date_end", interviewDateEnd);

        params.set("s_ary[1]", "放課後等デイサービス");
        params.set("s_ary[2]", "児童発達支援");

        params.set("adding_children_id", ADDING_CHILDREN_ID);
        params.set("recorder", "");

        return params;
      };

      const isMeaningfulRow = (row) => {
        if (row.recordId) return true;

        return [
          row.childName,
          row.additionName,
          row.facilityName,
          row.service,
          row.recorder,
          row.interviewDate,
          row.status,
          row.signed,
          row.lastUpdated
        ].some((v) => String(v || "").trim() !== "");
      };

      const parseResultTable = (doc) => {
        const table = doc.querySelector(TABLE_SELECTOR);

        if (!table) {
          return {
            table: null,
            headers: [],
            rows: []
          };
        }

        const headers = [...table.querySelectorAll("thead th")].map((th) =>
          normalizeText(th)
        );

        const rows = [...table.querySelectorAll("tbody tr")]
          .map((tr) => {
            const cells = [...tr.querySelectorAll("td")];

            const detailOnclick =
              cells[0]?.querySelector("[onclick]")?.getAttribute("onclick") ||
              "";

            const statusEl = cells[7]?.querySelector(".label");

            return {
              recordId: extractRecordId(detailOnclick),
              childName: normalizeText(cells[1]),
              additionName: normalizeText(cells[2]),
              facilityName: normalizeText(cells[3]),
              service: normalizeText(cells[4]),
              recorder: normalizeText(cells[5]),
              interviewDate: normalizeText(cells[6]),
              status:
                statusEl?.textContent?.trim() || normalizeText(cells[7]),
              signed: normalizeText(cells[8]),
              lastUpdated: normalizeText(cells[9])
            };
          })
          .filter(isMeaningfulRow);

        return {
          table,
          headers,
          rows
        };
      };

      try {
        const interviewDateEnd = toJapaneseDate(INTERVIEW_DATE_END_INPUT);
        const interviewDateStart = getMonthStartJapaneseDate(interviewDateEnd);

        const formDoc = await fetchSearchFormDoc();
        const body = buildSearchParams(
          formDoc,
          interviewDateStart,
          interviewDateEnd
        );

        console.log("[HUG WM] 専門的支援 保存済み件数確認");
        console.log("[HUG WM] POST検索 URL:", RECORD_PROCEEDINGS_URL);
        console.log("[HUG WM] POST payload:", Object.fromEntries(body));

        const response = await fetch(RECORD_PROCEEDINGS_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: body.toString()
        });

        const html = await response.text();

        if (!response.ok) {
          throw new Error("検索POST HTTP error: " + response.status);
        }

        const resultDoc = new DOMParser().parseFromString(html, "text/html");
        const { table, headers, rows } = parseResultTable(resultDoc);

        if (!table) {
          console.warn("[HUG WM] 結果テーブルが見つかりません");
          console.log("[HUG WM] レスポンス先頭:", html.slice(0, 500));

          return {
            ok: false,
            error: "検索結果テーブルが見つかりません"
          };
        }

        const days = rows.length;

        console.log("[HUG WM] テーブル列:", headers);
        console.log("[HUG WM] 児童ID:", C_ID);
        console.log(
          "[HUG WM] 実施日:",
          interviewDateStart,
          "〜",
          interviewDateEnd
        );
        console.log("[HUG WM] 施設ID:", F_ID);
        console.log("[HUG WM] 専門的支援 保存済み件数:", days, "件");

        if (rows.length > 0) {
          console.table(rows);
        }

        return {
          ok: true,
          cId: C_ID,
          interview_date: interviewDateStart,
          interview_date_end: interviewDateEnd,
          s_id: "",
          f_id: F_ID,
          days,
          label: "利用日数：" + days + "日",
          rows
        };
      } catch (error) {
        console.error("[HUG WM] 利用日数取得エラー:", error);

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
      error: e && e.message ? String(e.message) : String(e)
    };
  }
}