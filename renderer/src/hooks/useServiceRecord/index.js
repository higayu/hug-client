import { useCallback } from "react";
import { getServiceRecordMonthly as getFromLaravel } from "./parts/laravel";
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
  return unwrapRows(await getFromLaravel(payload));
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
