/**
 * HUG本体の入退室 onclick を、そのままWebViewページ内で実行する。
 *
 * Electron側では ajax_attendance.php のPOST内容を再現しない。
 * attendance.php の最新画面を読み込み、実際のボタンのonclick属性を取得して
 * HUG本体の sendEnterMail / sendLeaveMail を実行する。
 */

import { loadAttendanceDetailInWebview } from "../_shared/webview.js";

export const NATIVE_STATUS_ENTER =
  "HUG本体の入室処理を開始しました。";

export const NATIVE_STATUS_LEAVE =
  "HUG本体の退室処理を開始しました。";

function getKindConfig(kind) {
  if (kind === "enter") {
    return {
      cellPrefix: "enter",
      functionName: "sendEnterMail",
      label: "入室",
    };
  }

  if (kind === "leave") {
    return {
      cellPrefix: "leave",
      functionName: "sendLeaveMail",
      label: "退室",
    };
  }

  throw new Error(`未対応の入退室種別です: ${kind}`);
}

/**
 * HUGの最新 attendance.php 上から対象ボタンを探し、
 * そのボタンの onclick の中身をページコンテキストでそのまま実行する。
 */
async function executeNativeOnclickInWebview(webview, rId, kind) {
  const { cellPrefix, functionName, label } = getKindConfig(kind);

  const script = `
    (() => {
      const rId = ${JSON.stringify(String(rId))};
      const cellId = ${JSON.stringify(cellPrefix)} + rId;
      const functionName = ${JSON.stringify(functionName)};
      const label = ${JSON.stringify(label)};

      try {
        const cell = document.getElementById(cellId);

        if (!cell) {
          return {
            success: false,
            error: label + "セルが見つかりません: #" + cellId,
            pageUrl: location.href,
          };
        }

        const button = cell.querySelector(
          "button[onclick*='" + functionName + "']"
        );

        if (!button) {
          return {
            success: false,
            error:
              label +
              "ボタンが見つかりません: #" +
              cellId +
              " button[onclick*='" +
              functionName +
              "']",
            pageUrl: location.href,
          };
        }

        const onclickCode =
          button.getAttribute("onclick") || "";

        if (!onclickCode.includes(functionName + "(")) {
          return {
            success: false,
            error:
              label +
              "ボタンのonclickが想定外です: " +
              onclickCode,
            pageUrl: location.href,
          };
        }

        if (typeof window[functionName] !== "function") {
          return {
            success: false,
            error:
              "HUG本体関数 " +
              functionName +
              " がページ上にありません",
            onclickCode,
            pageUrl: location.href,
          };
        }

        console.log(
          "[Attendance Native Onclick] execute",
          {
            kind: ${JSON.stringify(kind)},
            rId,
            functionName,
            onclickCode,
            pageUrl: location.href,
          }
        );

        // 実サイトのonclickをそのまま実行する。
        // これによりHUG側の確認ダイアログ、Ajax、算定処理等も
        // 本体JavaScriptへそのまま任せる。
        const execute = new Function(onclickCode);
        execute.call(window);

        return {
          success: true,
          mode: "native-onclick",
          kind: ${JSON.stringify(kind)},
          rId,
          functionName,
          onclickCode,
          pageUrl: location.href,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error && error.message
              ? String(error.message)
              : String(error),
          pageUrl: location.href,
        };
      }
    })()
  `;

  const result = await webview.executeJavaScript(script);

  console.log("[Attendance Native Onclick][renderer]", result);

  if (!result?.success) {
    throw new Error(
      result?.error ||
        `HUG本体の${label}onclick実行に失敗しました`
    );
  }

  return result;
}

/**
 * HUG本体の入室処理を実行する。
 */
export async function tryNativeEnter(
  webview,
  item,
  { facilityId, dateStr }
) {
  if (!webview) {
    throw new Error("HUG webview がありません");
  }

  if (!item?.r_id) {
    throw new Error("入室対象の r_id がありません");
  }

  await loadAttendanceDetailInWebview(
    webview,
    facilityId,
    dateStr
  );

  const result =
    await executeNativeOnclickInWebview(
      webview,
      item.r_id,
      "enter"
    );

  return {
    ...result,
    success: true,
    statusMessage: NATIVE_STATUS_ENTER,
  };
}

/**
 * HUG本体の退室処理を実行する。
 */
export async function tryNativeLeave(
  webview,
  item,
  { facilityId, dateStr }
) {
  if (!webview) {
    throw new Error("HUG webview がありません");
  }

  if (!item?.r_id) {
    throw new Error("退室対象の r_id がありません");
  }

  await loadAttendanceDetailInWebview(
    webview,
    facilityId,
    dateStr
  );

  const result =
    await executeNativeOnclickInWebview(
      webview,
      item.r_id,
      "leave"
    );

  return {
    ...result,
    success: true,
    statusMessage: NATIVE_STATUS_LEAVE,
  };
}

// 旧import互換
export function shouldDelegateEnterToNative(item) {
  return Boolean(item?.r_id);
}

export function shouldDelegateLeaveToNative(item) {
  return Boolean(item?.r_id);
}
