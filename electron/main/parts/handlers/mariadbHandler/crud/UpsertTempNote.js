// main/parts/handlers/mariadbHandler/mariadb/crud/UpsertTempNote.js

const apiClient = require("../../../../../../src/apiClient");

function normalizeRows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.rows)) return response.rows;
  if (response?.data && !Array.isArray(response.data)) return [response.data];
  return [];
}

function normalizePkValues(pk, values) {
  const normalizedPk = Array.isArray(pk) ? pk.join(",") : pk;
  const normalizedValues = Array.isArray(values)
    ? values.join(",")
    : values;

  if (!normalizedPk || !normalizedValues) {
    throw new Error("pk / values が不正です");
  }

  return {
    pk: normalizedPk,
    values: normalizedValues,
  };
}

function buildTempNotePk(data) {
  const { children_id, staff_id, day_of_week_id } = data;

  if (
    children_id === undefined ||
    staff_id === undefined ||
    day_of_week_id === undefined
  ) {
    throw new Error(
      "temp_notes の保存には children_id, staff_id, day_of_week_id が必要です"
    );
  }

  return normalizePkValues(
    ["children_id", "staff_id", "day_of_week_id"],
    [children_id, staff_id, day_of_week_id]
  );
}

async function getTempNote(data) {
  const params = buildTempNotePk(data);

  const result = await apiClient.get("temp_notes/_search", {
    params,
  });

  const rows = normalizeRows(result);

  return rows[0] || null;
}

async function upsertTempNote(data) {
  const params = buildTempNotePk(data);

  const existing = await apiClient.get("temp_notes/_search", {
    params,
  });

  const rows = normalizeRows(existing);
  const exists = rows.length > 0;

  if (exists) {
    const updateResult = await apiClient.put("temp_notes", data, {
      params,
    });

    return {
      success: true,
      mode: "update",
      data: updateResult,
    };
  }

  const insertResult = await apiClient.post("temp_notes", data);

  return {
    success: true,
    mode: "insert",
    data: insertResult,
  };
}

async function upsertTempNote1(data) {
  return upsertTempNote({
    children_id: data.children_id,
    staff_id: data.staff_id,
    day_of_week_id: data.day_of_week_id,
    memo1: data.memo1 ?? "",
  });
}

async function upsertTempNote2(data) {
  return upsertTempNote({
    children_id: data.children_id,
    staff_id: data.staff_id,
    day_of_week_id: data.day_of_week_id,
    memo2: data.memo2 ?? "",
  });
}

module.exports = {
  upsertTempNote,
  upsertTempNote1,
  upsertTempNote2,
  getTempNote,
};
