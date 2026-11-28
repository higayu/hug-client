// src/apiClient.js
const axios = require("axios");
const { loadIni } = require("./iniUtils");

const DB_NAME = "houday";

const API_PORT = ":3001";
const SQL_PATH = "/api/sql";

// axios インスタンス（SQL API用）
const axiosInstance = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

// axios インスタンス（health確認用）
const healthAxiosInstance = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

/**
 * ini.json からAPIサーバのホスト部分を取得
 *
 * 例:
 * http://192.168.1.229
 * http://localhost
 */
function getBaseHost() {
  try {
    const ini = loadIni();
    return ini?.apiSettings?.baseURL || "http://192.168.1.229";
  } catch (err) {
    console.error("❌ [apiClient] loadIni error:", err);
    return "http://192.168.1.229";
  }
}

/**
 * SQL API用 baseURL を更新
 *
 * 例:
 * http://192.168.1.229:3001/api/sql
 */
function updateBaseURL() {
  const baseHost = getBaseHost();
  const baseURL = `${baseHost}${API_PORT}${SQL_PATH}`;

  axiosInstance.defaults.baseURL = baseURL;

  void 0;

  return axiosInstance.defaults.baseURL;
}

/**
 * Health Check用 URL を取得
 *
 * index.js に app.get("/health") を置いた場合:
 * http://192.168.1.229:3001/health
 */
function getHealthURL() {
  const baseHost = getBaseHost();
  return `${baseHost}${API_PORT}/health`;
}

// 初期設定
updateBaseURL();

/* =====================================================
   apiClient
===================================================== */
const apiClient = {
  /**
   * SQL API用 baseURL を再取得
   */
  updateBaseURL,

  /**
   * APIサーバ疎通確認
   *
   * index.js の app.get("/health") を叩く
   */
  checkConnection: async () => {
    const healthURL = getHealthURL();

    try {
      void 0;

      const res = await healthAxiosInstance.get(healthURL);

      return {
        success: true,
        connected: true,
        url: healthURL,
        data: res.data,
      };
    } catch (err) {
      console.error("❌ [apiClient] health check failed:", err.message);

      return {
        success: false,
        connected: false,
        url: healthURL,
        message: err.message || "API server connection failed",
        code: err.code || null,
        status: err.response?.status || null,
        statusText: err.response?.statusText || null,
        data: err.response?.data || null,
      };
    }
  },

  /**
   * SQL API自体の疎通確認
   *
   * /api/sql/houday/day_of_week を叩く
   */
  checkSqlConnection: async () => {
    try {
      updateBaseURL();

      const res = await axiosInstance.get(`/${DB_NAME}/day_of_week`);

      return {
        success: true,
        connected: true,
        data: res.data,
      };
    } catch (err) {
      console.error("❌ [apiClient] SQL check failed:", err.message);

      return {
        success: false,
        connected: false,
        message: err.message || "SQL API connection failed",
        code: err.code || null,
        status: err.response?.status || null,
        statusText: err.response?.statusText || null,
        data: err.response?.data || null,
      };
    }
  },

  /* --------------------
     GET
     -------------------- */
  get: async (table, config = {}) => {
    updateBaseURL();

    const res = await axiosInstance.get(
      `/${DB_NAME}/${table}`,
      config
    );

    return res.data;
  },

  /* --------------------
     POST（INSERT）
     -------------------- */
  post: async (table, data, config = {}) => {
    updateBaseURL();

    const res = await axiosInstance.post(
      `/${DB_NAME}/${table}`,
      data,
      config
    );

    return res.data;
  },

  /* --------------------
     PUT（UPDATE）
     -------------------- */
  put: async (table, data, config = {}) => {
    updateBaseURL();

    const res = await axiosInstance.put(
      `/${DB_NAME}/${table}`,
      data,
      config
    );

    return res.data;
  },

  /* --------------------
     DELETE
     -------------------- */
  delete: async (table, config = {}) => {
    updateBaseURL();

    const res = await axiosInstance.delete(
      `/${DB_NAME}/${table}`,
      config
    );

    return res.data;
  },

  /* --------------------
     全テーブル取得
     -------------------- */
  fetchTableAll: async () => {
    updateBaseURL();

    const res = await axiosInstance.get(`/${DB_NAME}/__all`);
    const { service_record: _serviceRecord, ...tables } = res.data ?? {};

    return tables;
  },

  /* --------------------
     Stored Procedure
     -------------------- */
  callProcedure: async (procname, params = []) => {
    updateBaseURL();

    // [{ value }] / [value] 両対応
    const values = params.map((p) =>
      typeof p === "object" && p !== null && "value" in p ? p.value : p
    );

    const res = await axiosInstance.post(
      `/${DB_NAME}/__procedure/${procname}`,
      { params: values }
    );

    return res.data;
  },
};

module.exports = apiClient;
