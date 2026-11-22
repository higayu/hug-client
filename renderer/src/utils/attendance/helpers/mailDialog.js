/**
 * 拡張 mail-dialog.js 相当（renderer document 上のダイアログ）
 */

import { isMailFromEnterOnclick } from "../post/enterPost.js";
import { isMailFromLeaveOnclick } from "../post/leavePost.js";

export class MailDialogCancelledError extends Error {
  constructor() {
    super("メール送信の選択がキャンセルされました");
    this.name = "MailDialogCancelledError";
  }
}

const STYLE_ID = "hug-mail-dialog-style-renderer";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .hug-mail-dialog-overlay-r {
      position: fixed; inset: 0; z-index: 10000000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.45);
    }
    .hug-mail-dialog-box-r {
      min-width: 320px; max-width: 90vw; padding: 20px 24px 18px;
      background: #fff; border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.28);
      font-size: 14px; color: #222; text-align: center;
    }
    .hug-mail-dialog-title-r { margin: 0 0 8px; font-size: 16px; font-weight: bold; }
    .hug-mail-dialog-sub-r { margin: 0 0 18px; font-size: 13px; color: #555; }
    .hug-mail-dialog-actions-r {
      display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
    }
    .hug-mail-dialog-actions-r button {
      min-width: 120px; padding: 8px 16px; border: 1px solid #888;
      border-radius: 4px; background: #f5f5f5; font-size: 14px; cursor: pointer;
    }
    .hug-mail-dialog-actions-r .hug-mail-send-yes-r {
      background: #337ab7; border-color: #2e6da4; color: #fff;
    }
  `;
  document.head.appendChild(style);
}

/**
 * @param {{ childName?: string, actionLabel?: string }} [options]
 * @returns {Promise<0|1>}
 */
export function promptMailSend(options = {}) {
  ensureStyles();

  const childName = String(options.childName || "")
    .replace(/\s+/g, " ")
    .trim();
  const actionLabel = String(options.actionLabel || "").trim();
  const subParts = [];
  if (childName) subParts.push(childName);
  if (actionLabel) subParts.push(`${actionLabel}の記録`);
  const subText =
    subParts.length > 0
      ? subParts.join(" — ")
      : "保護者への通知の有無を選んでください";

  return new Promise((resolve, reject) => {
    const overlay = document.createElement("div");
    overlay.className = "hug-mail-dialog-overlay-r";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    overlay.innerHTML = `
      <div class="hug-mail-dialog-box-r">
        <p class="hug-mail-dialog-title-r">保護者様に通知をしてもよろしいですか？</p>
        <p class="hug-mail-dialog-sub-r"></p>
        <div class="hug-mail-dialog-actions-r">
          <button type="button" class="hug-mail-send-yes-r">通知する</button>
          <button type="button" class="hug-mail-send-no-r">通知しない</button>
          <button type="button" class="hug-mail-cancel-r">キャンセル</button>
        </div>
      </div>
    `;

    overlay.querySelector(".hug-mail-dialog-sub-r").textContent = subText;
    document.body.appendChild(overlay);

    const finish = (fn) => {
      document.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      fn();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        finish(() => reject(new MailDialogCancelledError()));
      }
    };
    document.addEventListener("keydown", onKeyDown);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        finish(() => reject(new MailDialogCancelledError()));
      }
    });

    overlay.querySelector(".hug-mail-send-yes-r").addEventListener("click", () =>
      finish(() => resolve(1))
    );
    overlay.querySelector(".hug-mail-send-no-r").addEventListener("click", () =>
      finish(() => resolve(0))
    );
    overlay.querySelector(".hug-mail-cancel-r").addEventListener("click", () =>
      finish(() => reject(new MailDialogCancelledError()))
    );
  });
}

/** 拡張 isEnterMailEnabled */
export function isEnterMailEnabled(item) {
  if (item?.isEnterMailEnabled === true) return true;
  if (Number(item?.enterIsMailResolved) === 1) return true;
  if (item?.enterOnclick && isMailFromEnterOnclick(item.enterOnclick)) return true;
  if (item?.enterIsMail != null && item.enterIsMail !== "") {
    return Number(item.enterIsMail) === 1;
  }
  return false;
}

/** 拡張 isLeaveMailEnabled */
export function isLeaveMailEnabled(item) {
  if (item?.leaveOnclick && isMailFromLeaveOnclick(item.leaveOnclick)) return true;
  if (item?.leaveIsMail != null && item.leaveIsMail !== "") {
    return Number(item.leaveIsMail) === 1;
  }
  return false;
}

/**
 * @param {object} item
 * @param {"enter"|"leave"} kind
 * @returns {Promise<0|1>}
 */
export async function resolveMailFlgForPost(item, kind) {
  const needs =
    kind === "enter" ? isEnterMailEnabled(item) : isLeaveMailEnabled(item);
  if (!needs) return 0;

  const actionLabel = kind === "enter" ? "入室" : "退室";
  const childName = String(item?.name || "").replace(/\s+/g, " ").trim();

  return promptMailSend({ childName, actionLabel });
}
