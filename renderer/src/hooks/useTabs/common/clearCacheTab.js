// renderer\src\hooks\useTabs\common\clearCacheTab.js
// アクティブな WebView のキャッシュを削除する共通関数

import { getActiveWebview } from "@/utils/webview/webviewState.js";

export async function clearActiveWebviewCache() {
  const activeView = getActiveWebview();

  if (!activeView) {
    console.warn("⚠ アクティブな WebView がありません");
    return false;
  }

  const wcId = activeView.getWebContentsId();

  if (!wcId) {
    console.warn("⚠ WebContents ID が取得できませんでした");
    return false;
  }

  try {
    const result = await window.electronAPI.clearWebviewCache(wcId);

    if (result) {
      void 0;
      return true;
    } else {
      console.warn("⚠ キャッシュ削除に失敗しました");
      return false;
    }
  } catch (err) {
    console.error("❌ clearActiveWebviewCache error:", err);
    return false;
  }
}
