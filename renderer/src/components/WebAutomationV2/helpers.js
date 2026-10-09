import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache";

function timeoutPromise(ms, label) {
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(
        new Error(
          `[WebAutomationV2] ${label} がタイムアウトしました (${ms}ms)`
        )
      );
    }, ms);
  });
}

async function withTimeout(promise, ms, label) {
  if (!ms || ms <= 0) {
    return promise;
  }

  return Promise.race([
    promise,
    timeoutPromise(ms, label),
  ]);
}

/**
 * DB側Flowへ公開する機能をここだけに限定する。
 * DB scriptからRenderer内部の任意モジュールへ直接importさせない。
 */
export function createWebAutomationV2Helpers({
  defaultTimeoutMs = 30000,
} = {}) {
  const getHugWebview = async () => {
    const webview = await getHugWebviewForCache();

    if (!webview) {
      throw new Error(
        "[WebAutomationV2] HUG WebViewを取得できませんでした"
      );
    }

    return webview;
  };

  const executeInWebview = async ({
    scriptText,
    webview = null,
    timeoutMs = defaultTimeoutMs,
  } = {}) => {
    if (!scriptText || typeof scriptText !== "string") {
      throw new Error(
        "[WebAutomationV2] WebView実行用scriptTextがありません"
      );
    }

    const targetWebview = webview || (await getHugWebview());

    if (typeof targetWebview.executeJavaScript !== "function") {
      throw new Error(
        "[WebAutomationV2] 対象WebViewでexecuteJavaScriptを使用できません"
      );
    }

    return withTimeout(
      targetWebview.executeJavaScript(scriptText),
      timeoutMs,
      "WebView JavaScript実行"
    );
  };

  const executeFunctionInWebview = async ({
    functionText,
    args = [],
    webview = null,
    timeoutMs = defaultTimeoutMs,
  } = {}) => {
    if (!functionText || typeof functionText !== "string") {
      throw new Error(
        "[WebAutomationV2] functionTextがありません"
      );
    }

    const serializedArgs = JSON.stringify(args ?? []);

    const scriptText = `
      (async () => {
        const fn = (${functionText});
        const args = ${serializedArgs};
        return await fn(...args);
      })()
    `;

    return executeInWebview({
      scriptText,
      webview,
      timeoutMs,
    });
  };

  return Object.freeze({
    getHugWebview,
    executeInWebview,
    executeFunctionInWebview,
  });
}
