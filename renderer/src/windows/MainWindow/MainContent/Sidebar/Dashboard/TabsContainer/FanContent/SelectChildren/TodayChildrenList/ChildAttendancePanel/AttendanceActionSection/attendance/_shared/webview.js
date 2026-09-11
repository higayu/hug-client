// hugview Cache 用: タブ active なしで dom-ready / 出席詳細のバックグラウンド読込

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import store from "@/store/store.js";

/* WebView が dom-ready になるまで待つ */
export async function waitForWebviewReady(webview) {
  return new Promise((resolve) => {
    if (!webview) return resolve(false);

    if (webview.isConnected && !webview.isLoading?.()) {
      resolve(true);
      return;
    }

    if (!webview.isConnected) {
      const observer = new MutationObserver(() => {
        if (webview.isConnected) {
          observer.disconnect();
          webview.addEventListener("dom-ready", () => resolve(true), {
            once: true,
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return;
    }

    webview.addEventListener("dom-ready", () => resolve(true), { once: true });
  });
}

/**
 * 非表示 hugview に出席詳細 URL を読み込む（タブ切替なし・欠席モーダル用）
 * @param {Electron.WebviewTag} webview
 * @param {string|number} facilityId
 * @param {string} dateStr
 */
export async function loadAttendanceDetailInWebview(webview, facilityId, dateStr) {
  if (!webview) throw new Error("webview がありません");
  if (!facilityId || !dateStr) {
    throw new Error("FACILITY_ID または DATE_STR がありません");
  }

  const url = `https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail&f_id=${facilityId}&date=${dateStr}`;
  const now = webview.getURL?.() || webview.getAttribute?.("src") || "";

  const alreadyLoaded =
    now.includes("attendance.php") &&
    now.includes(`f_id=${facilityId}`) &&
    now.includes(`date=${dateStr}`);

  if (!alreadyLoaded) {
    webview.src = url;
  }

  await waitForWebviewReady(webview);

  await new Promise((resolve) => {
    const attach = () => {
      webview.addEventListener(
        "did-finish-load",
        () => {
          const loaded = webview.getURL?.() || "";
          if (
            loaded.includes("attendance.php") &&
            loaded.includes(`f_id=${facilityId}`)
          ) {
            resolve();
          } else {
            attach();
          }
        },
        { once: true }
      );
    };
    if (webview.isLoading?.()) attach();
    else resolve();
  });

  return webview;
}

/**
 * 入退室・欠席用: hugview を Cache で確保し、必要なら出席詳細をバックグラウンド読込
 * @param {{ loadDetailPage?: boolean }} [opts]
 */
export async function resolveAttendanceWebview({ loadDetailPage = false } = {}) {
  const webview = await getHugWebviewForCache();

  if (loadDetailPage) {
    const facilityId = store.getState().appState?.FACILITY_ID;
    const dateStr = store.getState().appState?.CURRENT_YMD;
    await loadAttendanceDetailInWebview(webview, facilityId, dateStr);
  }

  return webview;
}
