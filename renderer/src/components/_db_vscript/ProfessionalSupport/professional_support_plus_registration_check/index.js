module.exports = async function execute({ input, helpers, config }) {
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
      const tbodies = Array.from(doc.querySelectorAll(selectors.tbody || "tbody[id^='js_adding_list']"));
      const targetTbody = tbodies.find((tbody) =>
        String(tbody.querySelector(selectors.childInput || '[name="c_id"]')?.value || "") === CHILD_ID
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
        targetTbody.querySelectorAll('input[type="hidden"][name]')
      ).find((input) => input.getAttribute("name") === hiddenName);

      const registeredByHiddenId = Boolean(
        registrationInput && String(registrationInput.value || "").trim()
      );
      const registeredByLabel = Array.from(
        targetTbody.querySelectorAll(selectors.registeredLabel || ".js_adding_td b.green, .js_adding_td b")
      ).some((element) =>
        String(element.textContent || "")
          .replace(/\s+/g, "")
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
