import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache";

const HUG_WM_BASE_URL = "https://www.hug-ayumu.link/hug/wm/";

/**
 * HUG本体と同じ編集画面URLを生成する。
 *
 * 例:
 * attendance.php?mode=edit&id=47534&s_id=1
 */
export function buildAttendanceEditUrl({
  editUrl = "",
  attendanceId = "",
  serviceId = "",
} = {}) {
  if (editUrl) {
    return String(editUrl).replace(/&amp;/g, "&");
  }

  if (!attendanceId || !serviceId) {
    throw new Error("編集画面に必要な id または s_id がありません");
  }

  const params = new URLSearchParams({
    mode: "edit",
    id: String(attendanceId),
    s_id: String(serviceId),
  });

  return `attendance.php?${params.toString()}`;
}

/**
 * GETで返ってきた編集画面HTMLから、Rendererモーダルで使用する値を取得する。
 */
export function parseAttendanceEditHtml(html = "") {
  if (!html) {
    throw new Error("編集画面HTMLがありません");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(String(html), "text/html");

  const form = document.querySelector("#form");
  if (!form || !form.querySelector('[name="id"]')?.value) {
    throw new Error("HUG編集フォームを確認できません");
  }
  const providingType = form.querySelector('input[name="providing_type"]:checked')?.value ?? "";

  const getValue = (name) =>
    form.querySelector(`[name="${name}"]`)?.value ?? "";

  const pageName =
    document.querySelector(".nameBox p")?.textContent?.replace(/さん\s*$/, "")?.trim() ||
    "";

  return {
    providingType,
    attendanceId: getValue("id"),
    childId: getValue("c_id"),
    facilityId: getValue("f_id"),
    serviceId: getValue("s_id"),
    date: getValue("date"),
    name: pageName,
    startHour: getValue("s_hour"),
    startMinute: getValue("s_min"),
    endHour: getValue("e_hour"),
    endMinute: getValue("e_min"),
  };
}

/**
 * HUG WebView 内で location.href を使用して編集画面へGET遷移する。
 * GET完了後、返ってきたHTML全体をRenderer側へ返す。
 */
export async function openAttendanceEditPage(options = {}) {
  const targetUrl = buildAttendanceEditUrl(options);
  const webview = options.webview || (await getHugWebviewForCache());

  if (!webview) {
    throw new Error("HUG WebViewを取得できませんでした");
  }

  const absoluteUrl = new URL(targetUrl, HUG_WM_BASE_URL).href;

  void 0;

  const loadedPromise = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      webview.removeEventListener("did-finish-load", handleFinishLoad);
      reject(
        new Error(
          `編集画面のGET完了待ちがタイムアウトしました: ${absoluteUrl}`,
        ),
      );
    }, 15000);

    const handleFinishLoad = async () => {
      clearTimeout(timeoutId);
      webview.removeEventListener("did-finish-load", handleFinishLoad);

      try {
        const html = await webview.executeJavaScript(`
          (() => document.documentElement.outerHTML)();
        `);

        void 0;
        resolve(html);
      } catch (error) {
        reject(error);
      }
    };

    webview.addEventListener("did-finish-load", handleFinishLoad);
  });

  await webview.executeJavaScript(`
    (() => {
      const targetUrl = ${JSON.stringify(absoluteUrl)};
      false && ("[Attendance Edit] location.href GET:", targetUrl);
      location.href = targetUrl;
      return targetUrl;
    })();
  `);

  const html = await loadedPromise;

  return {
    success: true,
    targetUrl: absoluteUrl,
    html,
    webview,
  };
}

/**
 * Rendererモーダルで編集した入退室時間を、現在開いているHUG編集フォームへ反映して保存する。
 * HUG側の #form を requestSubmit() するため、hidden値・CSRF・onsubmitをそのまま利用する。
 */
