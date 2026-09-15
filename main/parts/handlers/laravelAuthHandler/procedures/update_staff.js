// main/parts/handlers/laravelAuthHandler/procedures/update_staff.js

const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

function normalizeUpdateStaffPayload(payload = {}) {
  const staff = payload?.staff ?? {};
  const hasUseMyPrompt = Object.prototype.hasOwnProperty.call(
    staff,
    "use_my_prompt"
  );

  return {
    ...payload,
    staff: {
      ...staff,
      use_my_prompt:
        !hasUseMyPrompt || staff.use_my_prompt == null
          ? null
          : [true, 1, "1"].includes(staff.use_my_prompt)
            ? 1
            : 0,
    },
  };
}

async function updateStaff(payload = {}) {
  const normalizedPayload = normalizeUpdateStaffPayload(payload);

  console.log("📤 [Laravel Procedure] updateStaff:", normalizedPayload);

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.updateStaff(normalizedPayload),
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
    console.log("📤 [Laravel Procedure] IPC updateStaff:", payload);

    const result = await updateStaff(payload);

    if (result.success) {
      console.log("✅ [Laravel Procedure] updateStaff DONE:", result.data);
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
  normalizeUpdateStaffPayload,
  updateStaff,
  handler,
};
