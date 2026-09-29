/**
 * WebView が Electron の WebView API を使用可能になるまで待つ。
 *
 * 注意:
 * - webview.isConnected === true でも dom-ready 前の場合がある。
 * - isLoading() 自体も dom-ready 前には呼べないため、
 *   readiness 判定には使用しない。
 */
export async function waitForWebviewReady(
  webview,
  timeoutMs = 15000,
) {
  if (!webview) {
    return false;
  }

  /**
   * WebView が DOM に接続されるまで待つ。
   */
  const waitForConnected = () =>
    new Promise((resolve, reject) => {
      if (webview.isConnected) {
        resolve(true);
        return;
      }

      const observer = new MutationObserver(() => {
        if (!webview.isConnected) {
          return;
        }

        clearTimeout(timeoutId);
        observer.disconnect();

        resolve(true);
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();

        reject(
          new Error(
            `WebView が DOM に接続されるまでにタイムアウトしました。(${timeoutMs}ms)`,
          ),
        );
      }, timeoutMs);

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });

  await waitForConnected();

  /**
   * すでに dom-ready 済みの場合、
   * WebView API が使用可能かどうかを軽い処理で確認する。
   *
   * isLoading() は dom-ready 前に例外になるため使用しない。
   */
  try {
    await webview.executeJavaScript("true");
    return true;
  } catch {
    // dom-ready 前なら下でイベントを待つ。
  }

  /**
   * dom-ready を待つ。
   */
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      webview.removeEventListener(
        "dom-ready",
        handleDomReady,
      );

      clearTimeout(timeoutId);
    };

    const handleDomReady = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      resolve(true);
    };

    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      reject(
        new Error(
          `WebView の dom-ready 待機がタイムアウトしました。(${timeoutMs}ms)`,
        ),
      );
    }, timeoutMs);

    webview.addEventListener(
      "dom-ready",
      handleDomReady,
      {
        once: true,
      },
    );
  });
}