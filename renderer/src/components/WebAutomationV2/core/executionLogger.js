function api() {
  return window?.electronAPI;
}

function jsonSafe(value) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { serializationError: true, value: String(value) };
  }
}

export function createExecutionUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createStepLog({
  executionUuid,
  appKey,
  flow,
  step,
  input,
  context,
  webviewId,
  pageUrlBefore,
}) {
  const fn = api()?.laravel_webAutomationV2ExecutionLog_create;
  if (typeof fn !== "function") return null;

  const response = await fn({
    execution_uuid: executionUuid,
    app_key: appKey,
    flow_id: flow?.id ?? null,
    flow_key: flow?.flow_key ?? null,
    flow_version: flow?.version ?? null,
    step_id: step?.id ?? null,
    step_order: step?.step_order ?? null,
    step_key: step?.step_key ?? null,
    step_type: step?.step_type ?? null,
    webview_id: webviewId || null,
    page_url_before: pageUrlBefore || null,
    input_json: jsonSafe(input),
    context_json: jsonSafe(context),
    flow_snapshot_json: jsonSafe(flow),
    step_snapshot_json: jsonSafe(step),
    status: "running",
  });

  if (response?.success === false) {
    console.warn("[WebAutomationV2] log create failed", response);
    return null;
  }

  return response?.data?.id ?? null;
}

export async function finishStepLog(logId, payload = {}) {
  if (!logId) return null;
  const fn = api()?.laravel_webAutomationV2ExecutionLog_update;
  if (typeof fn !== "function") return null;

  const response = await fn(logId, {
    ...payload,
    result_json: jsonSafe(payload.result_json),
    context_json: jsonSafe(payload.context_json),
    debug_json: jsonSafe(payload.debug_json),
  });

  if (response?.success === false) {
    console.warn("[WebAutomationV2] log update failed", response);
  }

  return response;
}
