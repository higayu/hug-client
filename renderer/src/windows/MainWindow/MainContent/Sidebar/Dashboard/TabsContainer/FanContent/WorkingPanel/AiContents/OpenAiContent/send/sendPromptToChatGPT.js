// renderer/src/components/Sidebar/Tools/MemoTool/Parts/AiContents/common/send/sendPromptToChatGPT.js
import { getActiveWebview } from "@/utils/webview/webviewState.js";

const OPEN_AI_DOMAIN = "chatgpt.com";

const isChatGPT = (url = "") =>
  typeof url === "string" && url.includes(OPEN_AI_DOMAIN);

export async function sendPromptToChatGPT({ textValue }) {
  console.log("① sendPromptToChatGPT 開始");

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
  if (!isChatGPT(url)) {
    console.warn("❌ ChatGPT ドメインではない:", url);
    return false;
  }

  try {
    const success = await vw.executeJavaScript(`
      (() => {
        const SELECTORS = [
          '[contenteditable="true"][role="textbox"]',
          '[data-testid="prompt-textarea"][contenteditable="true"]',
          'div[contenteditable="true"]'
        ];

        const findEditor = () =>
          SELECTORS.map(s => document.querySelector(s)).find(Boolean);

        const findButton = () =>
          document.querySelector('#composer-submit-button')
          || document.querySelector('[data-testid="send-button"]');

        const injectAndSend = (editor) => {
          editor.focus();
          editor.innerHTML = "";

          document.execCommand(
            "insertText",
            false,
            ${JSON.stringify(textValue)}
          );

          editor.dispatchEvent(new Event("input", { bubbles: true }));

          setTimeout(() => {
            const btn = findButton();
            if (btn && !btn.disabled) {
              btn.click();
            }
          }, 100);
        };

        return new Promise(resolve => {
          const editor = findEditor();
          if (editor) {
            injectAndSend(editor);
            return resolve(true);
          }

          const observer = new MutationObserver(() => {
            const ed = findEditor();
            if (ed) {
              observer.disconnect();
              injectAndSend(ed);
              resolve(true);
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true
          });

          setTimeout(() => {
            observer.disconnect();
            resolve(false);
          }, 7000);
        });
      })();
    `);

    return success;
  } catch (e) {
    console.error("❌ executeJavaScript 失敗", e);
    return false;
  }
}
