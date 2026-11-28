# 自動入力サンプル

```bash
  const clickEnterButton = async () => {
    false && ("① clickEnterButton 開始");

    const vw = getActiveWebview();
    false && ("② webview取得", vw);

    if (!vw) {
      console.warn("❌ webview が取得できない");
      return;
    }

    false && ("③ webview isLoading:", vw.isLoading?.());

    // WebView ready 待ち
  await vw.executeJavaScript(`
  (() => {
    const SELECTORS = [
      '[contenteditable="true"][role="textbox"]',
      '[data-testid="prompt-textarea"][contenteditable="true"]',
      'div[contenteditable="true"]'
    ];

    const findEditor = () => {
      for (const sel of SELECTORS) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return null;
    };

    const inject = (editor) => {
      editor.focus();
      editor.innerHTML = "";

      const text = ${JSON.stringify(aiText)};
      document.execCommand("insertText", false, text);

      editor.dispatchEvent(new Event("input", { bubbles: true }));
      false && ("✅ editor input injected");
    };

    return new Promise((resolve) => {
      const editor = findEditor();
      if (editor) {
        inject(editor);
        return resolve(true);
      }

      false && ("⏳ editor not found, waiting...");

      const observer = new MutationObserver(() => {
        const ed = findEditor();
        if (ed) {
          observer.disconnect();
          inject(ed);
          resolve(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        console.warn("❌ editor still not found (timeout)");
        resolve(false);
      }, 7000);
    });
  })();
  `);


    false && ("⑥ executeJavaScript 呼び出し直前");

    let success;
    try {
      success = await vw.executeJavaScript(`/* 後述 */`);
    } catch (e) {
      console.error("❌ executeJavaScript 例外", e);
      return;
    }

    false && ("⑦ executeJavaScript 完了:", success);
  };
```

# 改行を追加
```bash
  const clickEnterButton = async () => {
    false && ("① clickEnterButton 開始");

    const vw = getActiveWebview();
    false && ("② webview取得", vw);

    if (!vw) {
      console.warn("❌ webview が取得できない");
      return;
    }
    if(!isChatGPT(url)){
      console.warn("❌ ChartGPT のドメインが取得できない");
      return;
    }

    false && ("③ webview isLoading:", vw.isLoading?.());

    const TextValue = `${text1}\n\n${aiText}`;


    // WebView ready 待ち
  await vw.executeJavaScript(`
  (() => {
    const SELECTORS = [
      '[contenteditable="true"][role="textbox"]',
      '[data-testid="prompt-textarea"][contenteditable="true"]',
      'div[contenteditable="true"]'
    ];

    const findEditor = () => {
      for (const sel of SELECTORS) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return null;
    };

    const inject = (editor) => {
      editor.focus();
      editor.innerHTML = "";

      const text = ${JSON.stringify(TextValue)};
      document.execCommand("insertText", false, text);

      editor.dispatchEvent(new Event("input", { bubbles: true }));
      false && ("✅ editor input injected");
    };

    return new Promise((resolve) => {
      const editor = findEditor();
      if (editor) {
        inject(editor);
        return resolve(true);
      }

      false && ("⏳ editor not found, waiting...");

      const observer = new MutationObserver(() => {
        const ed = findEditor();
        if (ed) {
          observer.disconnect();
          inject(ed);
          resolve(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        console.warn("❌ editor still not found (timeout)");
        resolve(false);
      }, 7000);
    });
  })();
  `);


    false && ("⑥ executeJavaScript 呼び出し直前");

    let success;
    try {
      success = await vw.executeJavaScript(`/* 後述 */`);
    } catch (e) {
      console.error("❌ executeJavaScript 例外", e);
      return;
    }

    false && ("⑦ executeJavaScript 完了:", success);
  };
```

# クリック追加バージョン
```bash
  const clickEnterButton = async () => {
    false && ("① clickEnterButton 開始");

    const vw = getActiveWebview();
    false && ("② webview取得", vw);

    if (!vw) {
      console.warn("❌ webview が取得できない");
      return;
    }
    const url = vw && typeof vw.getURL === "function" ? vw.getURL() : "";
    if(!isChatGPT(url)){
      console.warn("❌ ChartGPT のドメインが取得できない");
      return;
    }

    false && ("③ webview isLoading:", vw.isLoading?.());

    const TextValue = `${text1}\n\n${aiText}`;


    // WebView ready 待ち
    await vw.executeJavaScript(`
      (() => {
        const SELECTORS = [
          '[contenteditable="true"][role="textbox"]',
          '[data-testid="prompt-textarea"][contenteditable="true"]',
          'div[contenteditable="true"]'
        ];

        const findEditor = () => {
          for (const sel of SELECTORS) {
            const el = document.querySelector(sel);
            if (el) return el;
          }
          return null;
        };

        const findButton = () =>
          document.querySelector('#composer-submit-button')
          || document.querySelector('[data-testid="send-button"]');

        const injectAndSend = (editor) => {
          editor.focus();
          editor.innerHTML = "";

          const text = ${JSON.stringify(TextValue)};
          document.execCommand("insertText", false, text);

          editor.dispatchEvent(new Event("input", { bubbles: true }));

          // 少し待ってから送信（重要）
          setTimeout(() => {
            const btn = findButton();
            if (btn && !btn.disabled) {
              btn.click();
              false && ("🚀 send button clicked");
            } else {
              console.warn("❌ send button not ready");
            }
          }, 100);
        };

        return new Promise((resolve) => {
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
            console.warn("❌ editor not found (timeout)");
            resolve(false);
          }, 7000);
        });
      })();
    `);



    false && ("⑥ executeJavaScript 呼び出し直前");

    let success;
    try {
      success = await vw.executeJavaScript(`/* 後述 */`);
    } catch (e) {
      console.error("❌ executeJavaScript 例外", e);
      return;
    }

    false && ("⑦ executeJavaScript 完了:", success);
  };
```