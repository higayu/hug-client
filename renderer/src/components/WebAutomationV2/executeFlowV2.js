import { executeVirtualEntry } from "./moduleLoader";
import { createWebAutomationV2Helpers } from "./helpers";

const DEFAULT_APP_KEY = "hug-banso-navi";
const EXECUTOR_ENGINE_VERSION = 1;

function parseJson(value, fallback = {}) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(
      "[WebAutomationV2] JSON設定の解析に失敗:",
      error
    );
    return fallback;
  }
}

function getApi() {
  const api = window?.electronAPI;

  if (!api) {
    throw new Error(
      "[WebAutomationV2] window.electronAPI がありません"
    );
  }

  if (typeof api.webAutomationV2_getFlowBundle !== "function") {
    throw new Error(
      "[WebAutomationV2] preload API webAutomationV2_getFlowBundle が未実装です"
    );
  }

  return api;
}

async function loadPublishedFlowBundle({ appKey, flowKey }) {
  const api = getApi();

  const response = await api.webAutomationV2_getFlowBundle({
    appKey,
    flowKey,
  });

  if (!response) {
    throw new Error(
      `[WebAutomationV2] Flow取得結果が空です: ${flowKey}`
    );
  }

  if (response.ok === false) {
    throw new Error(
      response.error ||
        `[WebAutomationV2] Flow取得に失敗しました: ${flowKey}`
    );
  }

  const flow = response.flow || response.data?.flow;
  const files = response.files || response.data?.files || [];

  if (!flow) {
    throw new Error(
      `[WebAutomationV2] published Flowが見つかりません: ${flowKey}`
    );
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error(
      `[WebAutomationV2] Flowファイルがありません: ${flowKey}`
    );
  }

  if (
    Number(flow.engine_version || 1) >
    EXECUTOR_ENGINE_VERSION
  ) {
    throw new Error(
      `[WebAutomationV2] Executorの更新が必要です。` +
        ` required=${flow.engine_version}, current=${EXECUTOR_ENGINE_VERSION}`
    );
  }

  return { flow, files };
}

async function writeExecutionLog(api, methodName, payload) {
  if (typeof api?.[methodName] !== "function") {
    return null;
  }

  try {
    return await api[methodName](payload);
  } catch (error) {
    console.warn(
      `[WebAutomationV2] 実行ログAPI ${methodName} 失敗:`,
      error
    );
    return null;
  }
}

/**
 * DB駆動のWebAutomation V2共通Executor。
 *
 * 1. published Flow + 複数ファイルをDB/APIから一括取得
 * 2. メモリ上で仮想モジュールとして構築
 * 3. entry_file / entry_export を実行
 * 4. 最終データを呼び出し元へ返す
 *
 * @param {string} flowKey
 * @param {Object} input
 * @param {Object} options
 */
export async function executeFlowV2(
  flowKey,
  input = {},
  options = {}
) {
  if (!flowKey) {
    throw new Error(
      "[WebAutomationV2] flowKeyが指定されていません"
    );
  }

  const appKey = options.appKey || DEFAULT_APP_KEY;
  const startedAt = Date.now();
  const api = getApi();

  const { flow, files } = await loadPublishedFlowBundle({
    appKey,
    flowKey,
  });

  const config = parseJson(flow.config_json, {});
  const timeoutMs =
    Number(flow.timeout_ms) > 0
      ? Number(flow.timeout_ms)
      : 30000;

  const helpers = createWebAutomationV2Helpers({
    defaultTimeoutMs: timeoutMs,
  });

  const executionUuid =
    typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  await writeExecutionLog(
    api,
    "webAutomationV2_executionLogStart",
    {
      executionUuid,
      appKey,
      flowId: flow.id,
      flowKey: flow.flow_key || flowKey,
      flowVersion: flow.version,
      entryFile: flow.entry_file,
      entryExport: flow.entry_export,
      input,
    }
  );

  try {
    const result = await executeVirtualEntry({
      files,
      entryFile: flow.entry_file || "index.js",
      entryExport: flow.entry_export || "default",
      args: {
        input,
        helpers,
        config,
        flow: Object.freeze({ ...flow }),
      },
      globals: {
        appKey,
        flowKey,
        executionUuid,
      },
    });

    await writeExecutionLog(
      api,
      "webAutomationV2_executionLogFinish",
      {
        executionUuid,
        status: "success",
        result,
        durationMs: Date.now() - startedAt,
      }
    );

    return result;
  } catch (error) {
    await writeExecutionLog(
      api,
      "webAutomationV2_executionLogFinish",
      {
        executionUuid,
        status: "failed",
        errorMessage: error?.message || String(error),
        durationMs: Date.now() - startedAt,
      }
    );

    console.error(
      `[WebAutomationV2] Flow実行失敗: ${flowKey}`,
      error
    );

    throw error;
  }
}

export default executeFlowV2;