export async function saveAttendanceEditTimes({
  startHour = "",
  startMinute = "",
  endHour = "",
  endMinute = "",
  providingType = null,
  expectedRecord = null,
  webview = null,
} = {}) {
  const targetWebview = webview || (await getHugWebviewForCache());

  if (!targetWebview) {
    throw new Error("HUG WebViewを取得できませんでした");
  }

  if (providingType !== null && !["", "1", "2", "9"].includes(providingType)) {
    throw new Error("提供形態が不正です");
  }
  const values = {
    providing_type: providingType,
    s_hour: String(startHour ?? ""),
    s_min: String(startMinute ?? ""),
    e_hour: String(endHour ?? ""),
    e_min: String(endMinute ?? ""),
  };

  void 0;

  // requestSubmit() は送信開始直後に制御が戻るため、
  // HUG側のPOST完了（ページ再読込）を待ってから呼び出し元へ返す。
  let cleanupSaveWait = () => {};
  const saveCompletedPromise = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      targetWebview.removeEventListener("did-finish-load", handleFinishLoad);
      reject(new Error("HUG編集内容の保存完了待ちがタイムアウトしました"));
    }, 15000);

    const handleFinishLoad = async () => {
      clearTimeout(timeoutId);
      targetWebview.removeEventListener("did-finish-load", handleFinishLoad);

      try {
        const pageInfo = await targetWebview.executeJavaScript(`
          (() => ({
            href: location.href,
            title: document.title,
          }))();
        `);

        resolve(pageInfo);
      } catch (error) {
        reject(error);
      }
    };

    cleanupSaveWait = () => {
      clearTimeout(timeoutId);
      targetWebview.removeEventListener("did-finish-load", handleFinishLoad);
    };
    targetWebview.addEventListener("did-finish-load", handleFinishLoad);
  });

  saveCompletedPromise.catch(() => {});
  let result;

  try {
    result = await targetWebview.executeJavaScript(`
    (() => {
      const values = ${JSON.stringify(values)};

      const form = document.querySelector('#form');
      if (!form) throw new Error("HUG編集フォームが見つかりません");
      const expected = ${JSON.stringify(expectedRecord)};
      if (expected) {
        for (const [name, key] of Object.entries({id:"attendanceId", c_id:"childId", f_id:"facilityId", s_id:"serviceId", date:"date"})) {
          if (!expected[key] || form.elements.namedItem(name)?.value !== expected[key]) {
            throw new Error("編集対象が変更されています。開き直してください");
          }
        }
      }
      const radios = Array.from(form.querySelectorAll('input[type="radio"][name="providing_type"]'));
      const current = radios.find(radio => radio.checked)?.value ?? "";
      const desired = values.providing_type;
      if (desired !== null && desired !== current) {
        const radio = radios.find(item => item.value === desired);
        if (!radio || !["1", "2"].includes(desired) || radio.matches(":disabled") || !radio.getClientRects().length || getComputedStyle(radio).visibility !== "visible") {
          throw new Error("指定された提供形態は選択できません");
        }
        radio.click();
        if (!radio.checked) throw new Error("提供形態を変更できませんでした");
      }

      const setSelectValue = (name, value) => {
        const element = form.querySelector('[name="' + name + '"]');
        if (!element) {
          throw new Error('編集項目が見つかりません: ' + name);
        }

        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };

      setSelectValue('s_hour', values.s_hour);
      setSelectValue('s_min', values.s_min);
      setSelectValue('e_hour', values.e_hour);
      setSelectValue('e_min', values.e_min);

      if (desired !== null && (form.querySelector('input[name="providing_type"]:checked')?.value ?? "") !== desired) {
        throw new Error("時間変更により提供形態が変化しました。HUG側の条件を確認してください");
      }

      false && ('[Attendance Edit] HUGフォームへ時間反映:', values);

      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        const submitEvent = new Event('submit', {
          bubbles: true,
          cancelable: true,
        });

        if (form.dispatchEvent(submitEvent)) {
          form.submit();
        }
      }

      return {
        success: true,
        values,
      };
    })();
  `);
  } catch (error) {
    cleanupSaveWait();
    throw error;
  }

  const savePage = await saveCompletedPromise;

  void 0;

  return {
    ...result,
    savePage,
    webview: targetWebview,
  };
}

// 旧関数名を使用している箇所があっても壊れないよう残す。
export const OpenEditModal = openAttendanceEditPage;
