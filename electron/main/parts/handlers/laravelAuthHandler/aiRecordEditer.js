
const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("./auth/authenticated");
const { formatError, unwrapData } = require("./auth/utils");

/**
 * AiRecordEditer 専用AI校正。
 *
 * payload:
 * {
 *   prompt: string,
 *   message: string,
 * }
 *
 * personalWithPlan / professionalTwoStage:
 * {
 *   child_id: number,
 *   message: string,
 * }
 */

// ==========================================
// APIエンドポイント
// ==========================================

const ENDPOINTS = {
  personal: "/ai-record-editer/personal-record/correct",
  personalWithPlan: "/ai-record-editer/personal-record/with-plan/correct",
  professional: "/ai-record-editer/professional-support/correct",
  professionalTwoStage: "/ai-record-editer/professional-support/two-stage/correct",
};

// ==========================================
// タイムアウト設定
// ==========================================

// 通常のAI文章校正：5分
const AI_TIMEOUT_MS = 5 * 60 * 1000;

// 専門的支援の2段階校正：10分
const AI_TWO_STAGE_TIMEOUT_MS = 10 * 60 * 1000;

function getTimeoutMs(type) {
  if (type === "professionalTwoStage") {
    return AI_TWO_STAGE_TIMEOUT_MS;
  }

  return AI_TIMEOUT_MS;
}

// ==========================================
// リクエストデータの正規化
// ==========================================

function normalizePayload(payload = {}) {
  const prompt = typeof payload.prompt === "string"
    ? payload.prompt.trim()
    : "";

  const message = typeof payload.message === "string"
    ? payload.message.trim()
    : "";

  if (!prompt) {
    throw new Error("AI校正用のpromptが空です。");
  }

  if (!message) {
    throw new Error("AI校正対象のmessageが空です。");
  }

  return { prompt, message };
}

function normalizeStoredPlanPayload(payload = {}) {
  const childId = Number(payload.child_id);

  const message = typeof payload.message === "string"
    ? payload.message.trim()
    : "";

  if (!Number.isSafeInteger(childId) || childId < 1 || !message) {
    throw new Error("対象児童とAIに送信するテキストを指定してください。");
  }

  return {
    child_id: childId,
    message,
  };
}

// ==========================================
// エラー情報の取得
// ==========================================

function getErrorInfo(result) {
  const error = result?.error ?? {};

  const code = String(
    error.code ??
    error.original_code ??
    result?.code ??
    ""
  ).toUpperCase();

  const rawStatus =
    error.status ??
    error.http_status ??
    error.response?.status ??
    result?.status ??
    result?.http_status;

  const status = rawStatus == null || rawStatus === ""
    ? null
    : Number(rawStatus);

  const message = String(
    result?.message ??
    error.message ??
    ""
  );

  return {
    code,
    status: Number.isFinite(status) ? status : null,
    message,
  };
}

// ==========================================
// エラー分類
// ==========================================

function classifyAiError(result, timeoutMs) {
  const { code, status, message } = getErrorInfo(result);

  const isTimeout =
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    code === "ERR_CANCELED_TIMEOUT" ||
    /timeout of \d+ms exceeded/i.test(message) ||
    /timed?\s*out/i.test(message);

  let errorType = "unknown";
  let displayMessage = "AI文章校正の処理中にエラーが発生しました。";

  // ------------------------------------------
  // 1. クライアント側のタイムアウト
  // ------------------------------------------

  if (isTimeout) {
    errorType = "timeout";

    const minutes = timeoutMs / 60000;

    displayMessage =
      `AIからの応答が${minutes}分以内に返りませんでした。` +
      "Laravel側では処理が継続中、または完了している可能性があります。" +
      "再送信するとAI処理が重複する可能性があります。";
  }

  // ------------------------------------------
  // 2. 認証エラー
  // ------------------------------------------

  else if (status === 401 || status === 403) {
    errorType = "authentication";

    displayMessage =
      "Laravel APIの認証またはアクセス権限に問題があります。" +
      "再ログインしてからお試しください。";
  }

  // ------------------------------------------
  // 3. API側のタイムアウト
  // ------------------------------------------

  else if (status === 408 || status === 504) {
    errorType = "server_timeout";

    displayMessage =
      "Laravel APIまたは接続先サーバーで応答待ち時間を超過しました。" +
      "AI処理が完了しているか確認してください。";
  }

  // ------------------------------------------
  // 4. レート制限
  // ------------------------------------------

  else if (status === 429) {
    errorType = "rate_limit";

    displayMessage =
      "AI APIの利用制限に達した可能性があります。" +
      "しばらく時間をおいてからお試しください。";
  }

  // ------------------------------------------
  // 5. ネットワークエラー
  // ------------------------------------------

  else if (
    code === "ERR_NETWORK" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ECONNRESET"
  ) {
    errorType = "network";

    displayMessage =
      "Laravelサーバーとの通信に失敗しました。" +
      "ネットワーク接続またはサーバーの稼働状況を確認してください。";
  }

  // ------------------------------------------
  // 6. Laravel APIエラー
  // ------------------------------------------

  else if (status !== null && status >= 400) {
    errorType = "api_error";

    displayMessage =
      `Laravel APIがエラーを返しました（HTTP ${status}）。` +
      "AI文章校正の処理状況を確認してください。";
  }

  // ------------------------------------------
  // 7. その他
  // ------------------------------------------

  else if (message) {
    displayMessage = message;
  }

  return {
    ...result,

    success: false,

    message: displayMessage,

    error: {
      ...(result?.error && typeof result.error === "object"
        ? result.error
        : {}),

      type: errorType,
      code: code || null,
      status,
      timeout_ms: timeoutMs,
      original_message: message || null,
    },

    meta: {
      ...(result?.meta ?? {}),
      error_type: errorType,
      timeout_ms: timeoutMs,
    },
  };
}

