import { getActiveWebview } from "@/utils/webview/webviewState.js";

const APP_KEY = "hug-banso-navi";
const WEBVIEW_KEY = "*";
const FLOW_CACHE_TTL_MS = 60 * 1000;
const flowCache = new Map();

function normalizeJson(value, fallback = {}) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isActive(value) {
  return value !== false && value !== 0 && value !== "0";
}

function unwrapData(result) {
  if (result?.data?.data && !Array.isArray(result.data.data)) return result.data.data;
  if (result?.data && !Array.isArray(result.data)) return result.data;
  return result ?? null;
}

function createExecutionUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `ai-web-auto-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getExecutionLogId(response) {
  return response?.data?.id ?? response?.data?.data?.id ?? response?.id ?? null;
}

async function createExecutionLog(payload) {
  const api = window.electronAPI?.laravel_webAutomationExecutionLog_create;
  if (typeof api !== "function") return null;
  try {
    const response = await api(payload);
    return response?.success ? getExecutionLogId(response) : null;
  } catch (error) {
    console.warn("[AI WebAutomation] execution log create failed", error);
    return null;
  }
}

async function updateExecutionLog(id, payload) {
  if (!id) return;
  const api = window.electronAPI?.laravel_webAutomationExecutionLog_update;
  if (typeof api !== "function") return;
  try {
    await api(id, payload);
  } catch (error) {
    console.warn("[AI WebAutomation] execution log update failed", error);
  }
}

function normalizeFlow(flow) {
  return {
    ...flow,
    config_json: normalizeJson(flow?.config_json),
    steps: Array.isArray(flow?.steps)
      ? [...flow.steps]
          .filter((step) => isActive(step?.is_active))
          .sort((a, b) => Number(a?.step_order ?? 0) - Number(b?.step_order ?? 0))
          .map((step) => ({
            ...step,
            input_json: normalizeJson(step?.input_json),
            config_json: normalizeJson(step?.config_json),
            rule: step?.rule
              ? { ...step.rule, config_json: normalizeJson(step.rule.config_json) }
              : null,
          }))
      : [],
  };
}

async function getFlow(flowKey, { force = false } = {}) {
  const key = String(flowKey || "").trim();
  if (!key) throw new Error("AI WebAutomation flowKey がありません");

  const cached = flowCache.get(key);
  if (!force && cached && Date.now() - cached.loadedAt < FLOW_CACHE_TTL_MS) {
    return cached.flow;
  }

  const api = window.electronAPI?.laravel_webAutomationFlow_get;
  if (typeof api !== "function") {
    throw new Error("laravel_webAutomationFlow_get が preload に公開されていません");
  }

  const response = await api(key, { app_key: APP_KEY, webview_key: WEBVIEW_KEY });
  if (!response?.success) {
    throw new Error(response?.message || response?.error || `${key} のFlow取得に失敗しました`);
  }

  const flow = normalizeFlow(unwrapData(response));
  if (!flow?.id) throw new Error(`${key} のFlowが見つかりません`);
  if (!isActive(flow?.is_active)) throw new Error(`${key} は無効なFlowです`);

  flowCache.set(key, { flow, loadedAt: Date.now() });
  return flow;
}

function mergeConfig(flow, step, rule) {
  // 優先順位: flow < step < rule
  return {
    ...(flow?.config_json || {}),
    ...(step?.config_json || {}),
    ...(rule?.config_json || {}),
  };
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
        if (!cfg.scopeSelectors.length) return document;
        for (const selector of cfg.scopeSelectors) {
          const el = document.querySelector(selector);
          if (el) return el;
        }
        return null;
      };

      const findFirst = (root, selectors) => {
        if (!root) return null;
        for (const selector of selectors) {
          const el = root.querySelector(selector);
          if (el) return el;
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

function safeLogInput(input) {
  const copy = { ...input };
  if (copy.apiKey) copy.apiKey = "[REDACTED]";
  if (copy.textValue) copy.textValue = { length: String(copy.textValue).length };
  if (copy.prompt) copy.prompt = { length: String(copy.prompt).length };
  if (copy.message) copy.message = { length: String(copy.message).length };
  return copy;
}

export async function executeAiAutomationFlow({ flowKey, input = {}, forceReloadFlow = false }) {
  const startedAtMs = Date.now();
  const executionUuid = createExecutionUuid();
  let flow = null;
  let step = null;
  let rule = null;
  let config = null;
  let executionLogId = null;
  let webview = null;
  let targetUrl = null;

  try {
    flow = await getFlow(flowKey, { force: forceReloadFlow });
    step = flow.steps.find((item) => item?.step_type === "rule" && item?.rule && isActive(item.rule?.is_active));
    if (!step?.rule) throw new Error(`${flowKey} に有効なRule Stepがありません`);
    rule = step.rule;
    config = mergeConfig(flow, step, rule);

    const expandedStepInput = expandTemplates(step.input_json || {}, input);
    const runtimeInput = { ...input, ...expandedStepInput };

    executionLogId = await createExecutionLog({
      execution_uuid: executionUuid,
      app_key: APP_KEY,
      webview_key: WEBVIEW_KEY,
      flow_id: flow.id,
      flow_key: flow.flow_key,
      flow_step_id: step.id,
      step_key: step.step_key,
      rule_id: rule.id,
      rule_key: rule.rule_key,
      action_type: rule.action_type,
      executor: config.executor || rule.parser_type || null,
      target_url: rule.target_url_pattern || flow.target_url_pattern || null,
      target_selector: rule.target_selector || null,
      input_json: safeLogInput(runtimeInput),
      status: "running",
      started_at: new Date(startedAtMs).toISOString(),
    });

    let output;
    const executor = config.executor || rule.parser_type || rule.action_type;
    if (executor === "ai-webview-prompt") {
      output = await executeWebviewPrompt({ flow, step, rule, config, input: runtimeInput });
      webview = output.webview;
      targetUrl = output.targetUrl;
    } else if (executor === "http-json") {
      output = await executeHttpJson({ config, input: runtimeInput });
      targetUrl = output.targetUrl;
    } else if (executor === "electron-api") {
      output = await executeElectronApi({ config, input: runtimeInput });
    } else {
      throw new Error(`未対応のAI executorです: ${executor}`);
    }

    const durationMs = Date.now() - startedAtMs;
    await updateExecutionLog(executionLogId, {
      status: "success",
      webview_id: webview?.id || null,
      page_url_after: webview ? getWebviewUrl(webview) : null,
      target_url: targetUrl || rule.target_url_pattern || null,
      result_json: {
        success: true,
        hasText: Boolean(output?.text),
        textLength: output?.text ? String(output.text).length : 0,
        mode: executor,
        model: output?.model || null,
      },
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
    });

    return output?.text ?? output?.result?.success ?? true;
  } catch (error) {
    const durationMs = Date.now() - startedAtMs;
    const failed = {
      status: "failed",
      webview_id: webview?.id || null,
      page_url_after: webview ? getWebviewUrl(webview) : null,
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      error_code: error?.code || "AI_WEB_AUTOMATION_FAILED",
      error_message: error?.message || String(error),
      debug_json: {
        flowKey: flow?.flow_key || flowKey,
        stepKey: step?.step_key || null,
        ruleKey: rule?.rule_key || null,
        stack: error?.stack || null,
      },
    };

    if (executionLogId) {
      await updateExecutionLog(executionLogId, failed);
    } else {
      await createExecutionLog({
        execution_uuid: executionUuid,
        app_key: APP_KEY,
        webview_key: WEBVIEW_KEY,
        flow_id: flow?.id ?? null,
        flow_key: flow?.flow_key || flowKey,
        flow_step_id: step?.id ?? null,
        step_key: step?.step_key ?? null,
        rule_id: rule?.id ?? null,
        rule_key: rule?.rule_key ?? null,
        action_type: rule?.action_type ?? null,
        executor: config?.executor || rule?.parser_type || null,
        input_json: safeLogInput(input),
        started_at: new Date(startedAtMs).toISOString(),
        ...failed,
      });
    }
    throw error;
  }
}
