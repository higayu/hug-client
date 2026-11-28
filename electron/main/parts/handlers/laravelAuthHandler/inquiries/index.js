const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function normalizePayload(payload = {}) {
  const message = String(payload?.message ?? "").trim();
  if (!message || message.length > 10000) {
    throw new Error("報告内容は1文字以上10,000文字以内で入力してください。");
  }

  const screenshots = Array.isArray(payload?.screenshots) ? payload.screenshots : [];
  if (screenshots.length > MAX_FILES) {
    throw new Error("スクリーンショットは5枚まで添付できます。");
  }

  let totalSize = 0;
  const files = screenshots.map((file, index) => {
    const type = String(file?.type ?? "").toLowerCase();
    const bytes = Buffer.from(file?.bytes ?? []);
    if (!ALLOWED_TYPES.has(type)) throw new Error(`${index + 1}枚目の画像形式には対応していません。`);
    if (!bytes.length || bytes.length > MAX_FILE_SIZE) throw new Error(`${index + 1}枚目の画像は10MiB以内にしてください。`);
    totalSize += bytes.length;
    return {
      name: String(file?.name || `screenshot-${index + 1}`).slice(0, 255),
      type,
      bytes,
    };
  });
  if (totalSize > MAX_TOTAL_SIZE) {
    throw new Error("添付画像の合計は50MiB以内にしてください。");
  }

  return {
    message,
    appVersion: String(payload?.appVersion ?? "").slice(0, 100),
    files,
  };
}

async function storeInquiry(payload) {
  const data = normalizePayload(payload);
  const form = new FormData();
  form.append("message", data.message);
  if (data.appVersion) form.append("app_version", data.appVersion);
  data.files.forEach((file) => {
    form.append("screenshots[]", new Blob([file.bytes], { type: file.type }), file.name);
  });

  const result = await executeAuthenticatedOperation(
    async () => {
      laravelApiClient.updateBaseURL();
      const token = laravelApiClient.getAccessToken();
      const baseURL = String(laravelApiClient.getBaseURL()).replace(/\/+$/, "");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      try {
        const response = await fetch(`${baseURL}/inquiries`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: form,
          signal: controller.signal,
        });
        const text = await response.text();
        let responseData = null;
        try { responseData = text ? JSON.parse(text) : null; } catch (_) { responseData = { message: text }; }

        if (!response.ok) {
          const error = new Error(responseData?.message || `HTTP ${response.status}`);
          error.status = response.status;
          error.statusText = response.statusText;
          error.data = responseData;
          throw error;
        }
        return responseData;
      } finally {
        clearTimeout(timeout);
      }
    },
    "問い合わせの送信に失敗しました。",
  );

  if (result?.success === false) return result;
  return {
    success: true,
    data: unwrapData(result),
    message: result?.message || "問い合わせを受け付けました。",
  };
}

async function storeHandler(_event, payload) {
  try {
    return await storeInquiry(payload);
  } catch (error) {
    return formatError(error, "問い合わせの送信に失敗しました。");
  }
}

module.exports = { normalizePayload, storeInquiry, storeHandler };
