// renderer/src/components/Sidebar/Tools/MemoTool/Parts/AiContents/common/send/sendPromptToChatGPT.js
import { getActiveWebview } from "@/utils/webview/webviewState.js";

const OPEN_AI_DOMAIN = "chatgpt.com";

const isChatGPT = (url = "") =>
  typeof url === "string" && url.includes(OPEN_AI_DOMAIN);

/**
 * ChatGPT を表示している WebView を取得する。
 *
 * DevTools の対象を「現在アクティブな WebView」に変更した後でも、
 * ChatGPT の送信処理は ChatGPT WebView を確実に対象にする。
 */
const getChatGPTWebview = () => {
  const activeWebview = getActiveWebview();

  if (activeWebview) {
    try {
      const activeUrl =
        typeof activeWebview.getURL === "function" ? activeWebview.getURL() : "";

      if (isChatGPT(activeUrl)) {
        return activeWebview;
      }
    } catch (e) {
      console.warn("⚠️ activeWebview のURL取得に失敗", e);
    }
  }

  const webviews = Array.from(document.querySelectorAll("webview"));

  for (const webview of webviews) {
    try {
      const url = typeof webview.getURL === "function" ? webview.getURL() : "";
      if (isChatGPT(url)) {
        return webview;
      }
    } catch {
      // WebView の読み込み途中などは無視する。
    }
  }

  return null;
};

export async function sendPromptToChatGPT({ textValue }) {
  console.log("① sendPromptToChatGPT 開始");

  if (!textValue || textValue.trim() === "") {
    console.warn("❌ textValue が空");
    return false;
  }

  const vw = getChatGPTWebview();
  if (!vw) {
    console.warn("❌ ChatGPT の webview が取得できない");
    return false;
  }

  const url = typeof vw.getURL === "function" ? vw.getURL() : "";
  if (!isChatGPT(url)) {
    console.warn("❌ ChatGPT ドメインではない:", url);
    return false;
  }

  try {
    const success = await vw.executeJavaScript(`
      (async () => {
        const text = ${JSON.stringify(textValue)};

        // 2026-10-03 時点の ChatGPT composer を優先して取得する。
        // ページ全体の contenteditable は Writing Block 等を誤取得するため使わない。
        const COMPOSER_SELECTORS = [
          'form[data-chatgpt-composer]',
          'form[data-composer-placement="thread"]'
        ];

        const EDITOR_SELECTORS = [
          'div.ProseMirror[data-composer-markdown][contenteditable="true"][role="textbox"]',
          '[data-composer-markdown][contenteditable="true"][role="textbox"]',
          '#prompt-textarea[contenteditable="true"]',
          '[data-testid="prompt-textarea"][contenteditable="true"]',
          'textarea'
        ];

        const SEND_BUTTON_SELECTORS = [
          'button[type="submit"][aria-label="送信"]',
          'button[type="submit"][aria-label="Send"]',
          '#composer-submit-button',
          '[data-testid="send-button"]',
          'button[type="submit"]'
        ];

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const findComposer = () => {
          for (const selector of COMPOSER_SELECTORS) {
            const form = document.querySelector(selector);
            if (form) return form;
          }
          return null;
        };

        const findEditor = (form) => {
          if (!form) return null;

          for (const selector of EDITOR_SELECTORS) {
            const editor = form.querySelector(selector);
            if (editor) return editor;
          }

          return null;
        };

        const findSendButton = (form) => {
          if (!form) return null;

          for (const selector of SEND_BUTTON_SELECTORS) {
            const button = form.querySelector(selector);
            if (button) return button;
          }

          return null;
        };

        const isSendEnabled = (button) =>
          Boolean(
            button &&
            !button.disabled &&
            button.getAttribute('aria-disabled') !== 'true'
          );

        const waitForComposerAndEditor = async (timeoutMs = 10000) => {
          const startedAt = Date.now();

          while (Date.now() - startedAt < timeoutMs) {
            const form = findComposer();
            const editor = findEditor(form);

            if (form && editor) {
              return { form, editor };
            }

            await sleep(100);
          }

          return null;
        };

        const waitForSendButton = async (form, timeoutMs = 8000) => {
          const startedAt = Date.now();

          while (Date.now() - startedAt < timeoutMs) {
            const button = findSendButton(form);

            if (isSendEnabled(button)) {
              return button;
            }

            await sleep(100);
          }

          return null;
        };

        const replaceTextareaValue = (editor) => {
          editor.focus();

          const valueSetter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            'value'
          )?.set;

          if (valueSetter) {
            valueSetter.call(editor, text);
          } else {
            editor.value = text;
          }

          editor.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            composed: true,
            inputType: 'insertText',
            data: text
          }));

          editor.dispatchEvent(new Event('change', {
            bubbles: true,
            composed: true
          }));
        };

        const replaceProseMirrorValue = (editor) => {
          editor.focus();

          // ProseMirror 内を全選択して、ブラウザの編集コマンド経由で置換する。
          // textContent / innerHTML の直接代入より React / ProseMirror 側へ
          // 入力として認識されやすい。
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editor);
          selection.removeAllRanges();
          selection.addRange(range);

          let inserted = false;

          try {
            inserted = document.execCommand('insertText', false, text);
          } catch (error) {
            console.warn('ChatGPT execCommand(insertText) 失敗', error);
          }

          if (!inserted) {
            // execCommand が利用できない場合のみフォールバックする。
            editor.replaceChildren();
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            editor.appendChild(paragraph);

            editor.dispatchEvent(new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              composed: true,
              inputType: 'insertText',
              data: text
            }));
          }

          // 一部の ChatGPT / ProseMirror 更新では input イベントを追加で
          // 通知した方が状態反映が安定する。
          editor.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            composed: true,
            inputType: 'insertText',
            data: text
          }));
        };

        const injectText = (editor) => {
          if (editor instanceof HTMLTextAreaElement) {
            replaceTextareaValue(editor);
            return;
          }

          replaceProseMirrorValue(editor);
        };

        const composer = await waitForComposerAndEditor();

        if (!composer) {
          console.warn('❌ ChatGPT composer または入力欄が見つからない');
          return false;
        }

        const { form, editor } = composer;

        console.log('ChatGPT composer 入力対象:', {
          formDataChatgptComposer: form.hasAttribute('data-chatgpt-composer'),
          tagName: editor.tagName,
          className: editor.className,
          role: editor.getAttribute('role'),
          dataComposerMarkdown: editor.hasAttribute('data-composer-markdown')
        });

        injectText(editor);

        // 入力前の空状態では送信ボタンが存在しないため、
        // 入力後に React が送信ボタンへ切り替えるまで待つ。
        const sendButton = await waitForSendButton(form);

        if (!sendButton) {
          console.warn('❌ ChatGPT送信ボタンが生成・有効化されなかった', {
            editorText: editor.innerText || editor.value || '',
            editorHtml: editor.innerHTML || '',
            formHtmlSample: form.innerHTML.slice(-2000)
          });
          return false;
        }

        console.log('ChatGPT送信ボタン取得:', {
          type: sendButton.type,
          ariaLabel: sendButton.getAttribute('aria-label'),
          disabled: sendButton.disabled,
          ariaDisabled: sendButton.getAttribute('aria-disabled')
        });

        sendButton.focus();
        sendButton.click();

        return true;
      })();
    `);

    console.log("✅ sendPromptToChatGPT 結果:", success);
    return success;
  } catch (e) {
    console.error("❌ executeJavaScript 失敗", e);
    return false;
  }
}
