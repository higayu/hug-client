// main/parts/handlers/laravelAuthHandler/procedures/register_manager_assignment.js

const {
  callProcedure,
} = require("./call");

const {
  formatError,
} = require("../auth/utils");

const PROCEDURE_NAME =
  "register_manager_assignment";

/**
 * 通常のオブジェクトか判定する。
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
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(
      `${fieldName}が指定されていません。`
    );
  }

  const normalized = Number(value);

  if (
    !Number.isInteger(normalized) ||
    normalized <= 0
  ) {
    throw new Error(
      `${fieldName}は1以上の整数で指定してください。`
    );
  }

  return normalized;
}

/**
 * NULLを許可する整数へ変換する。
 */
function normalizeNullableInteger(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const normalized = Number(value);

  if (!Number.isInteger(normalized)) {
    throw new Error(
      `${fieldName}は整数で指定してください。`
    );
  }

  return normalized;
}

/**
 * デフォルト値付きの整数へ変換する。
 */
function normalizeInteger(
  value,
  defaultValue,
  fieldName
) {
  const source =
    value === undefined ||
    value === null ||
    String(value).trim() === ""
      ? defaultValue
      : value;

  const normalized = Number(source);

  if (!Number.isInteger(normalized)) {
    throw new Error(
      `${fieldName}は整数で指定してください。`
    );
  }

  return normalized;
}

/**
 * NULLを許可する文字列へ変換する。
 */
function normalizeNullableString(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  return String(value);
}

/**
 * 必須文字列へ変換する。
 */
function normalizeString(
  value,
  defaultValue = ""
) {
  if (
    value === undefined ||
    value === null
  ) {
    return defaultValue;
  }

  return String(value);
}

function normalizeRequiredInteger(value, fieldName) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(`${fieldName} is required.`);
  }

  const normalized = Number(value);
  if (!Number.isInteger(normalized)) {
    throw new Error(`${fieldName} must be an integer.`);
  }

  return normalized;
}

function normalizeBinaryInteger(value, defaultValue, fieldName) {
  const normalized = normalizeInteger(value, defaultValue, fieldName);

  if (normalized !== 0 && normalized !== 1) {
    throw new Error(`${fieldName} must be 0 or 1.`);
  }

  return normalized;
}

function normalizeNullableDate(value, fieldName) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const normalized = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== normalized) {
    throw new Error(`${fieldName} is not a valid date.`);
  }

  return normalized;
}

/**
 * MySQLのTIME型へ渡す時刻を正規化する。
 *
 * 対応形式:
 * - HH:mm
 * - HH:mm:ss
 */
function normalizeNullableTime(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  const timePattern =
    /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

  if (!timePattern.test(normalized)) {
    throw new Error(
      `${fieldName}はHH:mmまたはHH:mm:ss形式で指定してください。`
    );
  }

  return normalized.length === 5
    ? `${normalized}:00`
    : normalized;
}

/**
 * register_manager_assignmentプロシージャへ渡す
 * 引数配列を作成する。
 *
 * SQL側の引数順:
 *  1. children_id
 *  2. children_name
 *  3. notes
 *  4. notes2
 *  5. personal_tmp
 *  6. pronunciation_id
 *  7. children_type_id
 *  8. is_delete
 *  9. leaving_at
 * 10. facility_id
 * 11. staff_id
 * 12. day_of_week_id
 * 13. priority
 * 14. support_start_time
 * 15. support_end_time
 */
function buildProcedureParams(
  payload = {}
) {
  if (!isPlainObject(payload)) {
    throw new TypeError(
      "担当児童登録データがオブジェクトではありません。"
    );
  }

  const childrenId =
    normalizePositiveInteger(
      payload.children_id,
      "children_id"
    );

  const facilityId =
    normalizePositiveInteger(
      payload.facility_id,
      "facility_id"
    );

  const staffId =
    normalizePositiveInteger(
      payload.staff_id,
      "staff_id"
    );

  const dayOfWeekId =
    normalizePositiveInteger(
      payload.day_of_week_id,
      "day_of_week_id"
    );

  if (dayOfWeekId > 127) {
    throw new Error("day_of_week_id exceeds the TINYINT range.");
  }

  const childrenName = normalizeString(
    payload.children_name ?? payload.name,
    ""
  );

  if (childrenName.length > 255) {
    throw new Error("children_name must be 255 characters or fewer.");
  }

  const supportStartTime =
    normalizeNullableTime(
      payload.support_start_time,
      "support_start_time"
    );

  const supportEndTime =
    normalizeNullableTime(
      payload.support_end_time,
      "support_end_time"
    );

  if (
    supportStartTime !== null &&
    supportEndTime !== null &&
    supportStartTime >= supportEndTime
  ) {
    throw new Error(
      "support_end_timeはsupport_start_timeより後の時刻を指定してください。"
    );
  }

  return [
    childrenId,

    childrenName,

    normalizeNullableString(
      payload.notes
    ),

    normalizeNullableString(
      payload.notes2
    ),

    normalizeNullableString(
      payload.personal_tmp
    ),

    normalizeNullableInteger(
      payload.pronunciation_id,
      "pronunciation_id"
    ),

    normalizeRequiredInteger(
      payload.children_type_id,
      "children_type_id"
    ),

    normalizeBinaryInteger(
      payload.is_delete,
      0,
      "is_delete"
    ),

    normalizeNullableDate(
      payload.leaving_at,
      "leaving_at"
    ),

    facilityId,
    staffId,
    dayOfWeekId,

    normalizeBinaryInteger(
      payload.priority,
      0,
      "priority"
    ),

    supportStartTime,
    supportEndTime,
  ];
}

/**
 * 新規児童登録、施設との関連付け、
 * managers2登録・更新を一括実行する。
 */
async function registerManagerAssignment(
  payload = {}
) {
  const params =
    buildProcedureParams(payload);

  void 0;

  const result =
    await callProcedure(
      PROCEDURE_NAME,
      params
    );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message:
      "児童・施設・担当者情報を登録しました。",
    data: result?.data ?? null,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      procedure: PROCEDURE_NAME,
      reauthenticated:
        result?.meta?.reauthenticated ??
        false,
    },
    error: null,
  };
}

/**
 * Electron IPCハンドラー。
 */
const handler = async (
  _event,
  payload = {}
) => {
  try {
    void 0;

    const result =
      await registerManagerAssignment(
        payload
      );

    if (result.success) {
      void 0;
    } else {
      console.error(
        "❌ [Laravel Procedure] registerManagerAssignment failed:",
        result
      );
    }

    return result;
  } catch (error) {
    console.error(
      "❌ [Laravel Procedure] registerManagerAssignment error:",
      error
    );

    return formatError(
      error,
      "児童・施設・担当者情報の登録に失敗しました。"
    );
  }
};

module.exports = {
  PROCEDURE_NAME,
  buildProcedureParams,
  registerManagerAssignment,
  handler,
};
