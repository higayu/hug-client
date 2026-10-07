import { executeFlowV2 } from "@/components/WebAutomationV2";
import { getActiveWebview } from "@/utils/webview/webviewState.js";

function replaceTemplateString(value, vars) {
  if (typeof value !== "string") return value;
  const exact = value.match(/^\{\{\s*([^{}]+?)\s*\}\}$/);
  if (exact) return getByPath(vars, exact[1]);

  return value.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, path) => {
    const resolved = getByPath(vars, path);
    return resolved == null ? "" : String(resolved);
  });
}

function expandTemplates(value, vars) {
  if (Array.isArray(value)) return value.map((item) => expandTemplates(item, vars));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        replaceTemplateString(key, vars),
        expandTemplates(item, vars),
      ]),
    );
  }
  return replaceTemplateString(value, vars);
}

function getByPath(value, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((current, key) => (current == null ? undefined : current[key]), value);
}

function matchesUrl(url, pattern) {
  if (!pattern) return true;
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  return patterns.some((item) => {
    const p = String(item || "").trim();
    if (!p) return true;
    if (p.includes("*")) {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
      return new RegExp(`^${escaped}$`, "i").test(url);
    }
    return url.includes(p);
  });
}

function getWebviewUrl(webview) {
  try {
    return webview?.getURL?.() || webview?.getAttribute?.("src") || "";
  } catch {
    return webview?.getAttribute?.("src") || "";
  }
}

function findWebview(config, targetUrlPattern) {
  const domains = (config?.webview?.domains || config?.domains || [])
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  const candidates = [];
  const active = getActiveWebview();
  if (active) candidates.push(active);
  for (const webview of Array.from(document.querySelectorAll("webview"))) {
    if (!candidates.includes(webview)) candidates.push(webview);
  }

  return candidates.find((webview) => {
    const url = getWebviewUrl(webview);
    const domainOk = domains.length === 0 || domains.some((domain) => url.includes(domain));
    return domainOk && matchesUrl(url, targetUrlPattern);
  }) || null;
}

async function executeWebviewPrompt({ rule, config, input }) {
  const webview = findWebview(config, rule?.target_url_pattern);
  if (!webview) throw new Error("対象AI WebViewが見つかりません");

  const currentUrl = getWebviewUrl(webview);
  if (!matchesUrl(currentUrl, rule?.target_url_pattern)) {
    throw new Error(`対象URLが一致しません: ${currentUrl}`);
  }

  const textValue = String(input?.textValue ?? "").trim();
  if (!textValue) throw new Error("Prompt is empty");

  const dom = config?.dom || {};
  const wait = config?.wait || {};
  const payload = {
    text: textValue,
    scopeSelectors: dom.scopeSelectors || [],
    editorSelectors: dom.editorSelectors || [],
    sendButtonSelectors: dom.sendButtonSelectors || [],
    sendButtonFallbackSvgPathContains: dom.sendButtonFallbackSvgPathContains || null,
    disabledClassNames: dom.disabledClassNames || [],
    editorTimeoutMs: Number(wait.editorTimeoutMs ?? 10000),
    sendButtonTimeoutMs: Number(wait.sendButtonTimeoutMs ?? 8000),
    intervalMs: Number(wait.intervalMs ?? 100),
    enterFallback: Boolean(dom.enterFallback),
  };

  const result = await webview.executeJavaScript(`
    (async () => {
      const cfg = ${JSON.stringify(payload)};
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const findScope = () => {
        for (const selector of cfg.scopeSelectors) {
          try {
            const el = document.querySelector(selector);
            if (el) return el;
          } catch (_) {
            // ChatGPT側のDOM変更などで一部selectorが無効でも、次候補を試す。
          }
        }

        // scopeSelectorsがすべて見つからない場合でも、
        // document全体からeditorSelectorsを検索できるようにする。
        return document;
      };

      const findFirst = (root, selectors) => {
        if (!root) return null;

        for (const selector of selectors) {
          try {
            const el = root.querySelector(selector);
            if (el) return el;
          } catch (_) {
            // 1つのselectorが無効でも、残りの候補を継続して試す。
          }
        }

        return null;
      };

      const findSendButton = (root) => {
        const direct = findFirst(root, cfg.sendButtonSelectors);
        if (direct) return direct;
        if (!cfg.sendButtonFallbackSvgPathContains) return null;
        for (const el of root.querySelectorAll('button, [role="button"]')) {
          const paths = el.querySelectorAll('svg path[d]');
          for (const path of paths) {
            if ((path.getAttribute('d') || '').includes(cfg.sendButtonFallbackSvgPathContains)) {
              return el;
            }
          }
        }
        return null;
      };

      const isEnabled = (button) => Boolean(
        button &&
        !button.disabled &&
        button.getAttribute('aria-disabled') !== 'true' &&
        !cfg.disabledClassNames.some((name) => button.classList?.contains(name))
      );

      const waitForEditor = async () => {
        const startedAt = Date.now();
        while (Date.now() - startedAt < cfg.editorTimeoutMs) {
          const scope = findScope();
          const editor = findFirst(scope, cfg.editorSelectors);
          if (scope && editor) return { scope, editor };
          await sleep(cfg.intervalMs);
        }
        return null;
      };

      const injectText = (editor) => {
        editor.focus();
        if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
          const proto = editor instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          if (setter) setter.call(editor, cfg.text);
          else editor.value = cfg.text;
          editor.dispatchEvent(new InputEvent('input', {
            bubbles: true, cancelable: true, composed: true,
            inputType: 'insertText', data: cfg.text
          }));
          editor.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          return;
        }

        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        selection.removeAllRanges();
        selection.addRange(range);

        let inserted = false;
        try { inserted = document.execCommand('insertText', false, cfg.text); } catch (_) {}
        if (!inserted) {
          editor.replaceChildren();
          const p = document.createElement('p');
          p.textContent = cfg.text;
          editor.appendChild(p);
        }
        editor.dispatchEvent(new InputEvent('input', {
          bubbles: true, cancelable: true, composed: true,
          inputType: 'insertText', data: cfg.text
        }));
      };

      const found = await waitForEditor();
      if (!found) return { success: false, error: 'editor-not-found' };
      injectText(found.editor);

      const startedAt = Date.now();
      while (Date.now() - startedAt < cfg.sendButtonTimeoutMs) {
        const button = findSendButton(found.scope);
        if (isEnabled(button)) {
          button.focus?.();
          button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
          button.click();
          return { success: true, mode: 'ai-webview-prompt' };
        }
        await sleep(cfg.intervalMs);
      }

      if (cfg.enterFallback) {
        found.editor.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true
        }));
        return { success: true, mode: 'ai-webview-prompt-enter-fallback' };
      }

      return { success: false, error: 'send-button-not-found' };
    })();
  `);

  if (!result?.success) throw new Error(result?.error || "AI WebView送信に失敗しました");
  return { result, webview, targetUrl: currentUrl };
}

function buildHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).filter(([, value]) => value != null && value !== ""),
  );
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildRequestBody(request, vars, url) {
  const variant = (request?.variants || []).find((item) =>
    item?.urlEndsWith && String(url).endsWith(item.urlEndsWith),
  );
  const bodyTemplate = variant?.body ?? request?.body ?? {};
  return expandTemplates(bodyTemplate, vars);
}

function extractResponseValue(data, responseConfig = {}) {
  const paths = responseConfig.paths || (responseConfig.path ? [responseConfig.path] : []);
  for (const path of paths) {
    const value = getByPath(data, path);
    if (Array.isArray(value)) {
      const joined = value
        .map((part) => (typeof part === "string" ? part : part?.text || ""))
        .join("")
        .trim();
      if (joined) return joined;
    }
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
}

async function executeHttpJson({ config, input }) {
  const request = config?.request || {};
  const retry = config?.retry || {};
  const responseConfig = config?.response || {};
  const timeoutMs = Number(request.timeoutMs ?? config.timeoutMs ?? 30000);
  const retryableStatuses = new Set(retry.statusCodes || [429, 500, 502, 503, 504]);
  const maxRetries = Number(retry.maxRetries ?? 0);
  const baseDelayMs = Number(retry.baseDelayMs ?? 700);

  let modelCandidates = retry.modelCandidates || [input?.model];
  modelCandidates = modelCandidates
    .map((model) => replaceTemplateString(model, input))
    .filter(Boolean)
    .map((model) => String(model).replace(/^models\//, ""));
  modelCandidates = [...new Set(modelCandidates)];
  if (!modelCandidates.length) modelCandidates = [null];

  let lastError = null;
  for (const modelCurrent of modelCandidates) {
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const vars = { ...input, modelCurrent };
      let url = replaceTemplateString(request.url, vars);
      if (request.appendPathIfNoApiPath && !String(url).includes("/api/")) {
        url = String(url).replace(/\/$/, "") + request.appendPathIfNoApiPath;
      }
      const headers = buildHeaders(expandTemplates(request.headers || {}, vars));
      const method = String(request.method || "POST").toUpperCase();
      const bodyData = buildRequestBody(request, vars, url);
      const options = { method, headers };
      if (method !== "GET" && method !== "HEAD") {
        options.body = request.bodyType === "text" ? String(bodyData ?? "") : JSON.stringify(bodyData);
      }

      try {
        const response = await fetchWithTimeout(url, options, timeoutMs);
        const rawText = await response.text();
        let data = rawText;
        if (rawText) {
          try {
            data = JSON.parse(rawText);
          } catch {
            data = rawText;
          }
        }

        if (!response.ok) {
          const errorMessage = getByPath(data, responseConfig.errorPath) ||
            getByPath(data, "error.message") ||
            getByPath(data, "error") ||
            `${response.status} ${response.statusText}`;
          const error = new Error(String(errorMessage));
          error.status = response.status;
          throw error;
        }

        const text = typeof data === "string" ? data.trim() : extractResponseValue(data, responseConfig);
        if (responseConfig.requireText !== false && !text) {
          throw new Error(responseConfig.emptyMessage || "AI returned an empty response");
        }
        return { text, data, targetUrl: url, model: modelCurrent };
      } catch (error) {
        lastError = error;
        const retryable = retryableStatuses.has(error?.status);
        if (!retryable || attempt >= maxRetries) break;
        await new Promise((resolve) => setTimeout(resolve, Math.min(8000, baseDelayMs * 2 ** attempt)));
      }
    }
  }

  throw lastError || new Error("AI HTTP request failed");
}

const ELECTRON_AI_ACTIONS = {
  personal: "laravel_aiRecordEditer_correctPersonalRecord",
  professional1: "laravel_aiRecordEditer_correctProfessionalSupport",
};

async function executeElectronApi({ config, input }) {
  const selectorInput = config?.electronApi?.selectorInput || "promptKey";
  const routes = config?.electronApi?.routes || {};
  const routeKey = routes[input?.[selectorInput]] || input?.[selectorInput];
  const apiName = ELECTRON_AI_ACTIONS[routeKey] || ELECTRON_AI_ACTIONS[input?.[selectorInput]];
  if (!apiName) throw new Error(`Unsupported Electron AI route: ${input?.[selectorInput]}`);

  const api = window.electronAPI?.[apiName];
  if (typeof api !== "function") throw new Error(`${apiName} is not available in preload`);

  const payload = expandTemplates(config?.electronApi?.payload || {}, input);
  const result = await api(payload);
  if (!result?.success) {
    throw new Error(result?.message || result?.error?.details?.message || "Laravel AI correction request failed");
  }

  const text =
    getByPath(result, config?.response?.path || "data.message") ||
    getByPath(result, "data.data.message") ||
    getByPath(result, "message") ||
    "";
  if (!String(text).trim()) throw new Error("Laravel AI correction returned an empty response");
  return { text: String(text), data: result, targetUrl: null };
}

export async function executeAiAutomationFlow({ flowKey, input = {} }) {
  const runtime = {
    appKey: "hug-banso-navi",
    engineVersion: 1,
    extractors: {
      "ai-prompt-send": async ({ config, context }) => {
        const executor = config?.executor;
        const runtimeInput = { ...context };
        const provider = String(config?.provider || "");
        const effectiveConfig = JSON.parse(JSON.stringify(config || {}));

        if (provider === "gemini") {
          effectiveConfig.request = effectiveConfig.request || {};
          effectiveConfig.request.body = effectiveConfig.request.body || {
            contents: [{ role: "user", parts: [{ text: "{{textValue}}" }] }],
          };
        } else if (provider === "ollama") {
          effectiveConfig.request = effectiveConfig.request || {};
          effectiveConfig.request.body = effectiveConfig.request.body || {
            model: "{{model}}", prompt: "{{textValue}}", stream: false,
          };
          effectiveConfig.request.variants = effectiveConfig.request.variants || [{
            urlEndsWith: "/api/chat",
            body: {
              model: "{{model}}",
              messages: [{ role: "user", content: "{{textValue}}" }],
              stream: false,
            },
          }];
        } else if (provider === "openrouter") {
          effectiveConfig.request = effectiveConfig.request || {};
          effectiveConfig.request.body = effectiveConfig.request.body || {
            model: "{{model}}",
            messages: [
              { role: "system", content: "あなたは日本語の文章整形アシスタントです。箇条書きの意味を変えず、情報を追加せず、自然な1つの日本語文に整えてください。出力は文章のみ。" },
              { role: "user", content: "次の箇条書きを1つの自然な日本語文にしてください。\n\n{{textValue}}" },
            ],
            temperature: 0.2,
            max_tokens: 500,
          };
        } else if (provider === "laravel") {
          effectiveConfig.electronApi = effectiveConfig.electronApi || {};
          effectiveConfig.electronApi.payload = effectiveConfig.electronApi.payload || {
            prompt: "{{prompt}}", message: "{{message}}",
          };
        }

        if (executor === "ai-webview-prompt") {
          const output = await executeWebviewPrompt({
            flow: null,
            step: null,
            rule: {
              target_url_pattern:
                config?.webview?.domains?.length
                  ? `https://${config.webview.domains[0]}/*`
                  : null,
            },
            config: effectiveConfig,
            input: runtimeInput,
          });
          return output?.text ?? output?.result?.success ?? true;
        }

        if (executor === "http-json") {
          const output = await executeHttpJson({ config: effectiveConfig, input: runtimeInput });
          return output?.text ?? true;
        }

        if (executor === "electron-api") {
          const output = await executeElectronApi({ config: effectiveConfig, input: runtimeInput });
          return output?.text ?? true;
        }

        throw new Error(`未対応のAI executorです: ${executor}`);
      },
    },
  };

  const result = await executeFlowV2(flowKey, input, { runtime });
  return result?.context?.aiResult ?? true;
}
