module.exports = async function execute({ input, helpers, config }) {
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
      return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
        const resolved = context[String(key || "").trim()];
        return resolved == null ? "" : String(resolved);
      });
    };

    const toJapaneseDate = (ymd) => {
      const m = String(ymd || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (!m) return String(ymd || "");
      return `${m[1]}年${String(m[2]).padStart(2, "0")}月${String(m[3]).padStart(2, "0")}日`;
    };

    const splitTime = (time) => {
      const m = String(time || "").match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return { hour: "", minute: "" };
      return { hour: String(Number(m[1])), minute: String(m[2]) };
    };

    const resolveWaf = (value) => {
      let note = String(value ?? "");
      const words = ["and", "or", "where", "left", "join", "(", ")", "like"];
      for (const word of words) {
        const escaped = Array.from(String(word))
          .map((ch) => "^$.*+?()[]{}|".includes(ch) ? `\\${ch}` : ch)
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
          note = note.replace(/\(/g, "カッコマエ");
          note = note.replace(/\)/g, "カッコアト");
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
          .map((el) => String(el.textContent || "").replace(/\s+/g, " ").trim())
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
