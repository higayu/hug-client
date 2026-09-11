/** WebView が DOM 操作可能になるまで待つ。 */
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
