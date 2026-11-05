import { upsertAiPrompt as upsertToLaravel } from "./parts/laravel";

/**
 * 使用中のDBに応じてAIプロンプトを登録・更新する。
 */
export async function upsertAiPrompt({ databaseType, ...params }) {
  const normalizedDatabaseType = String(databaseType ?? "").toLowerCase();

  const upsert = {
    laravel: upsertToLaravel,
  }[normalizedDatabaseType];

  return upsert ? upsert(params) : null;
}
