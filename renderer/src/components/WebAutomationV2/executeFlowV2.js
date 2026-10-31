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

/**
 * debug_log_mode is stored on each published web_automation_flows_v2 row.
 * Existing DB records without this column default to failed_only.
 */
function getDebugLogMode(flow) {
  const mode = String(flow?.debug_log_mode ?? "failed_only").trim();
  return mode === "always" ? "always" : "failed_only";
}

function buildDebugLog({ flow, executionUuid, startedAt, status, error }) {
  const debug = {
    executionUuid,
    flowId: flow.id,
    flowKey: flow.flow_key,
    flowVersion: flow.version,
    status,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  };
  if (error) {
    debug.error = {
      name: error?.name || "Error",
      message: error?.message || String(error),
      stack: typeof error?.stack === "string" ? error.stack : null,
    };
  }
  return debug;
}

async function writeExecutionLog(api, methodName, payload) {
  if (typeof api?.[methodName] !== "function") {
    console.warn(`[WebAutomationV2] ログAPIが未登録: ${methodName}`);
    return { ok: false, reason: "api-missing" };
  }

  try {
    const response = await api[methodName](payload);
    if (response == null || response === false || response?.ok === false) {
      console.warn(`[WebAutomationV2] ログ記録を確認できません: ${methodName}`, {
        response,
        executionUuid: payload.executionUuid,
      });
      return { ok: false, reason: "response-not-success", response };
    }
    return { ok: true, response };
  } catch (error) {
    console.warn(`[WebAutomationV2] ログAPI ${methodName} 失敗:`, error);
    return { ok: false, reason: "exception", error };
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
  const executionUuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Flow取得前に失敗した場合も、本文を出さずに段階だけ診断可能にする。
  let stage = "preflight";
  let api;
  let flow;
  let files;
  let debugLogMode = "failed_only";
  let logStarted = false;

  console.info("[WebAutomationV2] 実行開始", { flowKey, executionUuid });
  try {
    api = getApi();
    stage = "load-flow";
    ({ flow, files } = await loadPublishedFlowBundle({ appKey, flowKey }));
    debugLogMode = getDebugLogMode(flow);
    stage = "prepare-runtime";
    const config = parseJson(flow.config_json, {});
    const timeoutMs = Number(flow.timeout_ms) > 0
      ? Number(flow.timeout_ms)
      : 30000;
    const helpers = createWebAutomationV2Helpers({ defaultTimeoutMs: timeoutMs });

    stage = "execution-log-start";
    const startLog = await writeExecutionLog(
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
    logStarted = startLog.ok;
    if (!logStarted) {
      console.warn("[WebAutomationV2] 実行ログ開始が未確認（実行は継続）", {
        flowKey, executionUuid, reason: startLog.reason,
      });
    }

    stage = "execute-virtual-entry";
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

    // AI送信フローの false は実行失敗。成功としてログ保存しない。
    if (result === false && String(flowKey).startsWith("ai_")) {
      throw new Error(`[WebAutomationV2] ${flowKey} が false を返しました（入力欄・送信ボタン・対象WebViewを確認してください）`);
    }

    stage = "execution-log-finish";
    const finishLog = await writeExecutionLog(
      api,
      "webAutomationV2_executionLogFinish",
      {
        executionUuid,
        status: "success",
        result,
        durationMs: Date.now() - startedAt,
        ...(debugLogMode === "always"
          ? { debug: buildDebugLog({ flow, executionUuid, startedAt, status: "success" }) }
          : {}),
      }
    );

    if (!finishLog.ok) {
      console.warn("[WebAutomationV2] 成功ログ終了が未確認", { flowKey, executionUuid });
    }
    console.info("[WebAutomationV2] 実行完了", { flowKey, executionUuid });
    return result;
  } catch (error) {
    // Flow取得前はflowId未確定。既存APIに不正な開始ログを送らない。
    if (flow && logStarted) {
      await writeExecutionLog(
      api,
      "webAutomationV2_executionLogFinish",
      {
        executionUuid,
        status: "failed",
        errorMessage: error?.message || String(error),
        durationMs: Date.now() - startedAt,
        debug: buildDebugLog({ flow, executionUuid, startedAt, status: "failed", error }),
      }
      );
    }

    console.error("[WebAutomationV2] Flow実行失敗", {
      flowKey,
      executionUuid,
      stage,
      logStarted,
      message: error?.message || String(error),
      error,
    });

    throw error;
  }
}

export default executeFlowV2;
