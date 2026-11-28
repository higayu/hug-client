/**
 * アクティブ webview の HUG セッションで「専門的支援実施加算」の利用日数を取得する。
 * （renderer の fetch では Cookie が付かないため webview 内で実行）
 *
 * @param {Electron.WebviewTag} webview
 * @param {{ childId: string, facilityId?: string, interviewDate?: string }} opts
 *   interviewDate 指定時はフォームHTMLのGETを省略（ページ遷移不要）
 * @returns {Promise<
 *   | { ok: true; cId: string; interview_date: string; s_id: string; f_id: string; days: number; label: string }
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

  const script = `
    (async () => {
      const C_ID = ${JSON.stringify(String(childId))};
      const DEFAULT_F_ID = ${JSON.stringify(String(facilityId))};
      const INTERVIEW_DATE = ${JSON.stringify(String(interviewDate || ""))};
      const ADDING_CHILDREN_ID = "55";
      const RECORD_PROCEEDINGS_URL = "https://www.hug-ayumu.link/hug/wm/record_proceedings.php";
      const AJAX_URL = "https://www.hug-ayumu.link/hug/wm/ajax/ajax_record_proceedings.php";

      const parseUseDaysNumber = (text) => {
        if (!text) return null;
        const match = String(text).match(/利用日数[：:]\\s*(\\d+)\\s*日/);
        return match ? Number(match[1]) : null;
      };

      const postAjax = async (params, label) => {
        const body = new URLSearchParams(params);
        const response = await fetch(AJAX_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: body.toString()
        });
        const text = await response.text();
        if (!response.ok) {
          throw new Error(label + " HTTP error: " + response.status);
        }
        if (!text.trim()) {
          throw new Error(label + " が空レスポンスです");
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error(label + " JSON解析失敗: " + text.slice(0, 300));
        }
      };

      const parseCountParamsFromChildrenInfo = (html, interview_date, f_id) => {
        if (!html) return null;
        const infoDoc = new DOMParser().parseFromString(
          "<div>" + html + "</div>",
          "text/html"
        );
        const s_id = infoDoc.querySelector(".js_c_s_id")?.value || "";
        if (!s_id || !f_id) return null;
        return {
          c_id: String(C_ID),
          s_id: String(s_id),
          f_id: String(f_id),
          interview_date
        };
      };

      const parseFidFromFacilityDom = (html) => {
        if (!html) return "";
        const facilityDoc = new DOMParser().parseFromString(html, "text/html");
        const selected = facilityDoc.querySelector("option[selected]");
        if (selected && selected.value) return selected.value;
        const first = facilityDoc.querySelector("option");
        return first && first.value ? first.value : "";
      };

      const fetchCountParamsViaGetData = async (interview_date, rp_id) => {
        if (!interview_date) {
          throw new Error("面談日がありません");
        }

        const getDataParams = {
          mode: "getData",
          rp_id: rp_id || "insert",
          change_type: "children",
          interview_date: interview_date,
          adding_children_id: ADDING_CHILDREN_ID
        };
        getDataParams["c_id_list[" + C_ID + "]"] = C_ID;
        getDataParams["f_id_list[" + C_ID + "]"] = DEFAULT_F_ID;

        const data = await postAjax(getDataParams, "getData");

        const f_id =
          parseFidFromFacilityDom(
            data.facility_dom && data.facility_dom[C_ID]
          ) || DEFAULT_F_ID;

        const fromInfo = parseCountParamsFromChildrenInfo(
          data.children_info && data.children_info[C_ID],
          interview_date,
          f_id
        );

        if (fromInfo) return fromInfo;

        if (!data.children_array || !data.children_array[C_ID]) {
          throw new Error(
            "児童ID " + C_ID + " は面談日・専門的支援の条件で選択できません"
          );
        }

        throw new Error("getData から s_id を取得できませんでした");
      };

      const fetchUseDays = async (countParams) => {
        const data = await postAjax(
          {
            mode: "getcount",
            c_id: countParams.c_id,
            s_id: countParams.s_id,
            f_id_list: countParams.f_id,
            interview_date: countParams.interview_date
          },
          "getcount"
        );

        const days = parseUseDaysNumber(data.use_days);

        if (days === null) {
          throw new Error("利用日数の解析に失敗: " + data.use_days);
        }

        return { days: days, label: data.use_days };
      };

      try {
        let countParams;

        if (INTERVIEW_DATE) {
          false && ("[HUG WM] リクエストのみ取得（面談日:", INTERVIEW_DATE, ")");
          countParams = await fetchCountParamsViaGetData(INTERVIEW_DATE, "insert");
        } else {
          const formUrl =
            RECORD_PROCEEDINGS_URL +
            "?mode=edit&select_child=" +
            encodeURIComponent(C_ID);

          const formResponse = await fetch(formUrl, {
            method: "GET",
            credentials: "include",
            cache: "no-store"
          });

          if (!formResponse.ok) {
            throw new Error("フォーム取得 HTTP error: " + formResponse.status);
          }

          const html = await formResponse.text();
          const doc = new DOMParser().parseFromString(html, "text/html");

          if (!doc.querySelector("#form_id")) {
            throw new Error(
              "登録フォームが取得できません。HUGへのログイン状態を確認してください"
            );
          }

          if (!doc.querySelector('.js_c_list option[value="' + C_ID + '"]')) {
            throw new Error("児童ID " + C_ID + " が児童一覧に存在しません");
          }

          const interviewEl = doc.querySelector("[name=interview_date]");
          const interview_date =
            (interviewEl && interviewEl.value && interviewEl.value.trim()) || "";
          const idEl = doc.querySelector("[name=id]");
          const rp_id = (idEl && idEl.value) || "insert";

          countParams = await fetchCountParamsViaGetData(interview_date, rp_id);
        }

        const useDays = await fetchUseDays(countParams);

        false && ("[HUG WM] 専門的支援 利用日数チェック");
        false && ("[HUG WM] 児童ID:", C_ID);
        false && ("[HUG WM] 面談日:", countParams.interview_date);
        false && (
          "[HUG WM] s_id / f_id:",
          countParams.s_id,
          "/",
          countParams.f_id
        );
        false && ("[HUG WM] 新規作成時の利用日数:", useDays.days, "日");

        return {
          ok: true,
          cId: C_ID,
          interview_date: countParams.interview_date,
          s_id: countParams.s_id,
          f_id: countParams.f_id,
          days: useDays.days,
          label: useDays.label
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
