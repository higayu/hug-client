// hugview Cache 用: タブ active なしで dom-ready / 出席詳細のバックグラウンド読込

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import store from "@/store/store.js";

const ATTENDANCE_LOAD_TIMEOUT_MS = 15000;

export async function waitForWebviewReady(webview) {
  return new Promise((resolve) => {
    if (!webview) {
      resolve(false);
      return;
    }

    if (webview.isConnected && !webview.isLoading?.()) {
      resolve(true);
      return;
    }

    if (!webview.isConnected) {
      const observer = new MutationObserver(() => {
        if (!webview.isConnected) return;

        observer.disconnect();

        if (!webview.isLoading?.()) {
          resolve(true);
          return;
        }

        webview.addEventListener(
          "dom-ready",
          () => resolve(true),
          { once: true }
        );
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return;
    }

    webview.addEventListener(
      "dom-ready",
      () => resolve(true),
      { once: true }
    );
  });
}

function isTargetAttendanceUrl(url, facilityId, dateStr) {
  try {
    const parsed = new URL(String(url || ""));

    return (
      parsed.pathname.endsWith("/attendance.php") &&
      parsed.searchParams.get("mode") === "detail" &&
      parsed.searchParams.get("f_id") === String(facilityId) &&
      parsed.searchParams.get("date") === String(dateStr)
    );
  } catch {
    const text = String(url || "");

    return (
      text.includes("attendance.php") &&
      text.includes("mode=detail") &&
      text.includes(`f_id=${facilityId}`) &&
      text.includes(`date=${dateStr}`)
    );
  }
}

function waitForTargetDidFinishLoad(webview, facilityId, dateStr) {
  return new Promise((resolve, reject) => {
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      webview.removeEventListener("did-finish-load", onFinish);
      webview.removeEventListener("did-fail-load", onFail);
    };

    const onFinish = () => {
      const loadedUrl = webview.getURL?.() || "";

      if (!isTargetAttendanceUrl(loadedUrl, facilityId, dateStr)) {
        return;
      }

      cleanup();
      resolve(loadedUrl);
    };

    const onFail = (event) => {
      if (event?.errorCode === -3) return;

      cleanup();
      reject(
        new Error(
          `HUG出席詳細ページの読込に失敗しました: ${
            event?.errorDescription || event?.errorCode || "unknown"
          }`
        )
      );
    };

    webview.addEventListener("did-finish-load", onFinish);
    webview.addEventListener("did-fail-load", onFail);

    timer = setTimeout(() => {
      cleanup();
      const currentUrl = webview.getURL?.() || "";
      reject(
        new Error(
          `HUG出席詳細ページの読込完了待ちがタイムアウトしました: ${currentUrl}`
        )
      );
    }, ATTENDANCE_LOAD_TIMEOUT_MS);
  });
}

async function waitForAttendanceDom(webview, facilityId, dateStr) {
  const expectedDate = String(dateStr);

  const result = await webview.executeJavaScript(`
    (async () => {
      const expectedDate = ${JSON.stringify(expectedDate)};
      const timeoutMs = ${ATTENDANCE_LOAD_TIMEOUT_MS};
      const startedAt = Date.now();

      const getState = () => {
        const pageDate =
          document.querySelector('input[name="date"]')?.value ||
          document.querySelector('[name="date"]')?.value ||
          "";

        const table = document.querySelector(
          "table.sortTable01:not(.sortTableAdding):not(.js_adding_table)"
        );

        return {
          ready:
            document.readyState === "complete" &&
            pageDate === expectedDate &&
            Boolean(table),
          readyState: document.readyState,
          pageDate,
          hasTable: Boolean(table),
          pageUrl: location.href,
        };
      };

      while (Date.now() - startedAt < timeoutMs) {
        const state = getState();

        if (state.ready) {
          return {
            success: true,
            waitedMs: Date.now() - startedAt,
            ...state,
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return {
        success: false,
        waitedMs: Date.now() - startedAt,
        ...getState(),
      };
    })()
  `);

  if (!result?.success) {
    throw new Error(
      `HUG出席詳細DOMの準備を確認できませんでした: ` +
        `date=${result?.pageDate || "unknown"}, ` +
        `hasTable=${Boolean(result?.hasTable)}, ` +
        `readyState=${result?.readyState || "unknown"}`
    );
  }

  return result;
}

export async function loadAttendanceDetailInWebview(
  webview,
  facilityId,
  dateStr
) {
  if (!webview) {
    throw new Error("webview がありません");
  }

  if (!facilityId || !dateStr) {
    throw new Error("FACILITY_ID または DATE_STR がありません");
  }

  await waitForWebviewReady(webview);

  const url =
    `https://www.hug-ayumu.link/hug/wm/attendance.php` +
    `?mode=detail` +
    `&f_id=${encodeURIComponent(String(facilityId))}` +
    `&date=${encodeURIComponent(String(dateStr))}`;

  const currentUrl =
    webview.getURL?.() ||
    webview.getAttribute?.("src") ||
    "";

  // DB側の reloadAttendanceDetailBeforeExecute=true の意図に合わせ、
  // reload/src変更より前に読込完了監視を開始する。
  const finishPromise = waitForTargetDidFinishLoad(
    webview,
    facilityId,
    dateStr
  );

  if (isTargetAttendanceUrl(currentUrl, facilityId, dateStr)) {
    // 同一URLでも古いDOMが残ることがあるため必ずreloadする。
    console.log("[Attendance WebView] 同一URLを強制reload", {
      currentUrl,
      facilityId: String(facilityId),
      dateStr: String(dateStr),
    });

    webview.reload();
  } else {
    console.log("[Attendance WebView] 出席詳細へ遷移", {
      from: currentUrl,
      to: url,
      facilityId: String(facilityId),
      dateStr: String(dateStr),
    });

    webview.src = url;
  }

  await finishPromise;

  // did-finish-load後、対象日の出席表DOM生成まで確認してから返す。
  await waitForAttendanceDom(webview, facilityId, dateStr);

  return webview;
}

export async function resolveAttendanceWebview({
  loadDetailPage = false,
} = {}) {
  const webview = await getHugWebviewForCache();

  if (loadDetailPage) {
    const facilityId = store.getState().appState?.FACILITY_ID;
    const dateStr = store.getState().appState?.CURRENT_YMD;

    await loadAttendanceDetailInWebview(
      webview,
      facilityId,
      dateStr
    );
  }

  return webview;
}
