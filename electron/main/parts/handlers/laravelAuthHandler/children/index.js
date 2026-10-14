const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError } = require("../auth/utils");

function normalizeUpdatePayload(payload = {}) {
  const pk = String(payload.pk ?? "id").trim();
  if (pk !== "id") {
    throw new Error("children の更新キーは id のみ指定できます。");
  }

  const id = Number(payload.values);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error("children.id は1以上の整数で指定してください。");
  }

  if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
    throw new Error("children の更新データを指定してください。");
  }

  return { id, data: payload.data };
}

async function updateChildren(payload = {}) {
  const { id, data } = normalizeUpdatePayload(payload);
  return executeAuthenticatedOperation(
    () => laravelApiClient.patch(`/children/${id}`, data),
    "児童情報の更新に失敗しました。"
  );
}

async function updateHandler(_event, payload = {}) {
  try {
    return await updateChildren(payload);
  } catch (error) {
    console.error("[Laravel children] update error:", error);
    return formatError(error, "児童情報の更新に失敗しました。");
  }
}

module.exports = { normalizeUpdatePayload, updateChildren, updateHandler };