// ==========================================
// AI文章校正
// ==========================================

async function correctByType(type, payload = {}) {
  const endpoint = ENDPOINTS[type];

  if (!endpoint) {
    throw new Error(`未対応のAI校正種別です: ${type}`);
  }

  const usesStoredPlan =
    type === "personalWithPlan" ||
    type === "professionalTwoStage";

  const normalizedPayload = usesStoredPlan
    ? normalizeStoredPlanPayload(payload)
    : normalizePayload(payload);

  const timeoutMs = getTimeoutMs(type);

  // ------------------------------------------
  // API通信
  // ------------------------------------------

  let result;

  try {
    result = await executeAuthenticatedOperation(
      () => laravelApiClient.post(
        endpoint,
        normalizedPayload,
        {
          timeout: timeoutMs,
        }
      ),
      "AI文章校正に失敗しました。",
    );
  } catch (error) {
    console.error(
      `[Laravel AiRecordEditer] ${type} request error:`,
      error
    );

    const formattedError = formatError(
      error,
      "AI文章校正に失敗しました。"
    );

    const errorResult = {
      ...formattedError,

      success: false,

      message:
        error?.message ??
        formattedError?.message ??
        "AI文章校正に失敗しました。",

      error: {
        ...(formattedError?.error &&
        typeof formattedError.error === "object"
          ? formattedError.error
          : {}),

        code:
          error?.code ??
          formattedError?.error?.code ??
          null,

        status:
          error?.response?.status ??
          formattedError?.error?.status ??
          null,
      },
    };

    return classifyAiError(errorResult, timeoutMs);
  }

  // ------------------------------------------
  // APIが失敗結果を返した場合
  // ------------------------------------------

  if (result?.success === false) {
    const classifiedResult = classifyAiError(
      result,
      timeoutMs
    );

    console.error(
      `[Laravel AiRecordEditer] ${type} failed:`,
      {
        errorType: classifiedResult.error?.type,
        status: classifiedResult.error?.status,
        code: classifiedResult.error?.code,
        originalMessage:
          classifiedResult.error?.original_message,
      }
    );

    return classifiedResult;
  }

  // ------------------------------------------
  // 正常終了
  // ------------------------------------------

  return {
    success: true,
    connected: true,

    message: "AI文章校正が完了しました。",

    data: unwrapData(result),

    meta: {
      authenticated: true,
      type,
      timeout_ms: timeoutMs,
      reauthenticated:
        result?.meta?.reauthenticated ?? false,
    },

    error: null,
  };
}

// ==========================================
// IPCハンドラー
// ==========================================

function createHandler(type) {
  return async (_event, payload = {}) => {
    try {
      return await correctByType(type, payload);
    } catch (error) {
      console.error(
        `[Laravel AiRecordEditer] ${type} correct error:`,
        error
      );

      const timeoutMs = getTimeoutMs(type);

      const formattedError = formatError(
        error,
        "AI文章校正に失敗しました。"
      );

      return classifyAiError(
        {
          ...formattedError,
          success: false,
          message:
            error?.message ??
            formattedError?.message ??
            "AI文章校正に失敗しました。",
          error: {
            ...(formattedError?.error &&
            typeof formattedError.error === "object"
              ? formattedError.error
              : {}),
            code: error?.code ?? null,
            status: error?.response?.status ?? null,
          },
        },
        timeoutMs
      );
    }
  };
}

// ==========================================
// エクスポート
// ==========================================

module.exports = {
  personalHandler: createHandler("personal"),

  personalWithPlanHandler:
    createHandler("personalWithPlan"),

  professionalHandler:
    createHandler("professional"),

  professionalTwoStageHandler:
    createHandler("professionalTwoStage"),
};
