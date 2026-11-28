// src/laravelApiClient.js

const axios = require("axios");

const {
  loadIni,
} = require("./iniUtils");

const DEFAULT_HOST =
  "https://dev-hug-banso.we-labo.com";

const DEFAULT_PORT =
  "";

const DEFAULT_API_PATH =
  "/api";

const DEFAULT_TIMEOUT =
  30000;

// AIによる健康分析は通常のAPIより処理時間が長いため、個別に待機時間を確保する。
const HEALTH_ANALYSIS_TIMEOUT =
  300000;

const HEALTH_TIMEOUT =
  5000;

let accessToken = null;

/**
 * 文字列を正規化する。
 */
function normalizeString(
  value,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

/**
 * APIパスを「/api」のような形式へ正規化する。
 */
function normalizeApiPath(
  value,
) {
  const path =
    normalizeString(value) ||
    DEFAULT_API_PATH;

  if (path === "/") {
    return "";
  }

  return `/${path.replace(
    /^\/+|\/+$/g,
    "",
  )}`;
}

/**
 * ポート番号を正規化する。
 */
function normalizePort(
  value,
) {
  const raw = normalizeString(
    String(value ?? ""),
  ).replace(/^:/, "");

  if (!raw) {
    return DEFAULT_PORT;
  }

  if (!/^\d+$/.test(raw)) {
    console.warn(
      "⚠️ [laravelApiClient] ポート番号が不正なため既定値を使用します:",
      value,
    );

    return DEFAULT_PORT;
  }

  const port = Number(raw);

  if (
    port < 1 ||
    port > 65535
  ) {
    console.warn(
      "⚠️ [laravelApiClient] ポート番号が範囲外のため既定値を使用します:",
      value,
    );

    return DEFAULT_PORT;
  }

  return String(port);
}

/**
 * ini.jsonのapiSettingsを安全に取得する。
 */
function loadApiSettings() {
  try {
    const ini =
      loadIni();

    if (
      !ini ||
      typeof ini !== "object" ||
      Array.isArray(ini)
    ) {
      return {};
    }

    const settings =
      ini.apiSettings;

    if (
      !settings ||
      typeof settings !==
        "object" ||
      Array.isArray(settings)
    ) {
      return {};
    }

    return settings;
  } catch (error) {
    console.error(
      "❌ [laravelApiClient] ini.jsonの読み込みに失敗しました:",
      error?.message ||
        error,
    );

    return {};
  }
}

/**
 * プロトコルがない場合はhttp://を補う。
 */
function ensureProtocol(
  value,
) {
  const raw =
    normalizeString(value);

  if (!raw) {
    return DEFAULT_HOST;
  }

  if (
    /^https?:\/\//i.test(
      raw,
    )
  ) {
    return raw;
  }

  return `http://${raw}`;
}

/**
 * HTTP/HTTPS URLとして解析する。
 */
function parseHttpUrl(
  value,
  label,
) {
  let parsed;

  try {
    parsed =
      new URL(value);
  } catch {
    throw new Error(
      `${label}が不正です: ${value}`,
    );
  }

  if (
    parsed.protocol !==
      "http:" &&
    parsed.protocol !==
      "https:"
  ) {
    throw new Error(
      `${label}はhttpまたはhttpsで指定してください: ${value}`,
    );
  }

  return parsed;
}

/**
 * Laravel APIのURLを生成する。
 *
 * 対応するbaseURL例:
 *
 * http://192.168.1.229
 * 192.168.1.229
 * http://192.168.1.229:8000
 * http://192.168.1.229:8000/api
 *
 * ini.jsonで使用できる設定:
 *
 * apiSettings.laravelURL
 * apiSettings.port
 * apiSettings.apiPort
 * apiSettings.apiPath
 */
