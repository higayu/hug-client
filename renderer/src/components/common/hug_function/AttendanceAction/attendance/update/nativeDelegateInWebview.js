/**
 * HUG本体WebView上の入退室ボタンそのものを button.click() で実行する。
 *
 * sendEnterMail / sendLeaveMail をRenderer側から直接呼ばない。
 * click後にHUG側の #addtend_dialog_mail が展開されたかを検知してRendererへ返す。
 */

import { loadAttendanceDetailInWebview } from "../_shared/webview.js";

export const NATIVE_STATUS_ENTER =
  "HUG本体の入室処理を開始しました。";

export const NATIVE_STATUS_LEAVE =
  "HUG本体の退室処理を開始しました。";

function getKindConfig(kind, nativeConfig = {}) {
  if (kind === "enter") {
    return {
      cellPrefix: nativeConfig.cellIdPrefix || "enter",
      functionName: nativeConfig.functionName || "sendEnterMail",
      selectorTemplate: nativeConfig.selectorTemplate || null,
      label: "入室",
    };
  }

  if (kind === "leave") {
    return {
      cellPrefix: nativeConfig.cellIdPrefix || "leave",
      functionName: nativeConfig.functionName || "sendLeaveMail",
      selectorTemplate: nativeConfig.selectorTemplate || null,
      label: "退室",
    };
  }

  throw new Error(`未対応の入退室種別です: ${kind}`);
}

/**
 * HUGの最新 attendance.php 上から対象ボタンを探し、
 * onclickの関数を直接実行せず、そのDOMボタン自体を button.click() する。
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
  const nativeConfig = options?.nativeConfig || {};
  const { cellPrefix, functionName, selectorTemplate, label } =
    getKindConfig(kind, nativeConfig);

  const script = `
    (async () => {
      const rId = ${JSON.stringify(String(rId))};
      const cellId = ${JSON.stringify(cellPrefix)} + rId;
      const functionName = ${JSON.stringify(functionName)};
      const selectorTemplate = ${JSON.stringify(selectorTemplate)};
      const label = ${JSON.stringify(label)};

      const sleep = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const isVisible = (element) => {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity || 1) !== 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      const detectMailDialog = async () => {
        const startedAt = Date.now();
        const timeoutMs = 3000;

        while (Date.now() - startedAt < timeoutMs) {
          const dialog = document.getElementById("addtend_dialog_mail");
          const wrapper = dialog?.closest(".ui-dialog") || null;
          const visibleTarget = wrapper || dialog;

          if (dialog && isVisible(visibleTarget)) {
            const buttons = Array.from(
              dialog.querySelectorAll('.send_mail_button')
            ).map((button) => ({
              text: (button.textContent || "").trim(),
              sendMail: button.getAttribute("data-send_mail"),
              disabled: Boolean(button.disabled),
              className: button.className || "",
            }));

            const result = {
              detected: true,
              dialogId: dialog.id,
              wrapperClass: wrapper?.className || "",
              buttons,
              detectedAfterMs: Date.now() - startedAt,
            };

            console.log(
              "[Attendance DOM Click] HUGメール通知モーダル検知",
              result
            );

            return result;
          }

          await sleep(25);
        }

        const result = {
          detected: false,
          reason: "hug-mail-dialog-not-opened",
          waitedMs: Date.now() - startedAt,
        };

        console.log(
          "[Attendance DOM Click] HUGメール通知モーダル未検知",
          result
        );

        return result;
      };

      try {
        const cell = document.getElementById(cellId);

        const resolvedSelector = selectorTemplate
          ? selectorTemplate.replace(/\\{\\{\\s*recordId\\s*\\}\\}/g, rId)
          : null;

        const button = resolvedSelector
          ? document.querySelector(resolvedSelector)
          : cell?.querySelector(
              "button[onclick*='" + functionName + "']"
            );

        if (!cell && !resolvedSelector) {
          return {
            success: false,
            error: label + "セルが見つかりません: #" + cellId,
            pageUrl: location.href,
          };
        }

        if (!button) {
          return {
            success: false,
            error:
              label +
              "ボタンが見つかりません: " +
              (resolvedSelector ||
                ("#" + cellId + " button[onclick*=\\'" + functionName + "\\']")),
            pageUrl: location.href,
          };
        }

        const onclickCode = button.getAttribute("onclick") || "";

        const buttonInfo = {
          id: button.id || null,
          className: button.className || "",
          text: (button.textContent || "").trim(),
          onclick: onclickCode,
          outerHTML: (button.outerHTML || "").slice(0, 500),
        };

        console.log(
          "[Attendance DOM Click] WebView内の実ボタンをclickします",
          {
            kind: ${JSON.stringify(kind)},
            rId,
            resolvedSelector,
            buttonInfo,
            pageUrl: location.href,
          }
        );

        // sendEnterMail/sendLeaveMailをRendererから直接呼び出さない。
        // WebView内に存在するHUG本体の実ボタン自体をクリックする。
        button.click();

        console.log(
          "[Attendance DOM Click] button.click() 完了",
          {
            kind: ${JSON.stringify(kind)},
            rId,
            pageUrl: location.href,
          }
        );

        // click後にHUG側がメール通知モーダルを開く場合があるため検知する。
        const mailDialog = await detectMailDialog();

        return {
          success: true,
          mode: "dom-button-click",
          kind: ${JSON.stringify(kind)},
          rId,
          buttonInfo,
          mailDialog,
          mailDialogDetected: Boolean(mailDialog?.detected),
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

  console.log("[Attendance DOM Click][renderer] executeJavaScript開始", {
    kind,
    rId: String(rId),
    cellPrefix,
    selectorTemplate,
    functionName,
  });

  const result = await webview.executeJavaScript(script);

  console.log("[Attendance DOM Click][renderer] 実行結果", result);

  if (!result?.success) {
    throw new Error(
      result?.error ||
        `HUG本体の${label}ボタンクリックに失敗しました`
    );
  }

  if (result?.mailDialogDetected) {
    console.log("[Attendance DOM Click][renderer] HUGメールモーダルを検知", {
      kind,
      rId: String(rId),
      mailDialog: result.mailDialog,
    });
  }

  return result;
}

/**
 * HUG本体の入室処理を実行する。
 */
