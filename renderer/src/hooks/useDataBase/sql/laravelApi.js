// src/hooks/useDataBase/sql/laravelApi.js

/**
 * Laravel APIから取得対象とするテーブル。
 *
 * preload/tables.js の laravelTables と
 * 同じテーブル名に揃える。
 */
const TABLE_NAMES = [
  "children",
  "children_type",
  "day_of_week",
  "facility_children",
  "facility_staff",
  "facilitys",
  "individual_support",
  "managers2",
  "pc",
  "pc_to_children",
  "pronunciation",
  "staffs",
  "service_record",
  "temp_notes",
  "m_service_items",
  "staff_facility_roles",
  "memo",
];

/**
 * 空のテーブルデータを生成する。
 *
 * Laravel側に一部テーブルが含まれていなくても、
 * 呼び出し元で undefined にならないようにする。
 */
const createEmptyTables = () =>
  Object.fromEntries(
    TABLE_NAMES.map((tableName) => [
      tableName,
      [],
    ]),
  );

/**
 * IPCから返されたレスポンスをテーブルデータへ変換する。
 *
 * 対応形式:
 *
 * 1. 共通レスポンス形式
 * {
 *   success: true,
 *   data: {
 *     children: [],
 *     staffs: [],
 *   }
 * }
 *
 * 2. テーブルデータ直接形式
 * {
 *   children: [],
 *   staffs: [],
 * }
 */
const unwrapTableData = (result) => {
  if (
    result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    result.success === true &&
    Object.prototype.hasOwnProperty.call(
      result,
      "data",
    )
  ) {
    return result.data;
  }

  return result;
};

/**
 * 取得データをReduxへ渡せる形式に正規化する。
 */
const normalizeTables = (data) => {
  const normalized =
    createEmptyTables();

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return normalized;
  }

  for (const tableName of TABLE_NAMES) {
    const tableData =
      data[tableName];

    normalized[tableName] =
      Array.isArray(tableData)
        ? tableData
        : [];
  }

  /*
   * TABLE_NAMESに未登録のデータがLaravelから返った場合も
   * 失わないように追加する。
   */
  for (const [
    tableName,
    tableData,
  ] of Object.entries(data)) {
    if (
      !Object.prototype.hasOwnProperty.call(
        normalized,
        tableName,
      )
    ) {
      normalized[tableName] =
        Array.isArray(tableData)
          ? tableData
          : tableData;
    }
  }

  // record_types は施設別APIで取得するため __all の結果を使用しない。
  delete normalized.record_types;
  return normalized;
};

/**
 * テーブルごとの取得件数を生成する。
 */
const createTableCounts = (tables) =>
  Object.fromEntries(
    Object.entries(tables).map(
      ([tableName, tableData]) => [
        tableName,
        Array.isArray(tableData)
          ? tableData.length
          : 0,
      ],
    ),
  );

export const laravelApi = {
  /** 指定施設の課題タイプを個別取得する。失敗時は例外を投げる。 */
  async getRecordTypes(facilityId) {
    const id = Number(facilityId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("課題タイプ取得には有効な施設IDが必要です。");
    }

    const fetcher = window.electronAPI?.laravel_recordTypes_getAll
      ?? window.electronAPI?.laravel_record_types_getAll;
    if (typeof fetcher !== "function") {
      throw new Error("RecordType個別取得APIがPreloadに公開されていません。");
    }

    const result = await fetcher({ facility_id: id });
    if (result?.success === false) {
      throw new Error(result.message || result.error || "課題タイプ取得に失敗しました。");
    }

    const data = result?.success === true ? result.data : result;
    if (!Array.isArray(data)) {
      throw new Error("課題タイプAPIのレスポンスが配列ではありません。");
    }
    return data;
  },

  /**
   * Laravel APIから全テーブルを取得する。
   *
   * 成功時はテーブルオブジェクトを直接返す。
   * 失敗時はnullを返す。
   */
  async getAllTables(
    params = {},
  ) {
    const requestId = Math.random()
      .toString(36)
      .slice(2, 8);

    const timerName =
      `Laravel全テーブル取得時間_${requestId}`;

    console.group(
      `🌐 [laravelApi] getAllTables [${requestId}]`,
    );

    try {
      if (!window.electronAPI) {
        console.error(
          "❌ window.electronAPIが定義されていません。",
        );

        return null;
      }

      if (
        typeof window.electronAPI
          .laravel_fetchTableAll !==
        "function"
      ) {
        console.error(
          "❌ laravel_fetchTableAllがElectron APIに公開されていません。",
        );

        void 0;

        return null;
      }

      void 0;

      console.time(timerName);

      const result =
        await window.electronAPI
          .laravel_fetchTableAll(params);

      console.timeEnd(timerName);

      void 0;

      /*
       * main側の共通レスポンスが失敗の場合。
       */
      if (
        result &&
        typeof result === "object" &&
        result.success === false
      ) {
        console.error(
          "❌ Laravel全テーブル取得失敗:",
          {
            message:
              result.message,
            error:
              result.error,
            meta:
              result.meta,
          },
        );

        return null;
      }

      const rawTables =
        unwrapTableData(result);

      if (
        !rawTables ||
        typeof rawTables !==
          "object" ||
        Array.isArray(rawTables)
      ) {
        console.error(
          "❌ Laravel APIから取得したデータ形式が不正です。",
          {
            rawTables,
            result,
          },
        );

        return null;
      }

      const tables =
        normalizeTables(
          rawTables,
        );

      const tableCounts =
        createTableCounts(
          tables,
        );

      void 0;

      void 0;

      if (
        result?.meta
      ) {
        void 0;
      }

      return tables;
    } catch (error) {
      /*
       * console.timeが開始済みで、
       * まだ終了していない場合に備える。
       */
      try {
        console.timeEnd(
          timerName,
        );
      } catch {
        // 何もしない
      }

      console.error(
        "❌ [laravelApi] getAllTablesエラー:",
        {
          message:
            error?.message,
          name:
            error?.name,
          stack:
            error?.stack,
          response:
            error?.response?.data,
        },
      );

      return null;
    } finally {
      console.groupEnd();
    }
  },
};

export default laravelApi;
