// main/parts/handlers/laravelAuthHandler/auth/login.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { loadLaravelCredentials, formatClientFailure, clearLaravelAuthentication } = require("./utils");

/**
 * config.jsonの情報でLaravelへログインする。
 */
async function executeLaravelLogin({ force = false } = {}) {
  if (force) {
    await clearLaravelAuthentication();
  }

  const { loginId, password } = loadLaravelCredentials();

  void 0;

  const result = await laravelApiClient.login(loginId, password);

  if (!result?.success) {
    return formatClientFailure(result, "Laravelへのログインに失敗しました。");
  }

  const user = result.user ?? result.data?.user ?? null;
  const expiresIn = result.expiresIn ?? result.expires_in ?? result.data?.expiresIn ?? result.data?.expires_in ?? null;
  const tokenType = result.tokenType ?? result.token_type ?? result.data?.tokenType ?? result.data?.token_type ?? "bearer";

  void 0;

  return {
    success: true,
    connected: true,
    message: "Laravelへのログインに成功しました。",
    data: { user, expiresIn, tokenType },
    user,
    expiresIn,
    tokenType,
    meta: { authenticated: true, alreadyAuthenticated: false },
    error: null,
  };
}

const handler = async () => {
  try {
    return await executeLaravelLogin({ force: true });
  } catch (error) {
    console.error("❌ [Laravel Auth] login error:", error);
    return require("./utils").formatError(error, "Laravelへのログインに失敗しました。");
  }
};

module.exports = {
  executeLaravelLogin,
  handler,
};