export async function tryNativeEnter(
  webview,
  item,
  { facilityId, dateStr, mailFlg = null, nativeConfig = {} }
) {
  if (!webview) {
    throw new Error("HUG webview がありません");
  }

  if (!item?.r_id) {
    throw new Error("入室対象の r_id がありません");
  }

  if (nativeConfig.reloadAttendanceDetailBeforeExecute !== false) {
    await loadAttendanceDetailInWebview(
      webview,
      facilityId,
      dateStr
    );
  }

  const result =
    await executeNativeOnclickInWebview(
      webview,
      item.r_id,
      "enter",
      { mailFlg, nativeConfig }
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
  { facilityId, dateStr, mailFlg = null, nativeConfig = {} }
) {
  if (!webview) {
    throw new Error("HUG webview がありません");
  }

  if (!item?.r_id) {
    throw new Error("退室対象の r_id がありません");
  }

  if (nativeConfig.reloadAttendanceDetailBeforeExecute !== false) {
    await loadAttendanceDetailInWebview(
      webview,
      facilityId,
      dateStr
    );
  }

  const result =
    await executeNativeOnclickInWebview(
      webview,
      item.r_id,
      "leave",
      { mailFlg, nativeConfig }
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


/**
 * HUG WebView内に開いている本物のメール通知確認モーダルで、
 * 「通知する / 通知しない」の実DOMボタンをクリックする。
 *
 * Renderer側の MailNotificationModal は選択UIだけを担当し、
 * 実処理はHUG側 .send_mail_button の click() に委譲する。
 */
export async function clickHugMailDialogChoice(webview, sendMail) {
  if (!webview) {
    throw new Error("HUG webview がありません");
  }

  const normalizedSendMail = Number(sendMail) === 1 ? 1 : 0;
  const script = `
    (() => {
      const sendMail = ${JSON.stringify(normalizedSendMail)};
      const dialog = document.getElementById("addtend_dialog_mail");
      const wrapper = dialog?.closest(".ui-dialog") || null;

      if (!dialog) {
        return {
          success: false,
          error: "HUGメール通知モーダル #addtend_dialog_mail が見つかりません",
          pageUrl: location.href,
        };
      }

      const target = dialog.querySelector(
        '.send_mail_button[data-send_mail="' + sendMail + '"]'
      );

      if (!target) {
        return {
          success: false,
          error: "HUGメール通知モーダルの選択ボタンが見つかりません: data-send_mail=" + sendMail,
          dialogHtml: (dialog.outerHTML || "").slice(0, 1500),
          pageUrl: location.href,
        };
      }

      const info = {
        sendMail,
        text: (target.textContent || "").trim(),
        className: target.className || "",
        dataSendMail: target.getAttribute("data-send_mail"),
        dialogVisible: Boolean(wrapper && wrapper.offsetParent !== null),
      };

      console.log("[Attendance MailDialog] HUG実ボタンをclickします", info);
      target.click();

      return {
        success: true,
        mode: "hug-mail-dialog-dom-click",
        ...info,
        pageUrl: location.href,
      };
    })()
  `;

  console.log("[Attendance MailDialog][renderer] 選択実行", {
    sendMail: normalizedSendMail,
  });

  const result = await webview.executeJavaScript(script);
  console.log("[Attendance MailDialog][renderer] 選択結果", result);

  if (!result?.success) {
    throw new Error(result?.error || "HUGメール通知モーダルの操作に失敗しました");
  }

  return result;
}

/**
 * Renderer側でキャンセルされた場合、HUG側に残っているメール通知モーダルを
 * タイトルバーの実DOM閉じるボタンで閉じる。
 */
export async function cancelHugMailDialog(webview) {
  if (!webview) {
    throw new Error("HUG webview がありません");
  }

  const script = `
    (() => {
      const dialog = document.getElementById("addtend_dialog_mail");
      if (!dialog) {
        return { success: true, alreadyClosed: true, pageUrl: location.href };
      }

      const wrapper = dialog.closest(".ui-dialog");
      const closeButton = wrapper?.querySelector(".ui-dialog-titlebar-close");

      if (!closeButton) {
        return {
          success: false,
          error: "HUGメール通知モーダルの閉じるボタンが見つかりません",
          pageUrl: location.href,
        };
      }

      console.log("[Attendance MailDialog] HUGモーダルをキャンセルします");
      closeButton.click();

      return {
        success: true,
        mode: "hug-mail-dialog-cancel-dom-click",
        pageUrl: location.href,
      };
    })()
  `;

  const result = await webview.executeJavaScript(script);
  console.log("[Attendance MailDialog][renderer] キャンセル結果", result);

  if (!result?.success) {
    throw new Error(result?.error || "HUGメール通知モーダルのキャンセルに失敗しました");
  }

  return result;
}
