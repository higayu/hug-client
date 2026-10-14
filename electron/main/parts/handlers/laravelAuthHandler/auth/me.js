// main/parts/handlers/laravelAuthHandler/auth/me.js

const laravelApiClient = require(
  "../../../../../../src/laravelApiClient"
);

const {
  executeAuthenticatedOperation,
} = require("./authenticated");

const {
  formatError,
} = require("./utils");

/**
 * Laravel APIから認証済みユーザーを取得する。
 */
async function fetchAuthenticatedUser() {
  const result =
    await executeAuthenticatedOperation(
      () => laravelApiClient.me(),
      "ログインスタッフ情報の取得に失敗しました。"
    );

  if (result?.success === false) {
    return result;
  }

  const user =
    result?.user ??
    result?.data?.user ??
    result?.data ??
    result ??
    null;

  return {
    success: true,
    connected: true,
    message:
      "ログインスタッフ情報を取得しました。",
    data: {
      user,
    },
    user,
    meta: {
      authenticated: true,
      reauthenticated:
        result?.meta?.reauthenticated ??
        false,
    },
    error: null,
  };
}

/**
 * 認証済みユーザー取得用IPCハンドラー。
 */
const handler = async () => {
  try {
    return await fetchAuthenticatedUser();
  } catch (error) {
    console.error(
      "❌ [Laravel Auth] me error:",
      error
    );

    return formatError(
      error,
      "ログインスタッフ情報の取得に失敗しました。"
    );
  }
};

module.exports = {
  fetchAuthenticatedUser,
  handler,
};