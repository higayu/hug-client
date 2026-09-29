import { activateHugViewFirstButton } from "@/hooks/useTabs/common/index.js";
import { setActiveWebview } from "@/utils/webview/webviewState.js";
import { waitForWebviewReady } from "./waitForWebviewReady.js";

export const HUGVIEW_ID = "hugview";
export const HUG_AUTOMATION_WEBVIEW_ID = "hug-automation-webview";

function getWebviewById(id) {
  return document.getElementById(id);
}

/**
 * 裏で常駐するHUG自動処理専用WebViewを取得する。
 * 旧画面など専用WebViewが存在しない場合だけ #hugview にフォールバックする。
 */
export function getHugAutomationWebview() {
  return (
    getWebviewById(HUG_AUTOMATION_WEBVIEW_ID) ||
    getWebviewById(HUGVIEW_ID) ||
    null
  );
}

/**
 * HUG WebViewを取得し、executeJavaScript / セッション付き fetch が可能な状態にする。
 *
 * @param {{ activateTab?: boolean }} [opts]
 *   - activateTab: true  … ユーザー表示用 #hugview をアクティブにする（画面操作向け）
 *   - activateTab: false … 常駐 #hug-automation-webview を使う（バックグラウンド処理向け・既定）
 * @returns {Promise<Electron.WebviewTag>}
 */
export async function resolveHugWebview({ activateTab = false } = {}) {
  if (activateTab) {
    activateHugViewFirstButton();
  }

  const webview = activateTab
    ? getWebviewById(HUGVIEW_ID)
    : getHugAutomationWebview();

  if (!webview) {
    throw new Error(
      activateTab
        ? "hugview WebView が見つかりません"
        : "hug-automation-webview WebView が見つかりません"
    );
  }

  if (activateTab) {
    setActiveWebview(webview);
  }

  await waitForWebviewReady(webview);

  const origin = webview.getURL?.() || webview.getAttribute?.("src") || "";
  if (!origin.includes("hug-ayumu.link")) {
    throw new Error(
      activateTab
        ? "HUG にログインした hugview タブを開いてから実行してください"
        : "HUG 自動処理WebViewを読み込めませんでした"
    );
  }

  return webview;
}

/**
 * 常駐HUG自動処理WebViewをready状態で返す。
 * @returns {Promise<Electron.WebviewTag>}
 */
export function resolveHugAutomationWebview() {
  return resolveHugWebview({ activateTab: false });
}

/**
 * Cookie / キャッシュ付きバックグラウンド処理用。
 * 現在は #hug-automation-webview を優先して返す。
 * @returns {Promise<Electron.WebviewTag>}
 */
export function getHugWebviewForCache() {
  return resolveHugAutomationWebview();
}
