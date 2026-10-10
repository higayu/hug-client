// components/Sidebar/TabsContainer/InsertChildren/
// ChildrenTableList/insertManager/parts/laravel.js

/**
 * 値を正の整数へ変換する。
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
 * 値を整数へ変換する。
 */
function normalizeInteger(
  value,
  defaultValue,
  fieldName,
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
      `${fieldName}は整数で指定してください。`,
    );
  }

  return normalized;
}

/**
 * NULLを許可する整数へ変換する。
 */
function normalizeNullableInteger(
  value,
  fieldName,
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
      `${fieldName}は整数で指定してください。`,
    );
  }

  return normalized;
}

/**
 * MySQLのTIME型へ渡せる形式へ変換する。
 *
 * 対応形式:
 * - HH:mm
 * - HH:mm:ss
 */
function normalizeNullableTime(
  value,
  fieldName,
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
      `${fieldName}はHH:mmまたはHH:mm:ss形式で指定してください。`,
    );
  }

  return normalized.length === 5
    ? `${normalized}:00`
    : normalized;
}

/**
 * NULLを許可する文字列へ変換する。
 */
function normalizeNullableString(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return String(value);
}

/**
 * APIの失敗レスポンスからメッセージを取得する。
 */
function getResultErrorMessage(
  result,
  fallbackMessage,
) {
  return (
    result?.message ||
    result?.error?.message ||
    result?.error?.details?.message ||
    fallbackMessage
  );
}

/**
 * Laravelのregister_manager_assignmentプロシージャを使用して、
 * 以下を1トランザクションで処理する。
 *
 * - childrenの新規登録
 * - facility_childrenの登録
 * - managers2の登録または更新
 */
export async function handleLaravelInsert(
  child,
  {
    FACILITY_ID,
    STAFF_ID,

    // insertManager.js側で追加した新しい名前にも対応
    facilityId,
    staffId,

    weekId,
    priority = 0,
  },
) {
  console.log(
    "====== laravel: handleLaravel APIInsert START ======",
  );

  console.log(
    "処理する児童:",
    child,
  );

  try {
    if (
      !child ||
      typeof child !== "object"
    ) {
      throw new TypeError(
        "処理対象の児童データが不正です。",
      );
    }

    // ============================================================
    // ID正規化
    // ============================================================

    const targetFacilityId =
      normalizePositiveInteger(
        facilityId ?? FACILITY_ID,
        "facility_id",
      );

    const targetStaffId =
      normalizePositiveInteger(
        staffId ?? STAFF_ID,
        "staff_id",
      );

    const targetWeekId =
      normalizePositiveInteger(
        weekId,
        "day_of_week_id",
      );

    const targetChildId =
      normalizePositiveInteger(
        child.children_id ??
          child.id,
        "children_id",
      );

    const targetPriority =
      normalizeInteger(
        child.priority ?? priority,
        0,
        "priority",
      );

    const supportStartTime =
      normalizeNullableTime(
        child.support_start_time,
        "support_start_time",
      );

    const supportEndTime =
      normalizeNullableTime(
        child.support_end_time,
        "support_end_time",
      );

    console.log(
      "targetFacilityId:",
      targetFacilityId,
    );

    console.log(
      "targetStaffId:",
      targetStaffId,
    );

    console.log(
      "targetWeekId:",
      targetWeekId,
    );

    console.log(
      "targetChildId:",
      targetChildId,
    );

    console.log(
      "targetPriority:",
      targetPriority,
    );

    console.log(
      "supportStartTime:",
      supportStartTime,
    );

    console.log(
      "supportEndTime:",
      supportEndTime,
    );

    if (
      supportStartTime !== null &&
      supportEndTime !== null &&
      supportStartTime >= supportEndTime
    ) {
      throw new Error(
        "支援終了時間は支援開始時間より後にしてください。",
      );
    }

    // ============================================================
    // register_manager_assignment用ペイロード
    // ============================================================

    const payload = {
      // children
      children_id:
        targetChildId,

      children_name:
        String(
          child.children_name ??
            child.name ??
            "",
        ),

      notes:
        normalizeNullableString(
          child.notes,
        ),

      notes2:
        normalizeNullableString(
          child.notes2,
        ),

      personal_tmp:
        normalizeNullableString(
          child.personal_tmp,
        ),

      pronunciation_id:
        normalizeNullableInteger(
          child.pronunciation_id,
          "pronunciation_id",
        ),

      children_type_id:
        normalizeInteger(
          child.children_type_id,
          1,
          "children_type_id",
        ),

      is_delete:
        normalizeInteger(
          child.is_delete,
          0,
          "is_delete",
        ),

      leaving_at:
        normalizeNullableString(
          child.leaving_at,
        ),

      // facility_children
      facility_id:
        targetFacilityId,

      // managers2
      staff_id:
        targetStaffId,

      day_of_week_id:
        targetWeekId,

      priority:
        targetPriority,

      support_start_time:
        supportStartTime,

      support_end_time:
        supportEndTime,
    };

    console.log(
      "📡 laravel_procedure_registerManagerAssignment:",
      payload,
    );

    // ============================================================
    // 一括登録プロシージャ実行
    // ============================================================

    const registerFunction =
      window.electronAPI
        ?.laravel_procedure_registerManagerAssignment;

    if (
      typeof registerFunction !==
      "function"
    ) {
      throw new Error(
        "laravel_procedure_registerManagerAssignmentがpreloadに登録されていません。Electronを完全に再起動してください。",
      );
    }

    const result =
      await registerFunction(payload);

    console.log(
      "📥 laravel register_manager_assignment response:",
      result,
    );

    if (!result?.success) {
      throw new Error(
        getResultErrorMessage(
          result,
          "児童・施設・担当者情報の登録に失敗しました。",
        ),
      );
    }

    console.log(
      "✅ laravel: register_manager_assignment 完了",
      {
        children_id:
          targetChildId,
        facility_id:
          targetFacilityId,
        staff_id:
          targetStaffId,
        day_of_week_id:
          targetWeekId,
        data:
          result.data ?? null,
        reauthenticated:
          result.meta
            ?.reauthenticated ??
          false,
      },
    );

    return true;
  } catch (error) {
    console.error(
      "❌ laravel: register_manager_assignment エラー:",
      error,
    );

    return false;
  } finally {
    console.log(
      "====== laravel: handleLaravel APIInsert END ======",
    );
  }
}