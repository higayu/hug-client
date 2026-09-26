/**
 * HUG本体の入退室 onclick を、そのままWebViewページ内で実行する。
 *
 * メール通知対象の場合は、renderer側ですでに選択された mailFlg を受け取り、
 * HUG側の #addtend_dialog_mail が開いたタイミングで対応する
 * .send_mail_button[data-send_mail="0|1"] を自動クリックする。
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
 *
 * @param {Electron.WebviewTag} webview
 * @param {number|string} rId
 * @param {'enter'|'leave'} kind
 * @param {{mailFlg?: number|null}} options
 */
async function executeNativeOnclickInWebview(
  webview,
  rId,
  kind,
  options = {}
) {
  const { cellPrefix, functionName, label } = getKindConfig(kind);
  const mailFlg =
    Number(options?.mailFlg) === 1
      ? 1
      : Number(options?.mailFlg) === 0
        ? 0
        : null;

  const script = `
    (async () => {
      const rId = ${JSON.stringify(String(rId))};
      const cellId = ${JSON.stringify(cellPrefix)} + rId;
      const functionName = ${JSON.stringify(functionName)};
      const label = ${JSON.stringify(label)};
      const mailFlg = ${JSON.stringify(mailFlg)};

      const sleep = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const getMailDialogWrapper = () => {
        const dialog = document.getElementById("addtend_dialog_mail");
        return dialog?.closest(".ui-dialog") || null;
      };

      const isVisible = (element) => {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity || 1) !== 0
        );
      };

      const resolveHugMailDialog = async () => {
        if (mailFlg !== 0 && mailFlg !== 1) {
          return {
            handled: false,
            reason: "renderer-mail-choice-not-supplied",
          };
        }

        const startedAt = Date.now();
        const timeoutMs = 3000;

        while (Date.now() - startedAt < timeoutMs) {
          const dialog = document.getElementById("addtend_dialog_mail");
          const wrapper = getMailDialogWrapper();

          if (dialog && wrapper && isVisible(wrapper)) {
            const button = dialog.querySelector(
              '.send_mail_button[data-send_mail="' + mailFlg + '"]'
            );

            if (!button) {
              return {
                handled: false,
                reason: "mail-choice-button-not-found",
              };
            }

            console.log(
              "[Attendance Native Onclick] resolve HUG mail dialog",
              {
                kind: ${JSON.stringify(kind)},
                rId,
                mailFlg,
              }
            );

            button.click();

            return {
              handled: true,
              mailFlg,
            };
          }

          await sleep(25);
        }

        return {
          handled: false,
          reason: "hug-mail-dialog-not-opened",
        };
      };

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

        // renderer側の確認を使う場合、HUG側モーダルは表示させず、
        // DOM上では開かせた上で該当ボタンを自動クリックする。
        const mailDialogWrapper = getMailDialogWrapper();
        const previousVisibility =
          mailDialogWrapper?.style?.visibility ?? "";

        if (
          mailDialogWrapper &&
          (mailFlg === 0 || mailFlg === 1)
        ) {
          mailDialogWrapper.style.visibility = "hidden";
        }

        console.log(
          "[Attendance Native Onclick] execute",
          {
            kind: ${JSON.stringify(kind)},
            rId,
            functionName,
            onclickCode,
            mailFlg,
            pageUrl: location.href,
          }
        );

        const execute = new Function(onclickCode);
        execute.call(window);

        const mailDialogResult =
          await resolveHugMailDialog();

        if (mailDialogWrapper) {
          mailDialogWrapper.style.visibility =
            previousVisibility;
        }

        return {
          success: true,
          mode: "native-onclick",
          kind: ${JSON.stringify(kind)},
          rId,
          functionName,
          onclickCode,
          mailFlg,
          mailDialogResult,
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
  { facilityId, dateStr, mailFlg = null }
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
      "enter",
      { mailFlg }
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
  { facilityId, dateStr, mailFlg = null }
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
      "leave",
      { mailFlg }
    );

  return {
    ...result,
    success: true,
    statusMessage: NATIVE_STATUS_LEAVE,
  };
}

export function shouldDelegateEnterToNative(item) {
  return Boolean(item?.r_id);
}

export function shouldDelegateLeaveToNative(item) {
  return Boolean(item?.r_id);
}
