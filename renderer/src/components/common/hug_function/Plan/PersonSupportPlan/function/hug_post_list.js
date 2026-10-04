const LIST_URL = "https://www.hug-ayumu.link/hug/wm/individual_situation.php";
const FACILITY_FIELDS = Object.fromEntries(
  Array.from({ length: 8 }, (_, index) => [index + 1, `f_ary[${index + 1}]`])
);

async function postViaWebview(webview, postData) {
  const formBody = Object.entries(postData)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  const script = `
    (async () => {
      const res = await fetch(${JSON.stringify(LIST_URL)}, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: ${JSON.stringify(formBody)},
        credentials: "include",
        cache: "no-store",
      });
      return { ok: res.ok, status: res.status, text: await res.text() };
    })()
  `;
  return webview.executeJavaScript(script);
}

export async function fetchFirstPersonSupportPlanId({ webview, facilityId, selectChild }) {
  const facilityField = FACILITY_FIELDS[facilityId];
  if (!facilityField) throw new Error(`無効な施設IDです: ${facilityId}`);
  if (!selectChild) throw new Error("子供が選択されていません");

  const result = await postViaWebview(webview, {
    [facilityField]: String(facilityId),
    c_id: String(selectChild),
    indivisual_format: "careplanmain",
    state: "1",
    mode: "search",
  });
  if (!result.ok) throw new Error(`一覧HTML取得エラー: ${result.status}`);

  const document = new DOMParser().parseFromString(result.text, "text/html");
  const link = document.querySelector(
    "body > div.contents > div.individualSituation.mb10.scrollX > table > tbody > tr:nth-child(1) > td.por > a"
  );
  if (!link) throw new Error("一覧の先頭行に個別支援計画書のリンクが見つかりません");

  const href = link.getAttribute("href");
  const id = href
    ? new URL(href, "https://www.hug-ayumu.link/hug/wm/").searchParams.get("id")
    : null;
  if (!id) throw new Error("個別支援計画書のIDを取得できませんでした");

  return id;
}
