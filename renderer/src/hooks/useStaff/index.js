import { useCallback } from "react";
import {
  updateStaff as updateFromLaravel,
} from "./parts/laravel";

function normalizeDatabaseType(value) {
  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return String(
    value?.type ??
      value?.databaseType ??
      value?.dbType ??
      "laravel",
  ).toLowerCase();
}

function unwrapResult(result) {
  if (result?.success === false) {
    throw new Error(
      result.message ||
        result.error ||
        "職員情報の更新に失敗しました。",
    );
  }

  return result?.data ?? result;
}

/**
 * 職員情報を更新する
 *
 * payload:
 * {
 *   staffId: number,
 *   staff: {
 *     name,
 *     work_style,
 *     notes,
 *     is_delete,
 *     role_id,
 *     display_order,
 *     entered_at,
 *     leaving_at,
 *   },
 *   facilityIds: number[],
 * }
 */
export async function updateStaff(payload) {
  const databaseType = normalizeDatabaseType(
    await window.electronAPI.getDatabaseType(),
  );

  const updaters = {
    laravel: updateFromLaravel,
  };

  const updater =
    updaters[databaseType];

  if (!updater) {
    throw new Error(
      `未対応のデータベース種別です: ${databaseType}`,
    );
  }

  return unwrapResult(
    await updater(payload),
  );
}

export function useStaff() {
  const update = useCallback(
    (payload) => updateStaff(payload),
    [],
  );

  return {
    updateStaff: update,
  };
}