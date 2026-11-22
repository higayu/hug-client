import { useCallback } from "react";
import { getServiceRecordMonthly as getFromLaravel } from "./parts/laravel";

function normalizeDatabaseType(value) {
  if (typeof value === "string") return value.toLowerCase();

  return String(
    value?.type ?? value?.databaseType ?? value?.dbType ?? "laravel",
  ).toLowerCase();
}

function unwrapRows(result) {
  if (result?.success === false) {
    throw new Error(result.message || result.error || "月次サービス記録の取得に失敗しました。");
  }

  const rows = result?.data ?? result;

  if (!Array.isArray(rows)) {
    throw new Error("月次サービス記録のレスポンス形式が不正です。");
  }

  return rows;
}

export async function getServiceRecordMonthly(payload) {
  const databaseType = normalizeDatabaseType(
    await window.electronAPI.getDatabaseType(),
  );

  const loaders = {
    laravel: getFromLaravel,
  };

  const loader = loaders[databaseType];

  if (!loader) {
    throw new Error(`未対応のデータベース種別です: ${databaseType}`);
  }

  return unwrapRows(await loader(payload));
}

export function useServiceRecord() {
  const loadMonthly = useCallback(
    (payload) => getServiceRecordMonthly(payload),
    [],
  );

  return {
    getServiceRecordMonthly: loadMonthly,
  };
}
