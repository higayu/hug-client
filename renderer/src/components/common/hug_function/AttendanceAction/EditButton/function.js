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

  const getValue = (name) =>
    document.querySelector(`[name="${name}"]`)?.value ?? "";

  const pageName =
    document.querySelector(".nameBox p")?.textContent?.replace(/さん\s*$/, "")?.trim() ||
    "";

  return {
    attendanceId: getValue("id"),
    childId: getValue("c_id"),
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

  console.log("[Attendance Edit] GET開始:", absoluteUrl);

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

        console.log("[Attendance Edit] GET完了 HTML:", html);
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
      console.log("[Attendance Edit] location.href GET:", targetUrl);
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
  webview = null,
} = {}) {
  const targetWebview = webview || (await getHugWebviewForCache());

  if (!targetWebview) {
    throw new Error("HUG WebViewを取得できませんでした");
  }

  const values = {
    s_hour: String(startHour ?? ""),
    s_min: String(startMinute ?? ""),
    e_hour: String(endHour ?? ""),
    e_min: String(endMinute ?? ""),
  };

  console.log("[Attendance Edit] 保存開始:", values);

  const result = await targetWebview.executeJavaScript(`
    (() => {
      const values = ${JSON.stringify(values)};

      const setSelectValue = (name, value) => {
        const element = document.querySelector('[name="' + name + '"]');
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

      const form = document.querySelector('#form');
      if (!form) {
        throw new Error('HUG編集フォーム #form が見つかりません');
      }

      console.log('[Attendance Edit] HUGフォームへ時間反映:', values);

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

  return result;
}

// 旧関数名を使用している箇所があっても壊れないよう残す。
export const OpenEditModal = openAttendanceEditPage;
