import { resolveWebview, executeInWebview } from "./webview.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function buildUrl(url, query = {}) {
  const base = String(url || "");
  if (!base) return base;
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
}

async function reloadWebview({ config, context, runtime }) {
  const webview = await resolveWebview(config.webviewKey, runtime);
  const targetUrl = config.url || config.URL || config.targetUrl;

  if (typeof runtime.reloadWebview === "function") {
    return runtime.reloadWebview(webview, targetUrl, config, context);
  }

  if (targetUrl) {
    const current = webview.getURL?.() || webview.src || "";
    if (String(current) === String(targetUrl) && typeof webview.reload === "function") {
      webview.reload();
    } else {
      webview.src = targetUrl;
    }
  } else if (typeof webview.reload === "function") {
    webview.reload();
  }

  return { success: true, pageUrl: targetUrl || webview.getURL?.() || "" };
}

async function fetchStep({ config, runtime }) {
  const webview = await resolveWebview(config.webviewKey, runtime);
  const url = buildUrl(config.url || config.URL || config.targetUrl, config.query);
  const method = String(config.method || "GET").toUpperCase();
  const credentials = config.credentials || "include";
  const selector = config.selector || config.extractSelector || null;
  const form = config.form && typeof config.form === "object" ? config.form : null;
  const body = config.body ?? null;
  const headers = config.headers && typeof config.headers === "object" ? config.headers : {};

  const script = `
    (async () => {
      try {
        const method = ${JSON.stringify(method)};
        const form = ${JSON.stringify(form)};
        const rawBody = ${JSON.stringify(body)};
        const headers = ${JSON.stringify(headers)};
        let requestBody;

        if (form && method !== "GET" && method !== "HEAD") {
          const params = new URLSearchParams();
          Object.entries(form).forEach(([key, value]) => {
            if (value !== undefined && value !== null) params.set(key, String(value));
          });
          requestBody = params.toString();
          if (!Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
            headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
          }
        } else if (rawBody !== null && method !== "GET" && method !== "HEAD") {
          requestBody = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);
        }

        const response = await fetch(${JSON.stringify(url)}, {
          method,
          credentials: ${JSON.stringify(credentials)},
          cache: ${JSON.stringify('no-store')},
          headers,
          ...(requestBody !== undefined ? { body: requestBody } : {})
        });
        if (!response.ok) throw new Error("HTTP error: " + response.status);
        const html = await response.text();
        const selector = ${JSON.stringify(selector)};
        if (!selector) {
          return { success: true, html, pageUrl: response.url || ${JSON.stringify(url)} };
        }
        const doc = new DOMParser().parseFromString(html, "text/html");
        const element = doc.querySelector(selector);
        if (!element) throw new Error("取得HTMLに対象要素がありません: " + selector);
        return {
          success: true,
          html: element.outerHTML,
          pageHtml: html,
          rowCount: element.querySelectorAll("tr").length,
          pageTitle: doc.title || "",
          pageUrl: response.url || ${JSON.stringify(url)}
        };
      } catch (error) {
        return { success: false, error: error?.message || String(error) };
      }
    })()
  `;

  const result = await executeInWebview(webview, script);
  if (!result?.success) throw new Error(result?.error || "fetch Stepに失敗しました");
  return config.returnObject === true ? result : (result.html ?? result);
}

async function parseStep({ config, context, runtime }) {
  const strategy = config.strategy || config.parser || "html-table";
  const handler = runtime.parsers?.[strategy];
  if (typeof handler === "function") return handler({ config, context, runtime });

  const sourceKey = config.sourceKey || config.inputKey || config.from || "attendanceHtml";
  const html = context[sourceKey];
  if (!html) throw new Error(`parse元HTMLがありません: ${sourceKey}`);

  if (strategy !== "html-table") {
    throw new Error(`未登録parse strategyです: ${strategy}`);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html), "text/html");
  const selector = config.selector || "table";
  const table = doc.querySelector(selector) || doc.querySelector("table");
  if (!table) throw new Error(`parse対象テーブルがありません: ${selector}`);

  return Array.from(table.querySelectorAll("tbody tr")).map((row, rowIndex) => ({
    rowIndex,
    cells: Array.from(row.querySelectorAll("td,th")).map((cell) => ({
      text: cell.textContent.trim(),
      html: cell.innerHTML.trim(),
    })),
    html: row.outerHTML,
    className: row.className || "",
  }));
}

async function extractStep({ config, context, runtime }) {
  const strategy = config.strategy;
  const handler = runtime.extractors?.[strategy];
  if (typeof handler !== "function") throw new Error(`未登録extract strategyです: ${strategy}`);
  return handler({ config, context, runtime });
}

