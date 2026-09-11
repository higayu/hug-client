import { getHugWebviewForCache } from "./getHugCache.js";
import { waitForWebviewReady } from "./waitForWebviewReady.js";

/**
 * HUG WebViewがログイン済みかを判定する。
 *
 * @param {Electron.WebviewTag | null} [webview]
 * @returns {Promise<boolean>}
 */
export async function isHugLoggedIn(webview = null) {
  const targetWebview = webview ?? (await getHugWebviewForCache());

  if (typeof targetWebview?.executeJavaScript !== "function") {
    throw new Error("HUG WebViewでログイン状態を確認できません");
  }

  await waitForWebviewReady(targetWebview);

  return targetWebview.executeJavaScript(`
    (() => {
      const url = String(location.href || "");
      const hasLoginForm = Boolean(
        document.querySelector('input[name="username"]') ||
        document.querySelector('input[type="password"]') ||
        document.querySelector('input.btn-login')
      );
      const isLoginUrl = /(?:^|\\/)login\\.php(?:$|[?#])/i.test(url);

      return !hasLoginForm && !isLoginUrl;
    })()
  `);
}

export default isHugLoggedIn;
