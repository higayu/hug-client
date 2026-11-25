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
  targetWebview = null,
} = {}) {
  const getHugWebview = async () => {
    const webview = targetWebview || await getHugWebviewForCache();
    if (targetWebview && !targetWebview.isConnected) throw new Error("対象タブが閉じられました");

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

    if (targetWebview && webview && webview !== targetWebview) throw new Error("対象WebViewの変更は禁止されています");
    const executionWebview = webview || (await getHugWebview());

    if (typeof executionWebview.executeJavaScript !== "function") {
      throw new Error(
        "[WebAutomationV2] 対象WebViewでexecuteJavaScriptを使用できません"
      );
    }

    return withTimeout(
      executionWebview.executeJavaScript(scriptText),
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