async function clickStep({ config, runtime }) {
  const webview = await resolveWebview(config.webviewKey, runtime);
  const selector = config.selector;
  if (!selector) throw new Error("click Stepにselectorがありません");

  const result = await executeInWebview(webview, `
    (() => {
      try {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element) return { success: false, error: "要素が見つかりません" };
        if (element.disabled) return { success: false, error: "要素がdisabledです" };
        element.click();
        return { success: true, tagName: element.tagName, text: (element.textContent || "").trim(), pageUrl: location.href };
      } catch (error) {
        return { success: false, error: error?.message || String(error), pageUrl: location.href };
      }
    })()
  `);
  if (!result?.success) throw new Error(result?.error || `click失敗: ${selector}`);
  return result;
}

async function waitDialogStep({ config, runtime }) {
  const webview = await resolveWebview(config.webviewKey, runtime);
  const selector = config.selector;
  const pollIntervalMs = Number(config.pollIntervalMs || 50);
  const timeoutMs = Number(config.timeoutMs || config.timeout || 10000);
  if (!selector) throw new Error("wait-dialog Stepにselectorがありません");

  const result = await executeInWebview(webview, `
    (async () => {
      const selector = ${JSON.stringify(selector)};
      const poll = ${JSON.stringify(pollIntervalMs)};
      const timeout = ${JSON.stringify(timeoutMs)};
      const start = Date.now();
      const visible = (el) => {
        if (!el) return false;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      while (Date.now() - start < timeout) {
        const el = document.querySelector(selector);
        if (el && visible(el.closest(".ui-dialog") || el)) {
          return { success: true, waitedMs: Date.now() - start, pageUrl: location.href };
        }
        await new Promise((resolve) => setTimeout(resolve, poll));
      }
      return { success: false, error: "dialog wait timeout", waitedMs: Date.now() - start, pageUrl: location.href };
    })()
  `);
  if (!result?.success) throw new Error(result?.error || "dialog待機に失敗しました");
  return result;
}

async function waitUserChoiceStep(args) {
  const handler = args.runtime.waitForUserChoice;
  if (typeof handler !== "function") {
    throw new Error("wait-user-choice handlerがruntimeに登録されていません");
  }
  return handler(args);
}

async function setVariableStep({ config }) {
  return config.value;
}

async function verifyStep({ config, context, runtime }) {
  const strategy = config.strategy;
  const handler = runtime.verifiers?.[strategy];
  if (typeof handler !== "function") throw new Error(`未登録verify strategyです: ${strategy}`);
  const result = await handler({ config, context, runtime });
  if (result === false || result?.success === false) {
    throw new Error(result?.error || `verify失敗: ${strategy}`);
  }
  return result;
}

async function dispatchStep({ config, context, runtime }) {
  const name = config.dispatcher || config.name;
  const handler = runtime.dispatchers?.[name];
  if (typeof handler !== "function") throw new Error(`未登録dispatcherです: ${name}`);
  return handler({ config, context, runtime });
}

async function showToastStep({ config, runtime }) {
  const type = config.type || config.level || "success";
  const message = config.message || config.text || "";
  if (typeof runtime.showToast === "function") return runtime.showToast(type, message, config);

  if (type === "error") window.showErrorToast?.(message, Number(config.durationMs || 3000));
  else if (type === "info") window.showInfoToast?.(message, Number(config.durationMs || 3000));
  else window.showSuccessToast?.(message, Number(config.durationMs || 3000));
  return { success: true, type, message };
}

async function delayStep({ config }) {
  const ms = Number(config.ms || config.delayMs || config.durationMs || 0);
  await sleep(ms);
  return { success: true, delayedMs: ms };
}

async function runFlowStep({ config, context, runtime, executeFlow }) {
  const flowKey = config.flowKey || config.flow_key;
  if (!flowKey) throw new Error("run-flow StepにflowKeyがありません");
  const childInput = config.input && typeof config.input === "object" ? config.input : context.input;
  return executeFlow(flowKey, childInput, { runtime, parentContext: context });
}

export const builtInExecutors = {
  navigate: reloadWebview,
  "reload-webview": reloadWebview,
  fetch: fetchStep,
  parse: parseStep,
  extract: extractStep,
  click: clickStep,
  "wait-dialog": waitDialogStep,
  "wait-user-choice": waitUserChoiceStep,
  "set-variable": setVariableStep,
  verify: verifyStep,
  dispatch: dispatchStep,
  "show-toast": showToastStep,
  delay: delayStep,
  "wait-dom": delayStep,
  "run-flow": runFlowStep,
};
