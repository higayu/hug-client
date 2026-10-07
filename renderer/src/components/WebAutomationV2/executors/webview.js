export async function resolveWebview(webviewKey, runtime = {}) {
  if (typeof runtime.resolveWebview === "function") {
    const resolved = await runtime.resolveWebview(webviewKey);
    if (resolved) return resolved;
  }

  if (runtime.webviews?.[webviewKey]) return runtime.webviews[webviewKey];

  if (typeof document !== "undefined" && webviewKey) {
    const byId = document.getElementById(webviewKey);
    if (byId) return byId;
  }

  throw new Error(`WebViewが見つかりません: ${webviewKey || "(未指定)"}`);
}

export function getWebviewUrl(webview) {
  try {
    return webview?.getURL?.() || webview?.src || webview?.getAttribute?.("src") || "";
  } catch {
    return "";
  }
}

export async function executeInWebview(webview, script) {
  if (!webview || typeof webview.executeJavaScript !== "function") {
    throw new Error("executeJavaScript可能なWebViewではありません");
  }
  return webview.executeJavaScript(script);
}
