function getByPath(value, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((current, key) => (current == null ? undefined : current[key]), value);
}

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
    return String(url).includes(p);
  });
}

function getWebviewUrl(webview) {
  try {
    return webview?.getURL?.() || webview?.getAttribute?.("src") || "";
  } catch {
    return webview?.getAttribute?.("src") || "";
  }
}

function findAiWebview(config) {
  const domains = (config?.webview?.domains || config?.domains || [])
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  const pattern = config?.targetUrlPattern || config?.webview?.targetUrlPattern || null;
  const all = Array.from(document.querySelectorAll("webview"));
  const activeElement = document.activeElement?.tagName?.toLowerCase() === "webview"
    ? document.activeElement
    : null;
  const candidates = activeElement
    ? [activeElement, ...all.filter((item) => item !== activeElement)]
    : all;
  return candidates.find((webview) => {
    const url = getWebviewUrl(webview);
    const domainOk = domains.length === 0 || domains.some((domain) => url.includes(domain));
    return domainOk && matchesUrl(url, pattern);
  }) || null;
}

async function executeWebviewPrompt({ config, input }) {
  const webview = findAiWebview(config);
  if (!webview) throw new Error("対象AI WebViewが見つかりません");

  const currentUrl = getWebviewUrl(webview);
  const pattern = config?.targetUrlPattern || config?.webview?.targetUrlPattern || null;
  if (!matchesUrl(currentUrl, pattern)) {
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

  const script = `
    (async () => {
      const cfg = ${JSON.stringify(payload)};
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const findScope = () => {
        for (const selector of cfg.scopeSelectors) {
          try {
            const el = document.querySelector(selector);
            if (el) return el;
          } catch (_) {}
        }
        return document;
      };

      const findFirst = (root, selectors) => {
        if (!root) return null;
        for (const selector of selectors) {
          try {
            const el = root.querySelector(selector);
            if (el) return el;
          } catch (_) {}
        }
        return null;
      };

      const findSendButton = (root) => {
        const direct = findFirst(root, cfg.sendButtonSelectors);
        if (direct) return direct;
        if (!cfg.sendButtonFallbackSvgPathContains) return null;
        for (const el of root.querySelectorAll('button, [role="button"]')) {
          for (const path of el.querySelectorAll('svg path[d]')) {
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
  `;

  const result = await webview.executeJavaScript(script, true);
  if (!result?.success) throw new Error(result?.error || "AI WebView送信に失敗しました");
  return { result, targetUrl: currentUrl };
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
  return expandTemplates(variant?.body ?? request?.body ?? {}, vars);
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
          try { data = JSON.parse(rawText); } catch (_) {}
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

async function executeElectronApi({ config, input }) {
  const electronApi = config?.electronApi || {};
  const selectorInput = electronApi.selectorInput || "promptKey";
  const routes = electronApi.routes || {};
  const routeKey = routes[input?.[selectorInput]] || input?.[selectorInput];
  const actions = electronApi.actions || {};
  const apiName = actions[routeKey] || actions[input?.[selectorInput]];
  if (!apiName) throw new Error(`Unsupported Electron AI route: ${input?.[selectorInput]}`);

  const api = window.electronAPI?.[apiName];
  if (typeof api !== "function") throw new Error(`${apiName} is not available in preload`);

  const payload = expandTemplates(electronApi.payload || {}, input);
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

exports.executeAiV2 = async function executeAiV2({ input, config }) {
  const secretStore = globalThis.__WEB_AUTOMATION_V2_AI_SECRET_INPUTS__;
  const secret = input?.__runtimeSecretKey && secretStore instanceof Map
    ? (secretStore.get(input.__runtimeSecretKey) || {})
    : {};
  const runtimeInput = { ...input, ...secret };
  delete runtimeInput.__runtimeSecretKey;

  const executor = config?.executor;
  let output;

  if (executor === "ai-webview-prompt") {
    output = await executeWebviewPrompt({ config, input: runtimeInput });
  } else if (executor === "http-json") {
    output = await executeHttpJson({ config, input: runtimeInput });
  } else if (executor === "electron-api") {
    output = await executeElectronApi({ config, input: runtimeInput });
  } else {
    throw new Error(`未対応のAI executorです: ${executor}`);
  }

  return output?.text ?? output?.result?.success ?? true;
};
