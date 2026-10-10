const WEBVIEW_ID = 'hugview';
const WEBVIEW_READY_TIMEOUT_MS = 15_000;
const pendingLoads = new WeakMap();

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const getWebviewUrl = (webview) =>
  webview.getURL?.() || webview.getAttribute?.('src') || '';

const isSameAttendanceUrl = (currentUrl, targetUrl) => {
  if (!currentUrl) return false;

  try {
    const current = new URL(currentUrl);
    const target = new URL(targetUrl);

    return (
      current.origin === target.origin &&
      current.pathname === target.pathname &&
      current.searchParams.get('mode') === target.searchParams.get('mode') &&
      current.searchParams.get('f_id') === target.searchParams.get('f_id') &&
      current.searchParams.get('date') === target.searchParams.get('date')
    );
  } catch {
    return currentUrl === targetUrl;
  }
};

const waitForLoad = (webview, targetUrl) =>
  new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('Timed out while loading the HUG attendance page'));
    }, WEBVIEW_READY_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      webview.removeEventListener('did-finish-load', onFinish);
      webview.removeEventListener('did-stop-loading', onStop);
      webview.removeEventListener('did-fail-load', onFail);
    };

    const resolveIfTargetLoaded = () => {
      const loadedUrl = getWebviewUrl(webview);

      if (!targetUrl || isSameAttendanceUrl(loadedUrl, targetUrl)) {
        cleanup();
        resolve();
      }
    };

    const onFinish = () => resolveIfTargetLoaded();
    const onStop = () => resolveIfTargetLoaded();
    const onFail = (event) => {
      if (event?.errorCode === -3) {
        return;
      }

      cleanup();
      reject(
        new Error(
          event?.errorDescription ||
            `Failed to load the HUG attendance page (${event?.errorCode ?? 'unknown'})`,
        ),
      );
    };

    webview.addEventListener('did-finish-load', onFinish);
    webview.addEventListener('did-stop-loading', onStop);
    webview.addEventListener('did-fail-load', onFail);
  });

/**
 * WebViewがDOMへ接続され、Electronの内部WebContentsが生成されるまで待つ。
 */
export async function getReadyWebview(timeoutMs = WEBVIEW_READY_TIMEOUT_MS) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const webview = document.getElementById(WEBVIEW_ID);

    if (webview?.isConnected) {
      try {
        if (webview.getWebContentsId?.() > 0) {
          return webview;
        }
      } catch {
        // dom-ready前はElectron APIが例外を投げるため再試行する。
      }
    }

    await wait(100);
  }

  throw new Error(
    'HUG WebViewの準備ができません。HUGタブを一度開いてログインしてください。',
  );
}

export async function openAttendancePage(webview, facilityId, dateStr) {
  const url =
    'https://www.hug-ayumu.link/hug/wm/attendance.php' +
    `?mode=detail&f_id=${encodeURIComponent(facilityId)}` +
    `&date=${encodeURIComponent(dateStr)}`;

  const pendingLoad = pendingLoads.get(webview);
  if (pendingLoad && isSameAttendanceUrl(pendingLoad.url, url)) {
    await pendingLoad.promise;
    return;
  }

  if (!isSameAttendanceUrl(getWebviewUrl(webview), url)) {
    const loaded = waitForLoad(webview, url);
    pendingLoads.set(webview, { url, promise: loaded });
    webview.src = url;

    try {
      await loaded;
      return;
    } finally {
      if (pendingLoads.get(webview)?.promise === loaded) {
        pendingLoads.delete(webview);
      }
    }
  }

  if (webview.isLoading?.()) {
    await waitForLoad(webview, url);
  }
}

export async function readAttendanceRows(webview) {
  return webview.executeJavaScript(`(() => {
    const time = (cell) => {
      const match = String(cell?.innerText || '').match(/([0-2]?\\d:[0-5]\\d)/);
      return match ? match[1].padStart(5, '0') : '';
    };

    const rowIdFromOnClick = (text) => {
      const match = String(text || '').match(/send(?:Enter|Leave)Mail\\s*\\(\\s*['\"]?([^'\",)]+)/);
      return match ? match[1] : '';
    };

    const normalize = (value) =>
      String(value || '').replace(/\\s+/g, ' ').trim();

    const extractFuriganaName = (realnameRoot) => {
      if (!realnameRoot) return '';

      const furiganaElement =
        realnameRoot.querySelector('.nameBox span.furigana') ||
        realnameRoot.querySelector('span.furigana') ||
        realnameRoot.querySelector('rt.furigana');

      return normalize(furiganaElement?.textContent);
    };

    const table = document.querySelector(
      'table.sortTable01:not(.sortTableAdding):not(.js_adding_table)'
    );

    if (!table) {
      throw new Error('HUGの出席一覧テーブルが見つかりません');
    }

    return Array.from(table.querySelectorAll('tbody tr'))
      .map((tr, index) => {
        const enter = tr.querySelector('td.enter');
        const leave = tr.querySelector('td.leave');

        if (!enter && !leave) return null;

        const enterButton = enter?.querySelector("button[onclick*='sendEnterMail']");
        const leaveButton = leave?.querySelector("button[onclick*='sendLeaveMail']");
        const enterOnClick = enterButton?.getAttribute('onclick') || '';
        const leaveOnClick = leaveButton?.getAttribute('onclick') || '';
        const realname = tr.querySelector('td.realname');
        const profileLink = realname?.querySelector("a[href*='profile_children.php']");
        const childMatch = profileLink?.getAttribute('href')?.match(/id=(\\d+)/);
        const rowMatch = String(tr.className || '').match(/children(\\d+)/);
        const nameElement =
          realname?.querySelector('.nameBox p') || profileLink || realname;
        const name = normalize(nameElement?.textContent).replace(/\\s*さん$/, '');
        const furiganaName = extractFuriganaName(realname);
        const enterText = normalize(enter?.innerText);

        return {
          rId:
            rowMatch?.[1] ||
            rowIdFromOnClick(enterOnClick) ||
            rowIdFromOnClick(leaveOnClick) ||
            String(index),
          childId: childMatch?.[1] || '',
          name: name || '名称不明',
          furiganaName,
          enterTime: time(enter),
          leaveTime: time(leave),
          canEnter: Boolean(enterButton),
          canLeave: Boolean(leaveButton),
          isAbsent: enterText.includes('欠席') && !enterButton,
        };
      })
      .filter(Boolean);
  })()`);
}

export async function clickAttendanceAction(webview, rowId, kind) {
  return webview.executeJavaScript(`(() => {
    const id = ${JSON.stringify(String(rowId))};
    const kind = ${JSON.stringify(kind)};
    const fn = kind === 'enter' ? 'sendEnterMail' : 'sendLeaveMail';
    const selector = kind === 'enter'
      ? "button[onclick*='sendEnterMail']"
      : "button[onclick*='sendLeaveMail']";

    const button = Array.from(document.querySelectorAll(selector)).find((item) => {
      const match = String(item.getAttribute('onclick') || '').match(
        new RegExp(fn + '\\s*\\(\\s*[\\\'\\\"]?([^\\\'\\\",)]+)')
      );
      return match && String(match[1]) === id;
    });

    if (!button) {
      return { success: false, error: 'HUGの操作ボタンが見つかりません' };
    }

    button.click();
    return { success: true };
  })()`);
}
