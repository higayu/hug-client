SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';

START TRANSACTION;

-- professional_support_draft_save
INSERT INTO web_automation_flows_v2 (app_key,flow_key,name,description,entry_file,entry_export,engine_version,config_json,input_schema_json,output_schema_json,timeout_ms,version,status,published_at)
VALUES (CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci,CONVERT('professional_support_draft_save' USING utf8mb4) COLLATE utf8mb4_unicode_ci,'専門的支援 下書き/保存','HUGログイン済みWebViewで専門的支援を下書き/保存するV2 Flow。','index.js','default',1,'{"request":{"form_url":"https://www.hug-ayumu.link/hug/wm/record_proceedings.php?mode=edit","post_url":"https://www.hug-ayumu.link/hug/wm/record_proceedings.php","method":"POST","body_type":"form-data","credentials":"include","redirect":"follow"},"csrf":{"enabled":true,"fetch_method":"GET","selector":"#csrf_token_from_client","variable":"csrf"},"constants":{"professional_support_id":"55","mode":"regist","draft_flg":"{{saveMode}}","id":"insert","select_s_id":"","ap_flg":"0","ap_id":"0","mode_token":"edit","support_office_id":"0"},"body":{"mode":"regist","draft_flg":"{{saveMode}}","id":"insert","select_s_id":"","ap_flg":"0","ap_id":"0","mode_token":"edit","csrf_token_from_client":"{{csrf}}","adding_children_id":"55","title":"","c_id_list[{{childId}}][id]":"{{childId}}","c_id_list[{{childId}}][person_absence_note]":"","c_id_list[{{childId}}][f_id]":"{{facilityId}}","c_id_list[{{childId}}][s_id]":"1","recorder":"{{staffId}}","interview_date":"{{interviewDate}}","start_hour":"{{startHour}}","start_time":"{{startMinute}}","end_hour":"{{endHour}}","end_time":"{{endMinute}}","start_hour2":"","start_time2":"","end_hour2":"","end_time2":"","add_date":"","nursing_support_date":"","interview_staff[]":"{{staffId}}","ro_list[1][related_organizations]":"","ro_list[1][related_organizations_manager]":"","ro_list[2][related_organizations]":"","ro_list[2][related_organizations_manager]":"","support_office_id":"0","support_office_manager":"","customize[title][]":"{{safeTitle}}","customize[contents][]":"{{safeContents}}"},"response":{"parse":"html","error_selectors":[".js_data_err","p.err"],"failure_selector":"#form_id","success_when_form_absent":true}}','{"type":"object","required":["childId","facilityId","dateStr","staffId","contents"],"properties":{"childId":{"type":["string","number"]},"facilityId":{"type":["string","number"]},"dateStr":{"type":"string"},"startTime":{"type":"string"},"endTime":{"type":"string"},"staffId":{"type":["string","number"]},"title":{"type":"string"},"contents":{"type":"string"},"saveMode":{"type":"string"}}}',NULL,120000,1,'published',NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),entry_file=VALUES(entry_file),entry_export=VALUES(entry_export),engine_version=VALUES(engine_version),config_json=VALUES(config_json),input_schema_json=VALUES(input_schema_json),output_schema_json=VALUES(output_schema_json),timeout_ms=VALUES(timeout_ms),status='published',published_at=NOW(),updated_at=NOW();
SET @flow_id := (SELECT id FROM web_automation_flows_v2 WHERE app_key=CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND flow_key=CONVERT('professional_support_draft_save' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND version=1 LIMIT 1);
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active)
VALUES (@flow_id,'index.js','javascript','module.exports = async function execute({ input, helpers, config }) {
  const payload = input || {};

  if (!payload.childId) throw new Error("児童IDがありません");
  if (!payload.facilityId) throw new Error("施設IDがありません");
  if (!payload.dateStr) throw new Error("実施日がありません");
  if (!payload.staffId) throw new Error("記録者IDがありません");
  if (!String(payload.contents || "").trim()) {
    throw new Error("記録内容を入力してください");
  }

  const webviewFunction = async (CONFIG, PAYLOAD) => {
    const template = (value, context) => {
      if (typeof value !== "string") return value;
      return value.replace(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g, (_, key) => {
        const resolved = context[String(key || "").trim()];
        return resolved == null ? "" : String(resolved);
      });
    };

    const toJapaneseDate = (ymd) => {
      const m = String(ymd || "").match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})$/);
      if (!m) return String(ymd || "");
      return `${m[1]}年${String(m[2]).padStart(2, "0")}月${String(m[3]).padStart(2, "0")}日`;
    };

    const splitTime = (time) => {
      const m = String(time || "").match(/^(\\d{1,2}):(\\d{2})$/);
      if (!m) return { hour: "", minute: "" };
      return { hour: String(Number(m[1])), minute: String(m[2]) };
    };

    const resolveWaf = (value) => {
      let note = String(value ?? "");
      const words = ["and", "or", "where", "left", "join", "(", ")", "like"];
      for (const word of words) {
        const escaped = Array.from(String(word))
          .map((ch) => "^$.*+?()[]{}|".includes(ch) ? `\\\\${ch}` : ch)
          .join("");
        const re = new RegExp(escaped, "ig");
        const matches = note.match(re);
        if (!matches) continue;
        for (const matched of matches) {
          note = note.replace(matched + " ", "*-_-*" + matched + "*-_-* ");
          note = note.replace(" " + matched, " *-_-*" + matched + "*-_-*");
          note = note.replace(matched + "　", "*-_-*" + matched + "*-_-*　");
          note = note.replace("　" + matched, "　*-_-*" + matched + "*-_-*");
          note = note.replace(/"/g, "カンマ");
          note = note.replace(/”/g, "ゼカンマ");
          note = note.replace(/\\(/g, "カッコマエ");
          note = note.replace(/\\)/g, "カッコアト");
          note = note.replace(/（/g, "ゼカッコマエ");
          note = note.replace(/）/g, "ゼカッコアト");
        }
      }
      return note;
    };

    try {
      const requestConfig = CONFIG.request || {};
      const csrfConfig = CONFIG.csrf || {};
      const bodyConfig = CONFIG.body || {};
      const formUrl = requestConfig.form_url;
      const postUrl = requestConfig.post_url;

      if (!formUrl || !postUrl) {
        throw new Error("専門的支援POSTのURL設定が不足しています");
      }

      let csrf = "";
      if (csrfConfig.enabled !== false) {
        const formResponse = await fetch(formUrl, {
          method: csrfConfig.fetch_method || "GET",
          credentials: requestConfig.credentials || "include",
          cache: "no-store",
        });
        if (!formResponse.ok) {
          throw new Error("登録フォーム取得失敗 (" + formResponse.status + ")");
        }
        const formHtml = await formResponse.text();
        const formDoc = new DOMParser().parseFromString(formHtml, "text/html");
        csrf = formDoc.querySelector(csrfConfig.selector || "#csrf_token_from_client")?.value || "";
        if (!csrf) throw new Error("CSRFトークンを取得できませんでした");
      }

      const start = splitTime(PAYLOAD.startTime);
      const end = splitTime(PAYLOAD.endTime);
      const context = {
        ...PAYLOAD,
        csrf,
        interviewDate: toJapaneseDate(PAYLOAD.dateStr),
        startHour: start.hour,
        startMinute: start.minute,
        endHour: end.hour,
        endMinute: end.minute,
        safeTitle: resolveWaf(PAYLOAD.title || "記録"),
        safeContents: resolveWaf(PAYLOAD.contents || ""),
      };

      const body = new FormData();
      Object.entries(bodyConfig).forEach(([key, rawValue]) => {
        const resolvedKey = template(key, context);
        const resolvedValue = template(rawValue, context);
        body.append(
          resolvedKey,
          resolvedKey === "draft_flg"
            ? (PAYLOAD.saveMode || resolvedValue || "draft")
            : resolvedValue
        );
      });

      const postResponse = await fetch(postUrl, {
        method: requestConfig.method || "POST",
        body,
        credentials: requestConfig.credentials || "include",
        redirect: requestConfig.redirect || "follow",
      });
      const responseText = await postResponse.text();

      if (!postResponse.ok) {
        throw new Error(
          "専門的支援POST失敗 (" + postResponse.status + "): " +
          responseText.slice(0, 300)
        );
      }

      const resultDoc = new DOMParser().parseFromString(responseText, "text/html");
      const responseConfig = CONFIG.response || {};
      const errorSelectors = responseConfig.error_selectors || [".js_data_err", "p.err"];
      const errors = errorSelectors.flatMap((selector) =>
        Array.from(resultDoc.querySelectorAll(selector))
          .map((el) => String(el.textContent || "").replace(/\\s+/g, " ").trim())
          .filter(Boolean)
      );
      if (errors.length > 0) throw new Error(errors.slice(0, 3).join(" / "));

      const failureSelector = responseConfig.failure_selector || "#form_id";
      const formStillVisible = Boolean(resultDoc.querySelector(failureSelector));
      if (responseConfig.success_when_form_absent !== false && formStillVisible) {
        throw new Error("保存後も登録フォームが表示されました。入力内容を確認してください");
      }

      return {
        ok: true,
        saved: true,
        childId: String(PAYLOAD.childId),
        facilityId: String(PAYLOAD.facilityId),
        date: String(PAYLOAD.dateStr),
        finalUrl: postResponse.url,
        flowKey: "professional_support_draft_save",
      };
    } catch (error) {
      return {
        ok: false,
        saved: false,
        error: error?.message ? String(error.message) : String(error),
      };
    }
  };

  return helpers.executeFunctionInWebview({
    functionText: webviewFunction.toString(),
    args: [config || {}, payload],
  });
};
','commonjs',NULL,'9b1110ca6d2e330e31547458d00877fb88b5cf975f2901c3a38451e9d165cd35',1)
ON DUPLICATE KEY UPDATE source_text=VALUES(source_text),module_type=VALUES(module_type),content_hash=VALUES(content_hash),is_active=1,updated_at=NOW();

