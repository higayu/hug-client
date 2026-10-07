import { resolveTemplates } from "./templateResolver.js";
import { builtInExecutors } from "../executors/index.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function withTimeout(promise, timeoutMs, label) {
  const ms = Number(timeoutMs || 0);
  if (!ms) return promise;

  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function executeStepV2({ step, context, runtime, executeFlow }) {
  const type = String(step?.step_type || "").trim();
  if (!type) throw new Error("step_typeがありません");

  const executor = runtime.executors?.[type] || builtInExecutors[type];
  if (typeof executor !== "function") throw new Error(`未対応step_typeです: ${type}`);

  const config = resolveTemplates(step?.config_json || {}, context);
  const retryCount = Math.max(0, Number(step?.retry_count || 0));
  const retryDelayMs = Math.max(0, Number(step?.retry_delay_ms || 0));
  const timeoutMs = Math.max(0, Number(step?.timeout_ms || config.timeoutMs || config.timeout || 0));
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await withTimeout(
        Promise.resolve(executor({ step, config, context, runtime, executeFlow, attempt })),
        timeoutMs,
        step?.step_key || type
      );
    } catch (error) {
      lastError = error;
      if (attempt >= retryCount) break;
      if (retryDelayMs > 0) await sleep(retryDelayMs);
    }
  }

  throw lastError || new Error(`Step実行に失敗しました: ${step?.step_key || type}`);
}
