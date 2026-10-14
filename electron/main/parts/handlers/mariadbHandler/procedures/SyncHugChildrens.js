// main/parts/handlers/mariadbHandler/mariadb/procedures/SyncHugChildrens.js
const apiClient = require("../../../../../../src/apiClient");

const PROCEDURE_NAME = "register_facility_children";

function validateHugChildrenResult(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("送信データが不正です。児童データを取得し直してください。");
  }

  // facility_id のチェック
  const facilityId = payload.facility_id;
  if (facilityId === undefined || facilityId === null) {
    throw new Error("施設IDが指定されていません。");
  }
  if (isNaN(Number(facilityId))) {
    throw new Error("施設IDが数値ではありません。");
  }

  // children のチェック
  if (!Array.isArray(payload.children) || payload.children.length === 0) {
    throw new Error("送信する児童データがありません。");
  }

  // 各児童データの必須フィールドをチェック
  for (const child of payload.children) {
    if (child.id === undefined || child.id === null) {
      throw new Error("児童IDが不足しています。");
    }
    if (!child.name || child.name.trim() === "") {
      throw new Error(`児童ID ${child.id} の名前が空です。`);
    }
  }

  return payload;
}

/**
 * register_facility_children ストアドプロシージャを呼び出す
 * 
 * @param {Object} payload - { facility_id: number, children: Array }
 * @returns {Promise<Object>} ストアドプロシージャの実行結果
 */
async function syncHugChildrens(payload) {
  console.log("[syncHugChildrens] 受信ペイロード:", JSON.stringify(payload, null, 2));

  const safePayload = validateHugChildrenResult(payload);

  const facilityId = Number(safePayload.facility_id);
  const childrenJson = safePayload.children.map((child) => ({
    id: Number(child.id),
    name: child.name || "",
    furigana: child.furigana || "",
    pronunciation_id: child.pronunciation_id ? Number(child.pronunciation_id) : null,
    children_type_id: child.children_type_id || 1,
    notes: child.notes || "",
    notes2: child.notes2 || "",
    personal_tmp: child.personal_tmp || "",
    is_delete: child.is_delete || 0,
    leaving_at: child.leaving_at || null,
  }));

  console.log(`[syncHugChildrens] facilityId: ${facilityId}, childrenCount: ${childrenJson.length}`);

  try {
    // ★ ストアドプロシージャに渡すパラメータ ★
    // 第1引数: facility_id (数値)
    // 第2引数: children_json (文字列化したJSON)
    const result = await apiClient.callProcedure(PROCEDURE_NAME, [
      facilityId,
      JSON.stringify(childrenJson),
    ]);

    console.log("[syncHugChildrens] ストアドプロシージャ実行結果:", result);
    return result;
  } catch (error) {
    console.error("[syncHugChildrens] ERROR:", error);
    throw error;
  }
}

module.exports = {
  PROCEDURE_NAME,
  syncHugChildrens,
  validateHugChildrenResult,
};
