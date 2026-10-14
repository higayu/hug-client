// main/parts/handlers/laravelAuthHandler/auth/authenticated.js

const { executeLaravelLogin } = require("./login");
const {
  isPlainObject,
  isUnauthorized,
  formatError,
  hasAccessToken,
  clearLaravelAuthentication,
} = require("./utils");

/**
 * JWTがなければLaravelへログインする。
 */
async function ensureLaravelAuthenticated() {
  if (hasAccessToken()) {
    return {
      success: true,
      connected: true,
      message: "Laravel認証済みです。",
      data: null,
      meta: { authenticated: true, alreadyAuthenticated: true },
      error: null,
    };
  }

  return executeLaravelLogin();
}

/**
 * JWT認証付きでLaravel API処理を実行する。
 * 401の場合は再ログイン後に1回だけ再実行する。
 */
async function executeAuthenticatedOperation(operation, fallbackMessage) {
  const authResult = await ensureLaravelAuthenticated();

  if (!authResult.success) {
    return authResult;
  }

  const executeOnce = async () => {
    const result = await operation();

    if (result?.success === false && isUnauthorized(result)) {
      const error = new Error(result.message || "Laravel認証の有効期限が切れています。");
      error.status = 401;
      error.data = result;
      throw error;
    }

    return result;
  };

  try {
    return await executeOnce();
  } catch (error) {
    if (!isUnauthorized(error)) {
      return formatError(error, fallbackMessage);
    }

    console.warn("⚠️ [Laravel API] JWT期限切れ。再ログインします。");

    const loginResult = await executeLaravelLogin({ force: true });

    if (!loginResult.success) {
      return loginResult;
    }

    try {
      const retryResult = await executeOnce();

      if (isPlainObject(retryResult)) {
        retryResult.meta = {
          ...(retryResult.meta ?? {}),
          authenticated: true,
          reauthenticated: true,
        };
      }

      return retryResult;
    } catch (retryError) {
      return formatError(retryError, fallbackMessage);
    }
  }
}

module.exports = {
  ensureLaravelAuthenticated,
  executeAuthenticatedOperation,
};