function buildLaravelBaseURL(
  apiSettings = {},
) {
  const configuredBaseURL =
    normalizeString(
      apiSettings.laravelURL,
    ) ||
    DEFAULT_HOST;

  const configuredPort =
    normalizePort(
      apiSettings.port ??
        apiSettings.apiPort ??
        DEFAULT_PORT,
    );

  const configuredApiPath =
    normalizeApiPath(
      apiSettings.apiPath ??
        DEFAULT_API_PATH,
    );

  const parsed =
    parseHttpUrl(
      ensureProtocol(
        configuredBaseURL,
      ),
      "Laravel APIのbaseURL",
    );

  /*
   * baseURLにポートが含まれていない場合のみ追加する。
   */
  if (!parsed.port) {
    parsed.port =
      configuredPort;
  }

  const currentPath =
    parsed.pathname.replace(
      /\/+$/g,
      "",
    );

  /*
   * baseURLにパスが含まれていない場合のみ/apiを追加する。
   */
  if (
    !currentPath ||
    currentPath === "/"
  ) {
    parsed.pathname =
      configuredApiPath ||
      "/";
  } else {
    parsed.pathname =
      currentPath;
  }

  parsed.search = "";
  parsed.hash = "";

  return parsed
    .toString()
    .replace(/\/$/, "");
}

/**
 * Laravel APIのbaseURLを取得する。
 */
function getLaravelBaseURL() {
  const apiSettings =
    loadApiSettings();

  try {
    return buildLaravelBaseURL(
      apiSettings,
    );
  } catch (error) {
    console.error(
      "❌ [laravelApiClient] Laravel API URLの生成に失敗しました:",
      error?.message ||
        error,
    );

    return buildLaravelBaseURL({
      baseURL:
        DEFAULT_HOST,
      port:
        DEFAULT_PORT,
      apiPath:
        DEFAULT_API_PATH,
    });
  }
}

/**
 * Laravelサーバーのoriginを取得する。
 *
 * 例:
 * http://192.168.1.229:8000
 */
function getLaravelOrigin() {
  return new URL(
    getLaravelBaseURL(),
  ).origin;
}

/**
 * Axiosインスタンス。
 *
 * ini.jsonの読込は各リクエスト直前に行う。
 */
const laravelAxiosInstance =
  axios.create({
    baseURL:
      buildLaravelBaseURL({
        baseURL:
          DEFAULT_HOST,
        port:
          DEFAULT_PORT,
        apiPath:
          DEFAULT_API_PATH,
      }),

    /*
     * HTTP_PROXY / HTTPS_PROXY / ALL_PROXYなどの
     * 環境プロキシを使用せず、Laravelへ直接接続する。
     */
    proxy: false,

    headers: {
      Accept:
        "application/json",

      "Content-Type":
        "application/json",
    },

    timeout:
      DEFAULT_TIMEOUT,
  });

/**
 * すべてのLaravel APIリクエストでプロキシを無効化する。
 *
 * 呼び出し側からconfig.proxyが渡された場合でも、
 * 必ず直接接続へ上書きする。
 */
laravelAxiosInstance
  .interceptors
  .request
  .use(
    (config) => {
      config.proxy =
        false;

      return config;
    },
    (error) =>
      Promise.reject(
        error,
      ),
  );

/**
 * AxiosのbaseURLを更新する。
 */
function updateBaseURL() {
  const baseURL =
    getLaravelBaseURL();

  laravelAxiosInstance
    .defaults
    .baseURL =
    baseURL;

  void 0;

  return baseURL;
}

/**
 * JWTをAxiosへ設定する。
 */
function setAccessToken(
  token,
) {
  accessToken =
    typeof token ===
      "string" &&
    token.trim() !== ""
      ? token.trim()
      : null;

  if (accessToken) {
    laravelAxiosInstance
      .defaults
      .headers
      .common
      .Authorization =
      `Bearer ${accessToken}`;
  } else {
    delete laravelAxiosInstance
      .defaults
      .headers
      .common
      .Authorization;
  }
}

/**
 * 現在保持しているJWTを取得する。
 */
function getAccessToken() {
  return accessToken;
}

/**
 * Axiosエラーを共通形式へ変換する。
 */
function formatError(
  error,
  fallbackMessage =
    "Laravel APIへの接続に失敗しました。",
) {
  const responseData =
    error?.response?.data ??
    null;

  return {
    success: false,

    message:
      responseData?.message ||
      error?.message ||
      fallbackMessage,

    status:
      error?.response?.status ??
      error?.status ??
      null,

    statusText:
      error?.response
        ?.statusText ??
      error?.statusText ??
      null,

    code:
      error?.code ??
      null,

    errors:
      responseData?.errors ??
      null,

    data:
      responseData,
  };
}

