// src/utils/attendance/_shared/clickExecutor.js

export function buildWebviewClickExecutor({ onclickCode, buttonText, extraSelector }) {
    const hasOnclickCode = onclickCode && typeof onclickCode === "string";
    const buttonTextJson = JSON.stringify(buttonText);
    const errorMsgJson = JSON.stringify(buttonText + " ボタンが見つかりません");
  
    let extraSelectorPart = "";
    if (extraSelector) {
      const selectorJson = JSON.stringify(extraSelector);
      extraSelectorPart = `
        if (!btn) {
          try {
            const allButtons = Array.from(document.querySelectorAll('button'));
            btn = allButtons.find(b => {
              try { return b.matches(${selectorJson}); } catch (e) { return false; }
            });
          } catch (e) {
            console.warn("selector エラー:", e);
          }
        }`;
    }
  
    const onclickCodeJson = JSON.stringify(onclickCode || "");
    const onclickCodePart = hasOnclickCode
      ? `
          try {
            logInfo.type = 'onclick_direct';
            logInfo.onclickCode = ${onclickCodeJson};
  
            const onclickFn = new Function(${onclickCodeJson});
            onclickFn();
  
            return { success: true, logInfo };
          } catch (err) {
            logInfo.onclickError = err.message;
            console.warn("⚠ onclick エラー → fallbackへ:", err);
          }`
      : "";
  
    return `
      (function() {
        try {
          const logInfo = {};
          ${onclickCodePart}
  
          const buttons = Array.from(document.querySelectorAll('button'));
          let btn = buttons.find(b => b.textContent.trim() === ${buttonTextJson});
          ${extraSelectorPart}
  
          if (!btn) return { success: false, error: ${errorMsgJson} };
  
          logInfo.type = 'dom_button';
          logInfo.button = {
            id: btn.id || null,
            name: btn.name || null,
            classList: [...btn.classList],
            text: btn.textContent.trim(),
            outerHTML: btn.outerHTML.substring(0, 200)
          };
  
          btn.click();
          return { success: true, logInfo };
  
        } catch (error) {
          return { success: false, error: error.message || String(error) };
        }
      })();
    `;
  }
  