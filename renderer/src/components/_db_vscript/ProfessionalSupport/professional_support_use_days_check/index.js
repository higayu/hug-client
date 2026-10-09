module.exports = async function execute({ input, helpers, config }) {
  const childId = String(input?.childId || "");
  const facilityId = String(input?.facilityId || "3");
  const interviewDate = String(input?.interviewDate || "");

  if (!childId) throw new Error("児童ID（childId）がありません");
  if (!interviewDate) throw new Error("面談日（interview_date）がありません");

  const webviewFunction = async (CONFIG, C_ID, F_ID, INTERVIEW_DATE_END_INPUT) => {
    const normalizeText = (el) =>
      (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    const pad2 = (value) => String(value).padStart(2, "0");
    const toJapaneseDate = (value) => {
      const text = String(value || "").trim();
      if (!text) return "";
      const jp = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
      if (jp) return jp[1] + "年" + pad2(jp[2]) + "月" + pad2(jp[3]) + "日";
      const ymd = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (ymd) return ymd[1] + "年" + pad2(ymd[2]) + "月" + pad2(ymd[3]) + "日";
      return text;
    };
    const getMonthStartJapaneseDate = (dateText) => {
      const jpDate = toJapaneseDate(dateText);
      const match = jpDate.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
      if (!match) throw new Error("日付形式を解析できません: " + dateText);
      return match[1] + "年" + pad2(match[2]) + "月01日";
    };
    const extractRecordId = (onclick) => {
      const match = String(onclick || "").match(/[?&]id=(\d+)/);
      return match ? match[1] : null;
    };
    const getCsrfToken = (doc) =>
      doc.querySelector(CONFIG.csrf?.selector || '[name="csrf_token_from_client"]')?.value?.trim() || "";
    const getModeToken = (doc) =>
      doc.querySelector(CONFIG.modeToken?.selector || '[name="mode_token"]')?.value?.trim() ||
      CONFIG.modeToken?.defaultValue || "nomode";

    const fetchSearchFormDoc = async () => {
      const response = await fetch(CONFIG.request.url, {
        method: CONFIG.request.form_method || "GET",
        credentials: CONFIG.request.credentials || "include",
        cache: "no-store",
      });
      const html = await response.text();
      if (!response.ok) throw new Error("検索フォーム取得 HTTP error: " + response.status);
      const doc = new DOMParser().parseFromString(html, "text/html");
      if (!doc.querySelector(CONFIG.formCheck?.selector || "#form_id") && !getCsrfToken(doc)) {
        throw new Error("検索フォームが取得できません。HUGへのログイン状態を確認してください");
      }
      return doc;
    };

    const buildSearchParams = (doc, start, end) => {
      const csrf = getCsrfToken(doc);
      if (!csrf) throw new Error("csrf_token_from_client が取得できません");
      const params = new URLSearchParams();
      const search = CONFIG.search || {};
      params.set("mode", search.mode || "search");
      params.set("mode_token", getModeToken(doc));
      params.set("csrf_token_from_client", csrf);
      params.set("f_ary[" + F_ID + "]", F_ID);
      params.set("c_id", C_ID);
      params.append("search", "");
      params.set(search.startDateField || "interview_date", start);
      params.set(search.endDateField || "interview_date_end", end);
      Object.entries(search.services || {1:"放課後等デイサービス",2:"児童発達支援"})
        .forEach(([key, value]) => params.set("s_ary[" + key + "]", value));
      params.set("adding_children_id", CONFIG.constants?.professional_support_id || "55");
      params.set("recorder", "");
      return params;
    };

    const parseResultTable = (doc) => {
      const table = doc.querySelector(CONFIG.table?.selector || "div.contents div.ibox div.mb40 table.table");
      if (!table) return { table: null, headers: [], rows: [] };
      const headers = [...table.querySelectorAll(CONFIG.table?.headerSelector || "thead th")]
        .map((th) => normalizeText(th));
      const rows = [...table.querySelectorAll(CONFIG.table?.rowSelector || "tbody tr")]
        .map((tr) => {
          const cells = [...tr.querySelectorAll("td")];
          const detailOnclick = cells[0]?.querySelector("[onclick]")?.getAttribute("onclick") || "";
          const statusEl = cells[7]?.querySelector(".label");
          return {
            recordId: extractRecordId(detailOnclick),
            childName: normalizeText(cells[1]),
            additionName: normalizeText(cells[2]),
            facilityName: normalizeText(cells[3]),
            service: normalizeText(cells[4]),
            recorder: normalizeText(cells[5]),
            interviewDate: normalizeText(cells[6]),
            status: statusEl?.textContent?.trim() || normalizeText(cells[7]),
            signed: normalizeText(cells[8]),
            lastUpdated: normalizeText(cells[9]),
          };
        })
        .filter((row) => row.recordId || Object.values(row).some((v) => String(v || "").trim() !== ""));
      return { table, headers, rows };
    };

    try {
      const interviewDateEnd = toJapaneseDate(INTERVIEW_DATE_END_INPUT);
      const interviewDateStart = getMonthStartJapaneseDate(interviewDateEnd);
      const formDoc = await fetchSearchFormDoc();
      const body = buildSearchParams(formDoc, interviewDateStart, interviewDateEnd);
      const response = await fetch(CONFIG.request.url, {
        method: CONFIG.request.method || "POST",
        credentials: CONFIG.request.credentials || "include",
        headers: {
          "Content-Type": CONFIG.request.contentType || "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body.toString(),
      });
      const html = await response.text();
      if (!response.ok) throw new Error("検索POST HTTP error: " + response.status);
      const resultDoc = new DOMParser().parseFromString(html, "text/html");
      const { table, headers, rows } = parseResultTable(resultDoc);
      if (!table) return { ok: false, error: "検索結果テーブルが見つかりません" };
      const days = rows.length;
      return {
        ok: true,
        cId: C_ID,
        interview_date: interviewDateStart,
        interview_date_end: interviewDateEnd,
        s_id: "",
        f_id: F_ID,
        days,
        label: "利用日数：" + days + "日",
        rows,
        headers,
        flowKey: "professional_support_use_days_check",
      };
    } catch (error) {
      return { ok: false, error: error?.message ? String(error.message) : String(error) };
    }
  };

  return helpers.executeFunctionInWebview({
    functionText: webviewFunction.toString(),
    args: [config || {}, childId, facilityId, interviewDate],
  });
};
