/**
 * 画面操作が必要なときは hugview-first をアクティブにする。
 * データ取得のみは @/hooks/useHugCache/getHugCache.js の getHugWebviewForCache を使う。
 */

import { resolveHugWebview } from "@/hooks/useHugCache/getHugCache.js";
import { waitForWebviewReady } from "@/utils/attendance/_shared/webview.js";

const HUG_WM_BASE = "https://www.hug-ayumu.link/hug/wm";

/**
 * @param {string} url
 * @param {Electron.WebviewTag} webview
 */
async function waitForWebviewUrl(webview, url) {
  const matches = () => {
    const loaded = webview.getURL?.() || webview.getAttribute?.("src") || "";
    return loaded.includes(url) || loaded.includes("record_proceedings.php");
  };

  if (!webview.isLoading?.() && matches()) return;

  await new Promise((resolve) => {
    const attach = () => {
      webview.addEventListener(
        "did-finish-load",
        () => {
          if (matches()) resolve();
          else attach();
        },
        { once: true }
      );
    };
    attach();
  });
}

/**
 * hugview-first をアクティブにして HUG セッションを使える状態にする（画面表示あり）
 * @param {{ activateTab?: boolean }} [opts]
 * @returns {Promise<Electron.WebviewTag>}
 */
export async function ensureHugWebviewSession({ activateTab = true } = {}) {
  return resolveHugWebview({ activateTab });
}

/**
 * id="hugview" を表示し、各種加算・議事録の登録フォームへ遷移する（画面確認用）
 * @param {string|number} childId
 * @returns {Promise<Electron.WebviewTag>}
 */
export async function ensureHugWebviewForRecordProceedings(childId) {
  if (!childId) {
    throw new Error("児童IDがありません");
  }

  const webview = await resolveHugWebview({ activateTab: true });

  const url =
    `${HUG_WM_BASE}/record_proceedings.php?mode=edit&select_child=${encodeURIComponent(String(childId))}`;

  const now = webview.getURL?.() || webview.getAttribute?.("src") || "";
  if (!now.includes(`select_child=${childId}`)) {
    webview.src = url;
  }

  await waitForWebviewReady(webview);
  await waitForWebviewUrl(webview, url);

  return webview;
}
