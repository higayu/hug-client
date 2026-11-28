// main/parts/handlers/laravelAuthHandler/procedures/update_staff.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

async function updateStaff(payload = {}) {
  void 0;

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.updateStaff(payload),
    "スタッフ情報の更新に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "スタッフ情報を更新しました。",
    data: unwrapData(result),
    meta: {
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

const handler = async (_event, payload = {}) => {
  try {
    void 0;

    const result = await updateStaff(payload);

    if (result.success) {
      void 0;
    } else {
      console.error("❌ [Laravel Procedure] updateStaff failed:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ [Laravel Procedure] updateStaff error:", error);
    return formatError(error, "スタッフ情報の更新に失敗しました。");
  }
};

module.exports = {
  updateStaff,
  handler,
};
