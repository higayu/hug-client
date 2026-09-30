/**
 * HUG本体WebView上の入退室ボタンそのものを button.click() で実行する。
 *
 * sendEnterMail / sendLeaveMail をRenderer側から直接呼ばない。
 * HUG側ボタンをclickする前にMutationObserverを開始し、#addtend_dialog_mail の表示を検知したらRendererで選択済みの通知値を自動クリックする。
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
  const normalizedMailFlg = Number(options?.mailFlg) === 1 ? 1 : 0;
  const { cellPrefix, functionName, selectorTemplate, label } =
    getKindConfig(kind, nativeConfig);

  const script = `
    (async () => {
      const rId = ${JSON.stringify(String(rId))};
      const cellId = ${JSON.stringify(cellPrefix)} + rId;
      const functionName = ${JSON.stringify(functionName)};
      const selectorTemplate = ${JSON.stringify(selectorTemplate)};
      const label = ${JSON.stringify(label)};
      const selectedSendMail = ${JSON.stringify(normalizedMailFlg)};

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

      /**
       * HUG側メールモーダルの表示をMutationObserverで待ち、
       * Rendererで選択済みの data-send_mail=1/0 を自動クリックする。
       *
       * #addtend_dialog_mail 自体が事前にDOMへ存在していて、
       * jQuery UIがstyle/classだけ変更するケースも拾うため attributes も監視する。
       */
      const waitAndApplyMailChoice = () =>
        new Promise((resolve) => {
          const startedAt = Date.now();
          const timeoutMs = 10000;
          let finished = false;
          let observer = null;
          let timer = null;

          const finish = (result) => {
            if (finished) return;
            finished = true;
            if (observer) observer.disconnect();
            if (timer) clearTimeout(timer);
            resolve(result);
          };

          const tryApply = () => {
            const dialog = document.getElementById("addtend_dialog_mail");
            if (!dialog) return false;

            const wrapper = dialog.closest(".ui-dialog");
            const visibleTarget = wrapper || dialog;
            if (!isVisible(visibleTarget)) return false;

            const target = dialog.querySelector(
              '.send_mail_button[data-send_mail="' + selectedSendMail + '"]'
            );
            if (!target || target.disabled) return false;

            const info = {
              detected: true,
              autoSelected: true,
              sendMail: selectedSendMail,
              text: (target.textContent || "").trim(),
              dialogId: dialog.id,
              wrapperClass: wrapper?.className || "",
              detectedAfterMs: Date.now() - startedAt,
            };

            console.log(
              "[Attendance MutationObserver] HUGメールモーダル検知・自動選択",
              info
            );

            // HUG本来のクリックイベントを通す。
            target.click();
            finish(info);
            return true;
          };

          observer = new MutationObserver(() => {
            tryApply();
          });

          observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class", "aria-hidden"],
          });

          // 既に表示済みのケースにも対応。
          tryApply();

          timer = setTimeout(() => {
            const dialog = document.getElementById("addtend_dialog_mail");
            const wrapper = dialog?.closest(".ui-dialog") || null;
            finish({
              detected: false,
              autoSelected: false,
              reason: "hug-mail-dialog-not-opened",
              waitedMs: Date.now() - startedAt,
              dialogExists: Boolean(dialog),
              dialogVisible: Boolean(dialog && isVisible(wrapper || dialog)),
              pageUrl: location.href,
            });
          }, timeoutMs);
        });

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
          "[Attendance DOM Click] MutationObserverを開始してからHUG実ボタンをclickします",
          {
            kind: ${JSON.stringify(kind)},
            rId,
            selectedSendMail,
            resolvedSelector,
            buttonInfo,
            pageUrl: location.href,
          }
        );

        // 重要: HUGボタンを押す前に監視を開始する。
        // sendEnterMail/sendLeaveMailが同期的にモーダルを開いても取りこぼさない。
        const mailDialogPromise = waitAndApplyMailChoice();

        // HUG本体の実ボタンをクリックして、本来のsendEnterMail/sendLeaveMailを発火。
        button.click();

        const mailDialog = await mailDialogPromise;

        if (!mailDialog?.detected) {
          return {
            success: false,
            mode: "dom-button-click-mutation-observer",
            kind: ${JSON.stringify(kind)},
            rId,
            buttonInfo,
            mailDialog,
            error:
              "HUG側のメール通知モーダルを検知できませんでした。" +
              " HUG本体の処理は開始されています。",
            pageUrl: location.href,
          };
        }

        return {
          success: true,
          mode: "dom-button-click-mutation-observer",
          kind: ${JSON.stringify(kind)},
          rId,
          buttonInfo,
          mailDialog,
          mailDialogDetected: true,
          mailDialogAutoSelected: true,
          selectedSendMail,
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
    mailFlg: normalizedMailFlg,
  });

  const result = await webview.executeJavaScript(script);

  console.log("[Attendance DOM Click][renderer] 実行結果", result);

  if (!result?.success) {
    throw new Error(
      result?.error ||
        `HUG本体の${label}ボタンクリックに失敗しました`
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
