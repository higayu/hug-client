// main/parts/handlers/laravelAuthHandler/auth/utils.js

const fs = require("fs");
const { getConfigPath } = require("../../../utils/pathResolver");
const laravelApiClient = require("../../../../../../src/laravelApiClient");

/**
 * 通常のオブジェクトか確認する。
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * config.jsonを読み込む。
 */
function loadConfig() {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    throw new Error(`config.jsonが見つかりません: ${configPath}`);
  }

  let config;

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(raw);
  } catch (error) {
    throw new Error(`config.jsonを読み込めませんでした: ${error.message}`);
  }

  if (!isPlainObject(config)) {
    throw new Error("config.jsonの内容がオブジェクトではありません。");
  }

  return config;
}

/**
 * config.jsonからLaravelのログイン情報を取得する。
 */
function loadLaravelCredentials() {
  const config = loadConfig();

  const loginId = typeof config.HUG_USERNAME === "string"
    ? config.HUG_USERNAME.trim()
    : "";

  const password = typeof config.HUG_PASSWORD === "string"
    ? config.HUG_PASSWORD
    : "";

  if (!loginId) {
    throw new Error("config.jsonのHUG_USERNAMEが設定されていません。");
  }

  if (!password) {
    throw new Error("config.jsonのHUG_PASSWORDが設定されていません。");
  }

  return { loginId, password };
}

/**
 * Axiosエラーなどからレスポンス本文を取得する。
 */
function getResponseData(value) {
  return value?.response?.data ?? value?.data ?? null;
}

/**
 * エラーやレスポンスからHTTPステータスを取得する。
 */
function getStatus(value) {
  return value?.response?.status ?? value?.status ?? value?.error?.status ?? null;
}

/**
 * 401 Unauthorizedか判定する。
 */
function isUnauthorized(value) {
  return Number(getStatus(value)) === 401;
}

/**
 * 例外をIPCで返せる形式へ変換する。
 */
function formatError(error, fallbackMessage = "Laravel APIとの通信中にエラーが発生しました。") {
  const responseData = getResponseData(error);

  return {
    success: false,
    connected: false,
    message: responseData?.message || error?.message || fallbackMessage,
    data: null,
    meta: { authenticated: false },
    error: {
      status: getStatus(error),
      statusText: error?.response?.statusText ?? error?.statusText ?? null,
      code: error?.code ?? null,
      validationErrors: responseData?.errors ?? error?.errors ?? null,
      details: responseData,
    },
  };
}

/**
 * laravelApiClientが返した失敗結果をIPC共通形式へ変換する。
 */
function formatClientFailure(result, fallbackMessage = "Laravel APIの処理に失敗しました。") {
  return {
    success: false,
    connected: false,
    message: result?.message || fallbackMessage,
    data: null,
    meta: { authenticated: false },
    error: {
      status: getStatus(result),
      statusText: result?.statusText ?? result?.error?.statusText ?? null,
      code: result?.code ?? result?.error?.code ?? null,
      validationErrors: result?.errors ?? result?.error?.validationErrors ?? null,
      details: result?.data ?? result?.error?.details ?? null,
    },
  };
}

/**
 * APIレスポンスからdata本体を取得する。
 */
function unwrapData(result) {
  if (isPlainObject(result) && Object.prototype.hasOwnProperty.call(result, "data")) {
    return result.data;
  }
  return result;
}

/**
 * JWTを保持しているか確認する。
 */
function hasAccessToken() {
  if (typeof laravelApiClient.getAccessToken !== "function") {
    return false;
  }
  return Boolean(laravelApiClient.getAccessToken());
}

/**
 * Laravel認証情報を破棄する。
 */
async function clearLaravelAuthentication() {
  if (typeof laravelApiClient.logout !== "function") {
    return;
  }
  await Promise.resolve(laravelApiClient.logout());
}

module.exports = {
  isPlainObject,
  loadConfig,
  loadLaravelCredentials,
  getResponseData,
  getStatus,
  isUnauthorized,
  formatError,
  formatClientFailure,
  unwrapData,
  hasAccessToken,
  clearLaravelAuthentication,
};