// renderer/src/components/Sidebar/Tools/MemoTool/Parts/AiContents/common/send/sendPromptToDeepSeek.js
import { getActiveWebview } from "@/utils/webview/webviewState.js";

const DEEPSEEK_DOMAIN = "chat.deepseek.com";

const isDeepSeek = (url = "") =>
  typeof url === "string" && url.includes(DEEPSEEK_DOMAIN);

export async function sendPromptToDeepSeek({ textValue }) {
  console.log("① sendPromptToDeepSeek 開始");

  if (!textValue || textValue.trim() === "") {
    console.warn("❌ textValue が空");
    return false;
  }

  const vw = getActiveWebview();
  if (!vw) {
    console.warn("❌ webview が取得できない");
    return false;
  }

  const url = typeof vw.getURL === "function" ? vw.getURL() : "";
  if (!isDeepSeek(url)) {
    console.warn("❌ DeepSeek ドメインではない:", url);
    return false;
  }

  try {
    const success = await vw.executeJavaScript(`
      (() => {
        const text = ${JSON.stringify(textValue)};

        const EDITOR_SELECTORS = [
          'textarea[name="search"]',
          'textarea[placeholder*="DeepSeek"]',
          'div._24fad49 textarea',
          'textarea._27c9245',
          'textarea',
          '[contenteditable="true"][role="textbox"]',
          '[role="textbox"]'
        ];

        const findEditor = () => {
          for (const selector of EDITOR_SELECTORS) {
            const el = document.querySelector(selector);
            if (el) return el;
          }
          return null;
        };

        const findSendButton = () => {
          const selectors = [
            'div[role="button"]._52c986b',
            'div[role="button"].ds-button--primary.ds-button--filled.ds-button--circle',
            'button.ds-button--primary.ds-button--filled.ds-button--circle'
          ];

          for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el;
          }

          for (const el of document.querySelectorAll('div[role="button"], button')) {
            if (el.querySelector('svg path[d*="8.3125"]')) return el;
          }

          return null;
        };

        const isSendEnabled = (btn) =>
          btn && !btn.disabled && !btn.classList.contains('ds-button--disabled');

        const waitForSendButton = (timeoutMs = 4000, intervalMs = 100) =>
          new Promise((resolve) => {
            const startedAt = Date.now();

            const tick = () => {
              const btn = findSendButton();
              if (isSendEnabled(btn)) {
                resolve(btn);
                return;
              }

              if (Date.now() - startedAt >= timeoutMs) {
                resolve(null);
                return;
              }

              setTimeout(tick, intervalMs);
            };

            tick();
          });

        const injectText = (editor) => {
          editor.focus();

          if (editor.tagName === 'TEXTAREA') {
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              'value'
            )?.set;

            if (setter) {
              setter.call(editor, text);
            } else {
              editor.value = text;
            }

            editor.dispatchEvent(new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: text
            }));
            editor.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }

          editor.innerHTML = '';
          document.execCommand('insertText', false, text);
          editor.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text
          }));
        };

        const clickSendButton = (btn) => {
          btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
          btn.click();
        };

        const sendFromEditor = async (editor) => {
          injectText(editor);

          const btn = await waitForSendButton();
          if (btn) {
            clickSendButton(btn);
            return true;
          }

          editor.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          }));
          return true;
        };

        return new Promise((resolve) => {
          const run = async () => {
            const editor = findEditor();
            if (editor) {
              resolve(await sendFromEditor(editor));
              return;
            }

            let attempts = 0;
            const observer = new MutationObserver(async () => {
              const ed = findEditor();
              if (!ed) {
                if (++attempts > 30) {
                  observer.disconnect();
                  resolve(false);
                }
                return;
              }

              observer.disconnect();
              resolve(await sendFromEditor(ed));
            });

            observer.observe(document.body, {
              childList: true,
              subtree: true
            });

            setTimeout(() => {
              observer.disconnect();
              resolve(false);
            }, 10000);
          };

          run();
        });
      })();
    `);

    console.log("✅ sendPromptToDeepSeek 結果:", success);
    return success;
  } catch (e) {
    console.error("❌ executeJavaScript 失敗", e);
    return false;
  }
}