-- professional_support_use_days_check
INSERT INTO web_automation_flows_v2 (app_key,flow_key,name,description,entry_file,entry_export,engine_version,config_json,input_schema_json,output_schema_json,timeout_ms,version,status,published_at)
VALUES (CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci,CONVERT('professional_support_use_days_check' USING utf8mb4) COLLATE utf8mb4_unicode_ci,'専門的支援 保存済み件数確認','月初〜指定日までの専門的支援保存済み件数をHUGから取得するV2 Flow。','index.js','default',1,'{"request":{"url":"https://www.hug-ayumu.link/hug/wm/record_proceedings.php","form_method":"GET","method":"POST","credentials":"include","contentType":"application/x-www-form-urlencoded; charset=UTF-8"},"csrf":{"selector":"[name=\\"csrf_token_from_client\\"]"},"modeToken":{"selector":"[name=\\"mode_token\\"]","defaultValue":"nomode"},"formCheck":{"selector":"#form_id"},"constants":{"professional_support_id":"55"},"search":{"mode":"search","startDateField":"interview_date","endDateField":"interview_date_end","services":{"1":"放課後等デイサービス","2":"児童発達支援"}},"table":{"selector":"div.contents div.ibox div.mb40 table.table","headerSelector":"thead th","rowSelector":"tbody tr"},"response":{"parse":"html","returnRows":true}}','{"type":"object","required":["childId","interviewDate"],"properties":{"childId":{"type":["string","number"]},"facilityId":{"type":["string","number"]},"interviewDate":{"type":"string"}}}',NULL,60000,1,'published',NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),entry_file=VALUES(entry_file),entry_export=VALUES(entry_export),engine_version=VALUES(engine_version),config_json=VALUES(config_json),input_schema_json=VALUES(input_schema_json),output_schema_json=VALUES(output_schema_json),timeout_ms=VALUES(timeout_ms),status='published',published_at=NOW(),updated_at=NOW();
SET @flow_id := (SELECT id FROM web_automation_flows_v2 WHERE app_key=CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND flow_key=CONVERT('professional_support_use_days_check' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND version=1 LIMIT 1);
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active)
VALUES (@flow_id,'index.js','javascript','module.exports = async function execute({ input, helpers, config }) {
  const childId = String(input?.childId || "");
  const facilityId = String(input?.facilityId || "3");
  const interviewDate = String(input?.interviewDate || "");

  if (!childId) throw new Error("児童ID（childId）がありません");
  if (!interviewDate) throw new Error("面談日（interview_date）がありません");

  const webviewFunction = async (CONFIG, C_ID, F_ID, INTERVIEW_DATE_END_INPUT) => {
    const normalizeText = (el) =>
      (el?.textContent ?? "").replace(/\\s+/g, " ").trim();
    const pad2 = (value) => String(value).padStart(2, "0");
    const toJapaneseDate = (value) => {
      const text = String(value || "").trim();
      if (!text) return "";
      const jp = text.match(/^(\\d{4})年(\\d{1,2})月(\\d{1,2})日$/);
      if (jp) return jp[1] + "年" + pad2(jp[2]) + "月" + pad2(jp[3]) + "日";
      const ymd = text.match(/^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})$/);
      if (ymd) return ymd[1] + "年" + pad2(ymd[2]) + "月" + pad2(ymd[3]) + "日";
      return text;
    };
    const getMonthStartJapaneseDate = (dateText) => {
      const jpDate = toJapaneseDate(dateText);
      const match = jpDate.match(/^(\\d{4})年(\\d{1,2})月(\\d{1,2})日$/);
      if (!match) throw new Error("日付形式を解析できません: " + dateText);
      return match[1] + "年" + pad2(match[2]) + "月01日";
    };
    const extractRecordId = (onclick) => {
      const match = String(onclick || "").match(/[?&]id=(\\d+)/);
      return match ? match[1] : null;
    };
    const getCsrfToken = (doc) =>
      doc.querySelector(CONFIG.csrf?.selector || ''[name="csrf_token_from_client"]'')?.value?.trim() || "";
    const getModeToken = (doc) =>
      doc.querySelector(CONFIG.modeToken?.selector || ''[name="mode_token"]'')?.value?.trim() ||
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
','commonjs',NULL,'853a109f92f41f89c2b8840302786610144ae95741764a78300bd6f5342b24c0',1)
ON DUPLICATE KEY UPDATE source_text=VALUES(source_text),module_type=VALUES(module_type),content_hash=VALUES(content_hash),is_active=1,updated_at=NOW();

