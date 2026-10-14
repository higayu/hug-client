// main/parts/handlers/laravelAuthHandler/procedures/upsert_temp_notes.js

const {
  callProcedure,
} = require("./call");

const {
  formatError,
} = require("../auth/utils");

const PROCEDURE_NAME =
  "upsert_temp_notes";

const ALLOWED_MODES = [
  "all",
  "memo1",
  "memo2",
];

/**
 * 通常のオブジェクトか確認する。
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * 必須の正整数へ変換する。
 */
function normalizePositiveInteger(
  value,
  fieldName,
) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(
      `${fieldName}が指定されていません。`,
    );
  }

  const normalized = Number(value);

  if (
    !Number.isInteger(normalized) ||
    normalized <= 0
  ) {
    throw new Error(
      `${fieldName}は1以上の整数で指定してください。`,
    );
  }

  return normalized;
}

/**
 * メモ本文を文字列へ変換する。
 *
 * undefined / null はnullとして扱う。
 * 空文字は有効な値としてそのまま保存する。
 */
function normalizeNullableText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  return String(value);
}

/**
 * 保存モードを正規化する。
 */
function normalizeMode(value) {
  const normalized =
    String(value ?? "all")
      .trim()
      .toLowerCase();

  if (
    !ALLOWED_MODES.includes(
      normalized,
    )
  ) {
    throw new Error(
      "modeはall、memo1、memo2のいずれかを指定してください。",
    );
  }

  return normalized;
}

/**
 * upsert_temp_notesへ渡す引数配列を作成する。
 *
 * SQL側の引数順:
 * 1. children_id
 * 2. staff_id
 * 3. day_of_week_id
 * 4. memo1
 * 5. memo2
 * 6. mode
 */
function buildProcedureParams(
  payload = {},
) {
  if (!isPlainObject(payload)) {
    throw new TypeError(
      "一時メモの保存データがオブジェクトではありません。",
    );
  }

  const mode =
    normalizeMode(payload.mode);

  const childrenId =
    normalizePositiveInteger(
      payload.children_id,
      "children_id",
    );

  const staffId =
    normalizePositiveInteger(
      payload.staff_id,
      "staff_id",
    );

  const dayOfWeekId =
    normalizePositiveInteger(
      payload.day_of_week_id,
      "day_of_week_id",
    );

  let memo1 =
    normalizeNullableText(
      payload.memo1,
    );

  let memo2 =
    normalizeNullableText(
      payload.memo2,
    );

  /*
   * memo1モードではmemo2を更新しない。
   * memo2モードではmemo1を更新しない。
   *
   * SQLプロシージャ側でもmodeを見て
   * 更新対象を判断するが、送信内容も明確にする。
   */
  if (mode === "memo1") {
    memo2 = null;
  }

  if (mode === "memo2") {
    memo1 = null;
  }

  return [
    childrenId,
    staffId,
    dayOfWeekId,
    memo1,
    memo2,
    mode,
  ];
}

/**
 * 一時メモを新規登録または更新する。
 */
async function upsertTempNotes(
  payload = {},
) {
  const params =
    buildProcedureParams(payload);

  console.log(
    "📤 [Laravel Procedure] upsertTempNotes:",
    {
      procedure: PROCEDURE_NAME,
      payload,
      params,
    },
  );

  const result =
    await callProcedure(
      PROCEDURE_NAME,
      params,
    );

  if (result?.success === false) {
    return result;
  }

  const mode =
    params[5];

  const message =
    mode === "memo1"
      ? "一時メモ1を保存しました。"
      : mode === "memo2"
        ? "一時メモ2を保存しました。"
        : "一時メモを保存しました。";

  return {
    success: true,
    connected: true,
    message,
    data:
      result?.data ?? null,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      procedure:
        PROCEDURE_NAME,
      mode,
      reauthenticated:
        result?.meta
          ?.reauthenticated ??
        false,
    },
    error: null,
  };
}

/**
 * モード別のIPCハンドラーを作成する。
 */
function createHandler(
  defaultMode,
) {
  return async (
    _event,
    payload = {},
  ) => {
    const normalizedPayload = {
      ...payload,
      mode:
        payload?.mode ??
        defaultMode,
    };

    try {
      console.log(
        "📤 [Laravel Procedure] IPC upsertTempNotes:",
        {
          mode:
            normalizedPayload.mode,
          payload:
            normalizedPayload,
        },
      );

      const result =
        await upsertTempNotes(
          normalizedPayload,
        );

      if (result.success) {
        console.log(
          "✅ [Laravel Procedure] upsertTempNotes DONE:",
          {
            mode:
              result.meta?.mode,
            data:
              result.data,
            reauthenticated:
              result.meta
                ?.reauthenticated ??
              false,
          },
        );
      } else {
        console.error(
          "❌ [Laravel Procedure] upsertTempNotes failed:",
          result,
        );
      }

      return result;
    } catch (error) {
      console.error(
        "❌ [Laravel Procedure] upsertTempNotes error:",
        error,
      );

      const mode =
        normalizedPayload.mode;

      const fallbackMessage =
        mode === "memo1"
          ? "一時メモ1の保存に失敗しました。"
          : mode === "memo2"
            ? "一時メモ2の保存に失敗しました。"
            : "一時メモの保存に失敗しました。";

      return formatError(
        error,
        fallbackMessage,
      );
    }
  };
}

module.exports = {
  PROCEDURE_NAME,
  ALLOWED_MODES,
  buildProcedureParams,
  upsertTempNotes,

  handler:
    createHandler("all"),

  saveAllHandler:
    createHandler("all"),

  saveMemo1Handler:
    createHandler("memo1"),

  saveMemo2Handler:
    createHandler("memo2"),
};