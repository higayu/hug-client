// 一時運用: Laravel API のみを許可する。
// MariaDB/SQLite の実装は保持し、再有効化時に見直す。
export const LARAVEL_ONLY_MODE = true;

export function assertDatabaseEnabled(type) {
  const normalized = String(type ?? "").trim().toLowerCase();
  if (LARAVEL_ONLY_MODE && normalized !== "laravel") {
    throw new Error(`現在はLaravel専用モードです（${normalized || "unknown"} は利用できません）。`);
  }
  return normalized;
}
