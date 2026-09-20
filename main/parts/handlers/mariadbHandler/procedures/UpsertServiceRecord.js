// main/parts/handlers/mariadbHandler/mariadb/procedures/UpsertServiceRecord.js
const apiClient = require("../../../../../src/apiClient");

const PROCEDURE_NAME = "UpsertServiceRecord";

const REQUIRED_FIELDS = [
  "children_id",
  "day_of_week_id",
  "item_id",
  "served_date",
  "facility_id",
];

/**
 * UpsertServiceRecord プロシージャ用パラメータを正規化
 *
 * @param {object} data
 * @returns {Array<number|string|null>}
 */
function buildUpsertServiceRecordParams(data = {}) {
  for (const key of REQUIRED_FIELDS) {
    if (data[key] === undefined || data[key] === null || data[key] === "") {
      throw new Error(`${key} が指定されていません`);
    }
  }

  return [
    Number(data.children_id),
    Number(data.day_of_week_id),
    Number(data.item_id),
    String(data.served_date),
    Number(data.facility_id),
    data.note ?? null,
    data.status === undefined || data.status === null || data.status === ""
      ? null
      : Number(data.status),
    Number(data.is_copy ?? 0),
    Number(data.is_deleted ?? 0),
    Number(data.recorded_staff_id ?? -1),
    Number(data.updated_staff_id ?? -1),
  ];
}

/**
 * service_record を UpsertServiceRecord ストアドプロシージャで登録・更新
 *
 * UNIQUE KEY (children_id, day_of_week_id, item_id, served_date) に一致する
 * 行があれば UPDATE、なければ INSERT される。
 *
 * @param {object} data
 * @param {number} data.children_id
 * @param {number} data.day_of_week_id
 * @param {number} data.item_id
 * @param {string} data.served_date  YYYY-MM-DD
 * @param {number} data.facility_id
 * @param {string|null} [data.note]
 * @param {number|null} [data.status] 1:公開 / 2:下書き
 * @param {number} [data.is_copy=0]
 * @param {number} [data.is_deleted=0]
 * @param {number} [data.recorded_staff_id=-1]
 * @param {number} [data.updated_staff_id=-1]
 */
async function upsertServiceRecord(data) {
  try {
    const params = buildUpsertServiceRecordParams(data);

    console.log("📨 main: upsertServiceRecord SEND:", {
      procedure: PROCEDURE_NAME,
      params,
    });

    const result = await apiClient.callProcedure(PROCEDURE_NAME, params);

    console.log("🟢 main: upsertServiceRecord RESULT:", result);
    return result;
  } catch (error) {
    console.error("❌ upsertServiceRecord ERROR:", error);
    throw error;
  }
}

module.exports = {
  PROCEDURE_NAME,
  buildUpsertServiceRecordParams,
  upsertServiceRecord,
};
