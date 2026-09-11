import { activateHugViewFirstButton } from "@/hooks/useTabs/common/index.js";
import { setActiveWebview } from "@/utils/webview/webviewState.js";
import { waitForWebviewReady } from "./waitForWebviewReady.js";

export const HUGVIEW_ID = "hugview";

/**
 * id="hugview" を取得し、executeJavaScript / セッション付き fetch が可能な状態にする。
 *
 * @param {{ activateTab?: boolean }} [opts]
 *   - activateTab: true … 「今日の利用者」タブを表示し setActiveWebview する（画面操作向け）
 *   - activateTab: false … タブ切替なし（バックグラウンド取得向け・既定）
 * @returns {Promise<Electron.WebviewTag>}
 */
export async function resolveHugWebview({ activateTab = false } = {}) {
  if (activateTab) {
    activateHugViewFirstButton();
  }

  const webview = document.getElementById(HUGVIEW_ID);
  if (!webview) {
    throw new Error("hugview WebView が見つかりません");
  }

  if (activateTab) {
    setActiveWebview(webview);
  }

  await waitForWebviewReady(webview);

  const origin = webview.getURL?.() || webview.getAttribute?.("src") || "";
  if (!origin.includes("hug-ayumu.link")) {
    throw new Error(
      "HUG にログインした hugview タブを開いてから実行してください"
    );
  }

  return webview;
}

/**
 * タブを active にせず hugview 参照だけ確保する（Cookie 付き fetch 用）
 * @returns {Promise<Electron.WebviewTag>}
 */
export function getHugWebviewForCache() {
  return resolveHugWebview({ activateTab: false });
}