-- professional_support_plus_register
INSERT INTO web_automation_flows_v2 (app_key,flow_key,name,description,entry_file,entry_export,engine_version,config_json,input_schema_json,output_schema_json,timeout_ms,version,status,published_at)
VALUES (CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci,CONVERT('professional_support_plus_register' USING utf8mb4) COLLATE utf8mb4_unicode_ci,'専門＋ 登録','出席表の加算一覧から専門的支援実施加算を登録するV2 Flow。','index.js','default',1,'{"request":{"detail_url":"https://www.hug-ayumu.link/hug/wm/attendance.php","detail_method":"GET","post_url":"https://www.hug-ayumu.link/hug/wm/ajax/ajax_adding_contents_2024.php","post_method":"POST","credentials":"include","contentType":"application/x-www-form-urlencoded; charset=UTF-8","requestedWith":"XMLHttpRequest","detail_query":{"mode":"detail","f_id":"{{facilityId}}","date":"{{dateStr}}"}},"constants":{"professional_support_id":"55"},"selectors":{"tbody":"tbody[id^=''js_adding_list'']","childInput":"[name=\\"c_id\\"]","facilityInput":"[name=\\"f_id\\"]","hoikuInput":"[name=\\"hoiku_flg\\"]","registeredLabel":".js_adding_td b.green, .js_adding_td b"},"match":{"labelText":"専門的支援実施加算"}}','{"type":"object","required":["childId","facilityId","dateStr"],"properties":{"childId":{"type":["string","number"]},"facilityId":{"type":["string","number"]},"dateStr":{"type":"string"}}}',NULL,60000,1,'published',NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),entry_file=VALUES(entry_file),entry_export=VALUES(entry_export),engine_version=VALUES(engine_version),config_json=VALUES(config_json),input_schema_json=VALUES(input_schema_json),output_schema_json=VALUES(output_schema_json),timeout_ms=VALUES(timeout_ms),status='published',published_at=NOW(),updated_at=NOW();
SET @flow_id := (SELECT id FROM web_automation_flows_v2 WHERE app_key=CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND flow_key=CONVERT('professional_support_plus_register' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND version=1 LIMIT 1);
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active)
VALUES (@flow_id,'index.js','javascript','module.exports = async function execute({ input, helpers, config }) {
  const childId = String(input?.childId || "");
  const facilityId = String(input?.facilityId || "");
  const dateStr = String(input?.dateStr || "");
  if (!childId) throw new Error("児童が選択されていません");
  if (!dateStr) throw new Error("日付が指定されていません");
  if (!facilityId) throw new Error("施設が指定されていません");

  const webviewFunction = async (CONFIG, CHILD_ID, FACILITY_ID, DATE_STR) => {
    try {
      const professionalSupportId = CONFIG.constants?.professional_support_id || "55";
      const detailUrl = new URL(CONFIG.request.detail_url);
      const query = CONFIG.request.detail_query || {};
      detailUrl.searchParams.set("mode", query.mode || "detail");
      detailUrl.searchParams.set("f_id", FACILITY_ID);
      detailUrl.searchParams.set("date", DATE_STR);

      const detailResponse = await fetch(detailUrl.href, {
        method: CONFIG.request.detail_method || "GET",
        credentials: CONFIG.request.credentials || "include",
      });
      if (!detailResponse.ok) {
        throw new Error("加算一覧取得失敗 (" + detailResponse.status + ")");
      }

      const html = await detailResponse.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const selectors = CONFIG.selectors || {};
      const tbodies = Array.from(doc.querySelectorAll(selectors.tbody || "tbody[id^=''js_adding_list'']"));
      const targetTbody = tbodies.find((tbody) =>
        String(tbody.querySelector(selectors.childInput || ''[name="c_id"]'')?.value || "") === CHILD_ID
      );
      if (!targetTbody) {
        throw new Error("加算一覧に対象児童が見つかりません: childId=" + CHILD_ID);
      }

      const rowFacilityId = targetTbody.querySelector(selectors.facilityInput || ''[name="f_id"]'')?.value || "";
      const resolvedFacilityId = FACILITY_ID || rowFacilityId;
      const hoikuFlg = targetTbody.querySelector(selectors.hoikuInput || ''[name="hoiku_flg"]'')?.value || "";
      if (!resolvedFacilityId) throw new Error("対象児童の f_id を取得できません");

      const body = new URLSearchParams();
      body.append("adding[selected_content]", professionalSupportId);
      body.append("c_id", CHILD_ID);
      body.append("f_id", resolvedFacilityId);
      body.append("hoiku_flg", hoikuFlg);
      body.append("date", DATE_STR);
      body.append("mode", "regist");

      const postResponse = await fetch(CONFIG.request.post_url, {
        method: CONFIG.request.post_method || "POST",
        headers: {
          "Content-Type": CONFIG.request.contentType || "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": CONFIG.request.requestedWith || "XMLHttpRequest",
        },
        body: body.toString(),
        credentials: CONFIG.request.credentials || "include",
      });
      const responseText = await postResponse.text();
      if (!postResponse.ok) {
        throw new Error("専門的支援加算POST失敗 (" + postResponse.status + "): " + responseText.slice(0, 300));
      }
      return {
        ok: true,
        childId: CHILD_ID,
        facilityId: resolvedFacilityId,
        date: DATE_STR,
        selectedContent: professionalSupportId,
        responseText: responseText.slice(0, 500),
        flowKey: "professional_support_plus_register",
      };
    } catch (error) {
      return { ok: false, error: error?.message ? String(error.message) : String(error) };
    }
  };

  const result = await helpers.executeFunctionInWebview({
    functionText: webviewFunction.toString(),
    args: [config || {}, childId, facilityId, dateStr],
  });
  if (!result?.ok) throw new Error(result?.error || "専門的支援加算の登録に失敗しました");
  return result;
};
','commonjs',NULL,'f7f16e24d3f04df66718f4dbf56f71f8b52fab207a1d29d6ef113b425bb4ad6d',1)
ON DUPLICATE KEY UPDATE source_text=VALUES(source_text),module_type=VALUES(module_type),content_hash=VALUES(content_hash),is_active=1,updated_at=NOW();

