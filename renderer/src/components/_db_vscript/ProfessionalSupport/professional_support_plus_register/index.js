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
      const tbodies = Array.from(doc.querySelectorAll(selectors.tbody || "tbody[id^='js_adding_list']"));
      const targetTbody = tbodies.find((tbody) =>
        String(tbody.querySelector(selectors.childInput || '[name="c_id"]')?.value || "") === CHILD_ID
      );
      if (!targetTbody) {
        throw new Error("加算一覧に対象児童が見つかりません: childId=" + CHILD_ID);
      }

      const rowFacilityId = targetTbody.querySelector(selectors.facilityInput || '[name="f_id"]')?.value || "";
      const resolvedFacilityId = FACILITY_ID || rowFacilityId;
      const hoikuFlg = targetTbody.querySelector(selectors.hoikuInput || '[name="hoiku_flg"]')?.value || "";
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
