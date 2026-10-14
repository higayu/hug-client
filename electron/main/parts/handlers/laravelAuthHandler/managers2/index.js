// main/parts/handlers/laravelAuthHandler/managers2/index.js

const laravelApiClient = require(
    "../../../../../../src/laravelApiClient"
  );
  
  const {
    executeAuthenticatedOperation,
  } = require("../auth/authenticated");
  
  const {
    formatError,
    unwrapData,
  } = require("../auth/utils");
  
  /**
   * managers2の複合主キー。
   */
  const MANAGERS2_PRIMARY_KEY = [
    "children_id",
    "facility_id",
    "staff_id",
    "day_of_week_id",
  ];
  
  /**
   * IDを正の整数へ変換する。
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
      normalized < 1
    ) {
      throw new Error(
        `${fieldName}は1以上の整数で指定してください。`
      );
    }
  
    return normalized;
  }
  
  /**
   * pkとvaluesから主キーオブジェクトを生成する。
   *
   * 対応形式:
   *
   * {
   *   pk: [
   *     "children_id",
   *     "facility_id",
   *     "staff_id",
   *     "day_of_week_id"
   *   ],
   *   values: [81, 3, 73, 3]
   * }
   */
  function buildKeyFromPkValues(
    pk,
    values
  ) {
    let pkColumns = pk;
    let pkValues = values;
  
    if (typeof pkColumns === "string") {
      pkColumns = pkColumns
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  
    if (
      typeof pkValues === "string"
    ) {
      pkValues = pkValues
        .split(",")
        .map((value) => value.trim());
    }
  
    /*
     * valuesがオブジェクトならそのまま利用する。
     */
    if (
      pkValues &&
      typeof pkValues === "object" &&
      !Array.isArray(pkValues)
    ) {
      return pkValues;
    }
  
    if (
      !Array.isArray(pkColumns) ||
      !Array.isArray(pkValues)
    ) {
      return {};
    }
  
    const key = {};
  
    pkColumns.forEach(
      (columnName, index) => {
        key[columnName] =
          pkValues[index];
      }
    );
  
    return key;
  }
  
  /**
   * rendererから受信した削除条件を正規化する。
   *
   * 以下の両方へ対応する。
   *
   * 直接形式:
   * {
   *   children_id: 81,
   *   facility_id: 3,
   *   staff_id: 73,
   *   day_of_week_id: 3
   * }
   *
   * 汎用CRUD形式:
   * {
   *   pk: [...],
   *   values: [...]
   * }
   */
  function normalizeDeletePayload(
    payload = {}
  ) {
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      throw new TypeError(
        "managers2の削除条件が正しくありません。"
      );
    }
  
    const source =
      payload.pk !== undefined ||
      payload.values !== undefined
        ? buildKeyFromPkValues(
            payload.pk,
            payload.values
          )
        : payload;
  
    const key = {
      children_id:
        normalizePositiveInteger(
          source.children_id,
          "children_id"
        ),
  
      facility_id:
        normalizePositiveInteger(
          source.facility_id,
          "facility_id"
        ),
  
      staff_id:
        normalizePositiveInteger(
          source.staff_id,
          "staff_id"
        ),
  
      day_of_week_id:
        normalizePositiveInteger(
          source.day_of_week_id,
          "day_of_week_id"
        ),
    };
  
    return key;
  }
  
  /**
   * Laravel APIからmanagers2を削除する。
   *
   * DELETE /api/managers2
   */
  async function deleteManagers2(
    payload = {}
  ) {
    const key =
      normalizeDeletePayload(
        payload
      );
  
    console.log(
      "📤 [Laravel managers2] delete request:",
      {
        path:
          "/managers2",
  
        key,
      }
    );
  
    const result =
      await executeAuthenticatedOperation(
        () =>
          laravelApiClient.delete(
            "/managers2",
            {
              data: key,
            }
          ),
  
        "担当者情報の削除に失敗しました。"
      );
  
    console.log(
      "📥 [Laravel managers2] delete response:",
      result
    );
  
    if (result?.success === false) {
      return result;
    }
  
    return {
      success: true,
      connected: true,
  
      message:
        result?.message ||
        "担当者情報を削除しました。",
  
      data:
        unwrapData(result),
  
      meta: {
        authenticated: true,
  
        key,
  
        reauthenticated:
          result?.meta
            ?.reauthenticated ??
          false,
      },
  
      error: null,
    };
  }
  
  /**
   * Electron IPCハンドラー。
   */
  const deleteHandler =
    async (
      _event,
      payload = {}
    ) => {
      try {
        console.log(
          "🗑 [Laravel managers2] IPC delete:",
          payload
        );
  
        const result =
          await deleteManagers2(
            payload
          );
  
        if (result.success) {
          console.log(
            "✅ [Laravel managers2] delete DONE:",
            {
              key:
                result.meta?.key,
  
              data:
                result.data,
            }
          );
        } else {
          console.error(
            "❌ [Laravel managers2] delete failed:",
            result
          );
        }
  
        return result;
      } catch (error) {
        console.error(
          "❌ [Laravel managers2] delete error:",
          error
        );
  
        return formatError(
          error,
          "担当者情報の削除に失敗しました。"
        );
      }
    };
  
  module.exports = {
    MANAGERS2_PRIMARY_KEY,
    normalizeDeletePayload,
    deleteManagers2,
    deleteHandler,
  };