-- professional_support_plus_registration_check
INSERT INTO web_automation_flows_v2 (app_key,flow_key,name,description,entry_file,entry_export,engine_version,config_json,input_schema_json,output_schema_json,timeout_ms,version,status,published_at)
VALUES (CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci,CONVERT('professional_support_plus_registration_check' USING utf8mb4) COLLATE utf8mb4_unicode_ci,'専門＋ 登録確認','出席表の加算一覧から専門的支援実施加算の登録状態を確認するV2 Flow。','index.js','default',1,'{"request":{"detail_url":"https://www.hug-ayumu.link/hug/wm/attendance.php","detail_method":"GET","post_url":"https://www.hug-ayumu.link/hug/wm/ajax/ajax_adding_contents_2024.php","post_method":"POST","credentials":"include","contentType":"application/x-www-form-urlencoded; charset=UTF-8","requestedWith":"XMLHttpRequest","detail_query":{"mode":"detail","f_id":"{{facilityId}}","date":"{{dateStr}}"}},"constants":{"professional_support_id":"55"},"selectors":{"tbody":"tbody[id^=''js_adding_list'']","childInput":"[name=\\"c_id\\"]","facilityInput":"[name=\\"f_id\\"]","hoikuInput":"[name=\\"hoiku_flg\\"]","registeredLabel":".js_adding_td b.green, .js_adding_td b"},"match":{"labelText":"専門的支援実施加算"}}','{"type":"object","required":["childId","facilityId","dateStr"],"properties":{"childId":{"type":["string","number"]},"facilityId":{"type":["string","number"]},"dateStr":{"type":"string"}}}',NULL,60000,1,'published',NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),entry_file=VALUES(entry_file),entry_export=VALUES(entry_export),engine_version=VALUES(engine_version),config_json=VALUES(config_json),input_schema_json=VALUES(input_schema_json),output_schema_json=VALUES(output_schema_json),timeout_ms=VALUES(timeout_ms),status='published',published_at=NOW(),updated_at=NOW();
SET @flow_id := (SELECT id FROM web_automation_flows_v2 WHERE app_key=CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND flow_key=CONVERT('professional_support_plus_registration_check' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND version=1 LIMIT 1);
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active)
VALUES (@flow_id,'index.js','javascript','module.exports = async function execute({ input, helpers, config }) {
  const childId = String(input?.childId || "");
  const facilityId = String(input?.facilityId || "");
  const dateStr = String(input?.dateStr || "");
  if (!childId) throw new Error("児童が選択されていません");
  if (!dateStr) throw new Error("日付が指定されていません");
  if (!facilityId) throw new Error("施設が指定されていません");

  const webviewFunction = async (CONFIG, CHILD_ID, FACILITY_ID, DATE_STR) => {
    try {
      const professionalSupportId = CONFIG.constants?.professional_support_id || "55";
      const detailUrl = new URL(CONFIG.request.detail_url);
      const query = CONFIG.request.detail_query || {};
      detailUrl.searchParams.set("mode", query.mode || "detail");
      detailUrl.searchParams.set("f_id", FACILITY_ID);
      detailUrl.searchParams.set("date", DATE_STR);

      const response = await fetch(detailUrl.href, {
        method: CONFIG.request.detail_method || "GET",
        credentials: CONFIG.request.credentials || "include",
      });
      if (!response.ok) throw new Error("出席表取得失敗 (" + response.status + ")");

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const selectors = CONFIG.selectors || {};
      const tbodies = Array.from(doc.querySelectorAll(selectors.tbody || "tbody[id^=''js_adding_list'']"));
      const targetTbody = tbodies.find((tbody) =>
        String(tbody.querySelector(selectors.childInput || ''[name="c_id"]'')?.value || "") === CHILD_ID
      );

      if (!targetTbody) {
        return {
          ok: true,
          registered: false,
          childFound: false,
          childId: CHILD_ID,
          date: DATE_STR,
          facilityId: FACILITY_ID,
          url: detailUrl.href,
          flowKey: "professional_support_plus_registration_check",
        };
      }

      const hiddenName = "adding[][" + professionalSupportId + "][id]";
      const registrationInput = Array.from(
        targetTbody.querySelectorAll(''input[type="hidden"][name]'')
      ).find((input) => input.getAttribute("name") === hiddenName);

      const registeredByHiddenId = Boolean(
        registrationInput && String(registrationInput.value || "").trim()
      );
      const registeredByLabel = Array.from(
        targetTbody.querySelectorAll(selectors.registeredLabel || ".js_adding_td b.green, .js_adding_td b")
      ).some((element) =>
        String(element.textContent || "")
          .replace(/\\s+/g, "")
          .includes(CONFIG.match?.labelText || "専門的支援実施加算")
      );

      return {
        ok: true,
        registered: registeredByHiddenId || registeredByLabel,
        childFound: true,
        childId: CHILD_ID,
        date: DATE_STR,
        facilityId: FACILITY_ID,
        registrationId: registrationInput?.value || null,
        url: detailUrl.href,
        flowKey: "professional_support_plus_registration_check",
      };
    } catch (error) {
      return {
        ok: false,
        registered: false,
        error: error?.message ? String(error.message) : String(error),
      };
    }
  };

  const result = await helpers.executeFunctionInWebview({
    functionText: webviewFunction.toString(),
    args: [config || {}, childId, facilityId, dateStr],
  });
  if (!result?.ok) throw new Error(result?.error || "専門＋の登録状態確認に失敗しました");
  return result;
};
','commonjs',NULL,'0e7782a61bef95b010a0e8eae2d33091b1729536167661178b0fb0fe3406ce45',1)
ON DUPLICATE KEY UPDATE source_text=VALUES(source_text),module_type=VALUES(module_type),content_hash=VALUES(content_hash),is_active=1,updated_at=NOW();

COMMIT;

SELECT f.id,f.flow_key,f.status,f.version,vf.file_path,vf.module_type,vf.content_hash FROM web_automation_flows_v2 f LEFT JOIN web_automation_files_v2 vf ON vf.flow_id=f.id AND vf.is_active=1 WHERE f.app_key=CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci AND f.flow_key IN ('professional_support_draft_save','professional_support_use_days_check','professional_support_plus_register','professional_support_plus_registration_check') ORDER BY f.flow_key;