/**
 * リクエスト直前の共通処理。
 */
function prepareRequest() {
  return updateBaseURL();
}

const laravelApiClient = {
  // HUG停止中の共有記録。2種類の担当職員IDを含むpayloadをそのまま送る。
  listHugOutageRecords: async (scope) => {
    prepareRequest();
    const response = await laravelAxiosInstance.get('/hug-outage-records', { params: scope });
    return response.data;
  },
  saveHugOutageRecord: async (record) => {
    prepareRequest();
    const response = await laravelAxiosInstance.post('/hug-outage-records', record);
    return response.data;
  },
  deleteTransferredHugOutageRecords: async (payload) => {
    prepareRequest();
    const response = await laravelAxiosInstance.post('/hug-outage-records/delete-transferred', payload);
    return response.data;
  },

  /**
   * Laravel APIのbaseURLを更新する。
   */
  updateBaseURL,

  /**
   * Laravel APIのbaseURLを取得する。
   */
  getBaseURL:
    getLaravelBaseURL,

  /**
   * Laravelサーバーのoriginを取得する。
   */
  getOrigin:
    getLaravelOrigin,

  /**
   * JWTを設定する。
   */
  setAccessToken,

  /**
   * JWTを取得する。
   */
  getAccessToken,

  /**
   * JWTを破棄する。
   */
  logout: () => {
    setAccessToken(null);

    return {
      success: true,

      message:
        "ログアウトしました。",
    };
  },

  /**
   * Laravel APIの疎通確認。
   *
   * GET /up
   */
  checkConnection:
    async () => {
      let healthURL =
        null;

      try {
        healthURL =
          `${getLaravelOrigin()}/up`;

        const response =
          await axios.get(
            healthURL,
            {
              /*
               * 疎通確認でも環境プロキシを使用しない。
               */
              proxy: false,

              timeout:
                HEALTH_TIMEOUT,

              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        return {
          success: true,
          connected: true,
          url: healthURL,
          data:
            response.data,
        };
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] health check failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        return {
          ...formatError(
            error,
            "Laravel APIの疎通確認に失敗しました。",
          ),

          connected: false,

          url:
            healthURL,
        };
      }
    },

  /**
   * Laravel APIから全テーブルを取得する。
   *
   * GET /api/__all
   */
  fetchTableAll:
    async (
      params = {},
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.get(
            "/__all",
            {
              params,
            },
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] fetchTableAll failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * スタッフログイン。
   *
   * POST /api/auth/login
   */
  login:
    async (
      loginId,
      password,
    ) => {
      prepareRequest();

      try {
        setAccessToken(
          null,
        );

        const response =
          await laravelAxiosInstance.post(
            "/auth/login",
            {
              login_id:
                loginId,

              password,
            },
          );

        const token =
          response.data
            ?.access_token ??
          response.data
            ?.accessToken ??
          null;

        if (
          typeof token !==
            "string" ||
          token.trim() === ""
        ) {
          throw new Error(
            "ログインレスポンスにアクセストークンがありません。",
          );
        }

        setAccessToken(
          token,
        );

        return {
          success: true,

          accessToken:
            token,

          tokenType:
            response.data
              ?.token_type ||
            response.data
              ?.tokenType ||
            "bearer",

          expiresIn:
            response.data
              ?.expires_in ??
            response.data
              ?.expiresIn ??
            null,

          user:
            response.data
              ?.user ??
            null,

          data:
            response.data,
        };
      } catch (error) {
        setAccessToken(
          null,
        );

        console.error(
          "❌ [laravelApiClient] login failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        return formatError(
          error,
          "Laravelへのログインに失敗しました。",
        );
      }
    },

  /**
   * ログイン中スタッフを取得する。
   *
   * GET /api/auth/me
   */
  me:
    async () => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.get(
            "/auth/me",
          );

        return {
          success: true,

          user:
            response.data
              ?.user ??
            response.data ??
            null,

          data:
            response.data,
        };
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] me failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        return formatError(
          error,
          "ログインスタッフ情報の取得に失敗しました。",
        );
      }
    },

  /**
   * スタッフ情報を同期する。
   *
   * POST /api/staffs/sync
   */
  syncStaff:
    async (
      staffData,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/staffs/sync",
            staffData,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] staff sync failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 児童の個人記録を検索する。
   *
   * GET /api/service-records/_search
   */
  searchServiceRecords:
    async (
      childId,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.get(
            "/service-records/_search",
            {
              params: {
                pk:
                  "child_id",

                values:
                  childId,
              },
            },
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] record search failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 個人記録を1件保存する。
   *
   * POST /api/service-records
   */
  saveServiceRecord:
    async (
      record,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/service-records",
            record,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] record save failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 個人記録を一括保存する。
   *
   * POST /api/service-records/bulk
   */
  saveServiceRecordsBulk:
    async (
      records,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/service-records/bulk",
            {
              records,
            },
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] bulk record save failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 健康分析を実行する。
   *
   * POST /api/health-analysis/analyze
   */
  analyzeHealth:
    async ({
      year = null,
      month = null,
      childId = null,
    } = {}) => {
      prepareRequest();

      const payload = {};

      if (
        year !== null
      ) {
        payload.year =
          Number(year);
      }

      if (
        month !== null
      ) {
        payload.month =
          Number(month);
      }

      if (
        childId !== null
      ) {
        payload.child_id =
          Number(childId);
      }

      try {
        const response =
          await laravelAxiosInstance.post(
            "/health-analysis/analyze",
            payload,
            {
              timeout:
                HEALTH_ANALYSIS_TIMEOUT,
            },
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] health analysis failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 健康分析統計を取得する。
   *
   * GET /api/health-analysis/statistics
   */
  getHealthStatistics:
    async (
      year = null,
      month = null,
    ) => {
      prepareRequest();

      const params = {};

      if (
        year !== null
      ) {
        params.year =
          Number(year);
      }

      if (
        month !== null
      ) {
        params.month =
          Number(month);
      }

      try {
        const response =
          await laravelAxiosInstance.get(
            "/health-analysis/statistics",
            {
              params,
            },
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] statistics failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 健康分析ログ一覧を取得する。
   *
   * GET /api/health-analysis/logs
   */
  getHealthAnalysisLogs:
    async (
      params = {},
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.get(
            "/health-analysis/logs",
            {
              params,
            },
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] logs failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 健康分析ログ詳細を取得する。
   *
   * GET /api/health-analysis/logs/{logId}
   */
  getHealthAnalysisLog:
    async (
      logId,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.get(
            `/health-analysis/logs/${Number(
              logId,
            )}`,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] log detail failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 異常児童一覧を取得する。
   *
   * GET /api/health-analysis/abnormal-children
   */
  getAbnormalChildren:
    async (
      year = null,
      month = null,
      limit = 50,
    ) => {
      prepareRequest();

      const params = {
        limit,
      };

      if (
        year !== null
      ) {
        params.year =
          Number(year);
      }

      if (
        month !== null
      ) {
        params.month =
          Number(month);
      }

      try {
        const response =
          await laravelAxiosInstance.get(
            "/health-analysis/abnormal-children",
            {
              params,
            },
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] abnormal children failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /* =====================================================
     Procedure 関連関数（apiClient.js を参考に実装）
     ===================================================== */

  /**
   * 汎用プロシージャ実行
   *
   * POST /api/__procedure
   *
   * @param {string} procedureName - プロシージャ名
   * @param {Array} params - プロシージャに渡すパラメータ
   * @returns {Promise<Object>} 実行結果
   */
  callProcedure:
    async (
      procedureName,
      params = [],
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure",
            {
              procedure:
                procedureName,
              params,
            },
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] callProcedure failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * register_facility_children プロシージャ実行
   *
   * POST /api/__procedure/register-facility-children
   *
   * @param {Object} payload - { facility_id: number, children: Array }
   * @returns {Promise<Object>} 実行結果
   */
  registerFacilityChildren:
    async (
      payload,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/register-facility-children",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] registerFacilityChildren failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * sync_hug_staffs プロシージャ実行
   *
   * POST /api/__procedure/sync-hug-staffs
   *
   * @param {Object} payload - { staff: Array }
   * @returns {Promise<Object>} 実行結果
   */
  syncHugStaffs:
    async (
      payload,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/sync-hug-staffs",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] syncHugStaffs failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /** POST /api/__procedure/update-staff */
  updateStaff:
    async (
      payload,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/update-staff",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] updateStaff failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * UpsertServiceRecord プロシージャ実行
   *
   * POST /api/__procedure/upsert-service-record
   *
   * @param {Object} payload - サービス記録データ
   * @returns {Promise<Object>} 実行結果
   */
  upsertServiceRecord:
    async (
      payload,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/upsert-service-record",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] upsertServiceRecord failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * upsert_managers2 プロシージャ実行
   *
   * POST /api/__procedure/upsert-managers2
   *
   * @param {Object} payload - マネージャー設定データ
   * @returns {Promise<Object>} 実行結果
   */
  /** POST /api/__procedure/get-service-record-monthly */
  getServiceRecordMonthly:
    async (
      payload = {},
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/get-service-record-monthly",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] getServiceRecordMonthly failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /** POST /api/__procedure/get-child-kadai-graph */
  getChildKadaiGraph:
    async (
      payload = {},
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/get-child-kadai-graph",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "[laravelApiClient] getChildKadaiGraph failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /** POST /api/__procedure/upsert-child-kadai-graph */
  upsertChildKadaiGraph:
    async (payload = {}) => {
      prepareRequest();

      try {
        const response = await laravelAxiosInstance.post(
          "/__procedure/upsert-child-kadai-graph",
          payload,
        );

        return response.data;
      } catch (error) {
        console.error(
          "[laravelApiClient] upsertChildKadaiGraph failed:",
          error?.response?.data || error?.message || error,
        );
        throw error;
      }
    },

  /** DELETE /api/child-records/{id} */
  deleteChildRecord: async (id) => {
    prepareRequest();

    const response = await laravelAxiosInstance.delete(`/child-records/${id}`);
    return response.data;
  },

  /** POST /api/__procedure/get-active-ai-prompt */
  getActiveAiPrompt:
    async (
      payload = {},
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/get-active-ai-prompt",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] getActiveAiPrompt failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /** POST /api/__procedure/upsert-ai-prompt */
  upsertAiPrompt:
    async (
      payload,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/upsert-ai-prompt",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] upsertAiPrompt failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /** POST /api/__procedure/upsert-managers2 */
  upsertManagers2:
    async (
      payload,
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.post(
            "/__procedure/upsert-managers2",
            payload,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] upsertManagers2 failed:",
          error?.response
            ?.data ||
            error?.message ||
            error,
        );

        throw error;
      }
    },

  /**
   * 汎用GET。
   */
  get:
    async (
      path,
      config = {},
    ) => {
      prepareRequest();

      const response =
        await laravelAxiosInstance.get(
          path,
          config,
        );

      return response.data;
    },

  /**
   * 汎用POST。
   */
  post:
    async (
      path,
      data = {},
      config = {},
    ) => {
      prepareRequest();

      const response =
        await laravelAxiosInstance.post(
          path,
          data,
          config,
        );

      return response.data;
    },

  /**
   * 汎用DELETE。
   */
  patch:
    async (
      path,
      data = {},
      config = {},
    ) => {
      prepareRequest();

      const response =
        await laravelAxiosInstance.patch(
          path,
          data,
          config,
        );

      return response.data;
    },

  delete:
    async (
      path,
      config = {},
    ) => {
      prepareRequest();

      try {
        const response =
          await laravelAxiosInstance.delete(
            path,
            config,
          );

        return response.data;
      } catch (error) {
        console.error(
          "❌ [laravelApiClient] DELETE failed:",
          {
            path,

            response:
              error?.response?.data,

            message:
              error?.message,
          },
        );

        throw error;
      }
    },
};

module.exports = laravelApiClient;
