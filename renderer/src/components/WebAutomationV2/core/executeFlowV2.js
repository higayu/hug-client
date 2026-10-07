import { createExecutionContext, setContextValue } from "./executionContext.js";
import { evaluateCondition } from "./condition.js";
import { executeStepV2 } from "./executeStepV2.js";
import { createExecutionUuid, createStepLog, finishStepLog } from "./executionLogger.js";
import { resolveWebview, getWebviewUrl } from "../executors/webview.js";

export const WEB_AUTOMATION_V2_DEFAULTS = {
  appKey: "hug-banso-navi",
  engineVersion: 1,
};

async function getFlow(flowKey, options = {}) {
  const fn = window?.electronAPI?.laravel_webAutomationV2Flow_get;
  if (typeof fn !== "function") {
    throw new Error("preloadに laravel_webAutomationV2Flow_get が公開されていません");
  }

  const response = await fn(flowKey, {
    app_key: options.appKey || WEB_AUTOMATION_V2_DEFAULTS.appKey,
    engine_version: options.engineVersion || WEB_AUTOMATION_V2_DEFAULTS.engineVersion,
  });

  if (!response?.success || !response?.data) {
    throw new Error(response?.message || response?.error?.message || `V2 Flow取得失敗: ${flowKey}`);
  }
  return response.data;
}

async function pageInfo(step, runtime) {
  const key = step?.config_json?.webviewKey;
  if (!key) return { webviewId: null, url: null };
  try {
    const webview = await resolveWebview(key, runtime);
    return { webviewId: webview.id || key, url: getWebviewUrl(webview) || null };
  } catch {
    return { webviewId: key, url: null };
  }
}

export async function executeFlowV2(flowKey, input = {}, options = {}) {
  const runtime = options.runtime || {};
  const appKey = options.appKey || runtime.appKey || WEB_AUTOMATION_V2_DEFAULTS.appKey;
  const engineVersion = options.engineVersion || runtime.engineVersion || WEB_AUTOMATION_V2_DEFAULTS.engineVersion;
  const flow = options.flow || (await getFlow(flowKey, { appKey, engineVersion }));
  const executionUuid = options.executionUuid || createExecutionUuid();
  const context = createExecutionContext(input, {
    ...(options.parentContext ? { parent: options.parentContext } : {}),
    executionUuid,
    flowKey: flow.flow_key || flowKey,
    flowVersion: flow.version,
  });

  const steps = [...(flow.steps || [])]
    .filter((step) => step?.is_active !== false && Number(step?.is_active ?? 1) !== 0)
    .sort((a, b) => Number(a.step_order || 0) - Number(b.step_order || 0));

  for (const step of steps) {
    const conditionOk = evaluateCondition(step.condition_json, context);
    const before = await pageInfo(step, runtime);
    const logId = await createStepLog({
      executionUuid,
      appKey,
      flow,
      step,
      input,
      context,
      webviewId: before.webviewId,
      pageUrlBefore: before.url,
    });

    if (!conditionOk) {
      await finishStepLog(logId, {
        status: "skipped",
        context_json: context,
        result_json: { skipped: true, reason: "condition_false" },
      });
      continue;
    }

    try {
      const result = await executeStepV2({
        step,
        context,
        runtime,
        executeFlow: executeFlowV2,
      });

      if (step.output_key) setContextValue(context, step.output_key, result);

      const after = await pageInfo(step, runtime);
      await finishStepLog(logId, {
        status: "success",
        result_json: result && typeof result === "object" ? result : { value: result },
        context_json: context,
        page_url_after: after.url,
      });
    } catch (error) {
      const after = await pageInfo(step, runtime);
      await finishStepLog(logId, {
        status: "failed",
        error_code: error?.code || "STEP_EXECUTION_FAILED",
        error_message: error?.message || String(error),
        context_json: context,
        page_url_after: after.url,
        debug_json: { stack: error?.stack || null },
      });

      if (!step.continue_on_error) {
        error.flowKey = flow.flow_key || flowKey;
        error.stepKey = step.step_key;
        error.executionUuid = executionUuid;
        throw error;
      }
    }
  }

  return { success: true, executionUuid, flow, context };
}
