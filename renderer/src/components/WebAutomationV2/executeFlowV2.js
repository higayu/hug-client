import { validatePersonalRecordFlow } from "@/components/common/hug_function/PersonalRecord/PersonalRecordRange/policy";
import { store } from "@/store/store";
import { selectDebugFlg } from "@/store/slices/appStateSlice";
import { selectIsGlobalAdmin, selectIsLaravelAuthenticated } from "@/store/slices/authSlice";
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

// APIエラーを文字列化し、認証情報やレスポンス本文の無条件出力を避ける。
function formatApiError(response, fallback) {
  const raw = response?.error ?? response?.message ?? response;
  const body = raw?.response?.data ?? raw?.data ?? response?.data;
  const status = raw?.response?.status ?? raw?.status ?? response?.status ?? response?.statusCode;
  const messages = [];
  const add = (value) => {
    if (typeof value === "string" && value.trim() && !messages.includes(value)) {
      messages.push(value);
    }
  };
  add(typeof raw === "string" ? raw : raw?.message);
  add(body?.message);
  add(response?.message);
  const errors = body?.errors ?? raw?.errors ?? response?.errors;
  if (errors && typeof errors === "object") {
    for (const [field, values] of Object.entries(errors)) {
      for (const value of Array.isArray(values) ? values : [values]) {
        if (typeof value === "string") add(`${field}: ${value}`);
      }
    }
  }
  if (!messages.length) {
    add(typeof raw?.error === "string" ? raw.error : null);
    add(raw?.code);
  }
  return [fallback, status ? `HTTP ${status}` : null,
    ...messages].filter(Boolean).join(" | ");
}

function createFlowApiError(response, label) {
  const error = new Error(formatApiError(response, label));
  const raw = response?.error ?? response?.message ?? response;
  const body = raw?.response?.data ?? raw?.data ?? response?.data;
  error.httpStatus = Number(raw?.response?.status ?? raw?.status ?? response?.status ?? response?.statusCode);
  error.draftMissing = error.httpStatus === 409 &&
    [raw, raw?.message, body?.message, response?.message].some(
      value => typeof value === "string" && /^下書きリビジョンがありません[。.]?$/.test(value.trim())
    );
  return error;
}

async function requestFlowBundle(api, method, params, label) {
  let response;
  try {
    response = await api[method](params);
  } catch (error) {
    throw createFlowApiError(error, label);
  }
  if (!response || response.ok === false || response.success === false) {
    const error = createFlowApiError(response, label);
    const message = error.message;
    console.error("[WebAutomationV2] Flow取得失敗", {
      ...params, method, message,
    });
    throw error;
  }
  return response;
}

async function loadPublishedFlowBundle({ appKey, flowKey }) {
  const api = getApi();

  const response = await requestFlowBundle(
    api, "webAutomationV2_getFlowBundle", { appKey, flowKey },
    `[WebAutomationV2] 公開版Flow取得失敗: ${flowKey}`
  );

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

async function loadDraftFlowBundle({ appKey, flowKey }) {
  const api = getApi();
  if (typeof api.webAutomationV2_getDraftTestFlowBundle !== "function") {
    throw new Error("下書きテスト用preload APIがありません");
  }
  const response = await requestFlowBundle(
    api, "webAutomationV2_getDraftTestFlowBundle", { appKey, flowKey },
    `[WebAutomationV2] 下書きFlow取得失敗: ${flowKey}`
  );
  const meta = response.meta || response.data?.meta || {};
  if (meta.status !== "draft" || !Number.isInteger(Number(meta.revision_id)) || Number(meta.revision_id) <= 0) {
    throw new Error("下書きリビジョンではありません。公開版の代替実行を拒否しました");
  }
  const flow = response.flow || response.data?.flow;
  const files = response.files || response.data?.files;
  if (!flow || !Array.isArray(files) || files.length === 0) {
    throw new Error("下書きのFlowまたはJSファイルがありません");
  }
  if (Number(flow.engine_version || 1) > EXECUTOR_ENGINE_VERSION) {
    throw new Error("Executorの更新が必要です");
  }
  return { flow, files, meta };
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
  // adminのデバッグ時は全Flowで下書きを優先する。
  const state = store.getState();
  const admin = selectIsLaravelAuthenticated(state) && selectIsGlobalAdmin(state);
  const debug = selectDebugFlg(state) === true;
  const autoDraft = options.revisionMode == null && admin && debug;
  let draftTest = options.revisionMode === "draft" || autoDraft;
  if (draftTest && !admin) {
    throw new Error("下書きテストは管理者のみ利用できます");
  }

  console.info("[WebAutomationV2] 実行開始", { flowKey, executionUuid });
  try {
    if (appKey === DEFAULT_APP_KEY) validatePersonalRecordFlow(store.getState(), flowKey, input);
    api = getApi();
    stage = "load-flow";
    if (draftTest) {
      try {
        ({ flow, files } = await loadDraftFlowBundle({ appKey, flowKey }));
      } catch (error) {
        // 明示的な下書き指定や、権限・通信・その他の409エラーは代替しない。
        if (!autoDraft || error?.draftMissing !== true) throw error;
        console.info("[WebAutomationV2] 下書きなし: 公開版へ切り替え", { appKey, flowKey, executionUuid });
        draftTest = false;
        ({ flow, files } = await loadPublishedFlowBundle({ appKey, flowKey }));
      }
    } else {
      ({ flow, files } = await loadPublishedFlowBundle({ appKey, flowKey }));
    }
    debugLogMode = getDebugLogMode(flow);
    stage = "prepare-runtime";
    const config = parseJson(flow.config_json, {});
    const timeoutMs = Number(flow.timeout_ms) > 0
      ? Number(flow.timeout_ms)
      : 30000;
    if (((/^(personal_record|professional_support)_dom_/.test(String(flowKey)) || String(flowKey) === "professional_support_draft_save")) && !options.webview) throw new Error("対象WebViewが必要です");
    const helpers = createWebAutomationV2Helpers({ defaultTimeoutMs: timeoutMs, targetWebview: options.webview || null });

    stage = "execution-log-start";
    // テスト実行のログを通常公開版と混同させない。
    console.info("[WebAutomationV2] 実行モード", draftTest ? "draft-test" : "published");
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
        input: ((/^(personal_record|professional_support)_dom_/.test(String(flowKey)) || String(flowKey) === "professional_support_draft_save")) ? { redacted: true } : input,
        ...(draftTest ? { executionMode: "draft-test" } : {}),
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
        result: ((/^(personal_record|professional_support)_dom_/.test(String(flowKey)) || String(flowKey) === "professional_support_draft_save")) ? { redacted: true } : result,
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
