const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

function normalizeId(id) {
  const normalized = Number(id);

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error("Q&AのIDは1以上の整数で指定してください。");
  }

  return normalized;
}

function normalizeListParams(params = {}) {
  const normalized = {};

  const q = String(params?.q ?? "").trim();
  if (q) {
    normalized.q = q;
  }

  const category = String(params?.category ?? "").trim();
  if (category) {
    normalized.category = category;
  }

  const systemKey = String(params?.system_key ?? "").trim();
  if (systemKey) {
    normalized.system_key = systemKey;
  }

  if (params?.include_inactive !== undefined) {
    normalized.include_inactive = [true, 1, "1", "true"].includes(
      params.include_inactive,
    )
      ? 1
      : 0;
  }

  return normalized;
}

function normalizeUpdatePayload(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Q&Aの更新データを指定してください。");
  }

  return payload;
}

async function fetchTroubleshootingKnowledgeList(params = {}) {
  const query = normalizeListParams(params);

  console.log("📥 [Laravel Q&A] list request:", {
    path: "/troubleshooting-knowledge",
    params: query,
  });

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.get("/troubleshooting-knowledge", { params: query }),
    "Q&A一覧の取得に失敗しました。",
  );

  if (result?.success === false) {
    return result;
  }

  const data = unwrapData(result);

  return {
    success: true,
    connected: true,
    message: result?.message ?? "Q&A一覧を取得しました。",
    data,
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function fetchTroubleshootingKnowledge(id) {
  const normalizedId = normalizeId(id);
  const path = `/troubleshooting-knowledge/${normalizedId}`;

  console.log("📥 [Laravel Q&A] get request:", { path });

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.get(path),
    "Q&Aの取得に失敗しました。",
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: result?.message ?? "Q&Aを取得しました。",
    data: unwrapData(result),
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      id: normalizedId,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function updateTroubleshootingKnowledge(id, payload = {}) {
  const normalizedId = normalizeId(id);
  const data = normalizeUpdatePayload(payload);
  const path = `/troubleshooting-knowledge/${normalizedId}`;

  console.log("📝 [Laravel Q&A] update request:", {
    path,
    keys: Object.keys(data),
  });

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.patch(path, data),
    "Q&Aの更新に失敗しました。",
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: result?.message ?? "Q&Aを更新しました。",
    data: unwrapData(result),
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      id: normalizedId,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function listHandler(_event, params = {}) {
  try {
    return await fetchTroubleshootingKnowledgeList(params);
  } catch (error) {
    console.error("❌ [Laravel Q&A] list error:", error);
    return formatError(error, "Q&A一覧の取得に失敗しました。");
  }
}

async function getHandler(_event, id) {
  try {
    return await fetchTroubleshootingKnowledge(id);
  } catch (error) {
    console.error("❌ [Laravel Q&A] get error:", error);
    return formatError(error, "Q&Aの取得に失敗しました。");
  }
}

async function updateHandler(_event, id, payload = {}) {
  try {
    return await updateTroubleshootingKnowledge(id, payload);
  } catch (error) {
    console.error("❌ [Laravel Q&A] update error:", error);
    return formatError(error, "Q&Aの更新に失敗しました。");
  }
}

module.exports = {
  normalizeId,
  normalizeListParams,
  normalizeUpdatePayload,
  fetchTroubleshootingKnowledgeList,
  fetchTroubleshootingKnowledge,
  updateTroubleshootingKnowledge,
  listHandler,
  getHandler,
  updateHandler,
};
