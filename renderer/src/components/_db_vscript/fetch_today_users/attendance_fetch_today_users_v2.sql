START TRANSACTION;

-- attendance_fetch_today_users V2 初期登録
-- 物理JSファイルは作らず、web_automation_files_v2 の source_text を
-- WebAutomationV2/moduleLoader.js がメモリ上の仮想モジュールとして実行する。

SET @app_key = 'hug-banso-navi';
SET @flow_key = 'attendance_fetch_today_users';
SET @flow_version = 1;

-- 初期登録をやり直せるよう、同一versionだけ置き換える。
DELETE FROM web_automation_flows_v2
WHERE app_key = @app_key
  AND flow_key = @flow_key
  AND version = @flow_version;

INSERT INTO web_automation_flows_v2 (
    app_key,
    flow_key,
    name,
    description,
    entry_file,
    entry_export,
    engine_version,
    config_json,
    input_schema_json,
    output_schema_json,
    timeout_ms,
    version,
    status,
    published_at
) VALUES (
    @app_key,
    @flow_key,
    '今日の利用者取得',
    'HUGの出席表HTMLをWebViewで取得し、Renderer側で児童ID・氏名・入室・退室・編集URLを抽出するV2 Flow。',
    'index.js',
    'default',
    1,
    '{"request":{"url":"https://www.hug-ayumu.link/hug/wm/attendance.php","method":"GET","credentials":"include","query":{"mode":"detail"}},"loginCheck":{"enabled":true,"loginInputSelector":"input[name=\\"username\\"]","titleContains":"ログイン","htmlContains":"login.php"},"table":{"primarySelector":"table.sortTable01:not(.sortTableAdding):not(.js_adding_table)","fallbackSelector":"table","bodySelector":"tbody"},"columns":{"childInfo":1,"edit":4,"enter":5,"leave":6},"child":{"idQueryParameter":"id","nameSelector":"p"},"attendance":{"timePattern":"^\\\\d{2}:\\\\d{2}$","enterTextKey":"column5","enterHtmlKey":"column5Html","leaveTextKey":"column6","leaveHtmlKey":"column6Html"},"response":{"returnHtml":true,"returnRowCount":true,"returnPageTitle":true,"returnPageUrl":true}}',
    '{"type":"object","required":["facilityId","dateStr"],"properties":{"facilityId":{"type":["string","number"]},"dateStr":{"type":"string","pattern":"^\\\\d{4}-\\\\d{2}-\\\\d{2}$"}}}',
    '{"type":"object","required":["ok","html","extracted"],"properties":{"ok":{"type":"boolean"},"html":{"type":"string"},"rowCount":{"type":"integer"},"pageTitle":{"type":"string"},"pageUrl":{"type":"string"},"extracted":{"type":"object","required":["success","data","rowCount"]}}}',
    30000,
    @flow_version,
    'published',
    NOW()
);

SET @flow_id = LAST_INSERT_ID();

INSERT INTO web_automation_files_v2 (
    flow_id,
    file_path,
    file_type,
    source_text,
    module_type,
    config_json,
    content_hash,
    is_active
) VALUES (
    @flow_id,
    'index.js',
    'javascript',
    'const { fetchAttendanceHtml } = await require("./fetch");
const { extractColumnData } = await require("./parse");

module.exports = async function executeAttendanceFetchTodayUsers({
  input,
  helpers,
  config,
  flow,
}) {
  const raw = await fetchAttendanceHtml({
    input,
    helpers,
    config,
  });

  if (!raw?.ok) {
    throw new Error(
      raw?.error || "利用者データ取得に失敗しました"
    );
  }

  const extracted = await extractColumnData(
    raw.html,
    config
  );

  if (!extracted?.success) {
    throw new Error(
      extracted?.error || "利用者データ抽出に失敗しました"
    );
  }

  return {
    ...raw,

    flowKey:
      flow?.flow_key ||
      "attendance_fetch_today_users",

    automationConfig: config,

    extracted,
  };
};
',
    'commonjs',
    NULL,
    SHA2('const { fetchAttendanceHtml } = await require("./fetch");
const { extractColumnData } = await require("./parse");

module.exports = async function executeAttendanceFetchTodayUsers({
  input,
  helpers,
  config,
  flow,
}) {
  const raw = await fetchAttendanceHtml({
    input,
    helpers,
    config,
  });

  if (!raw?.ok) {
    throw new Error(
      raw?.error || "利用者データ取得に失敗しました"
    );
  }

  const extracted = await extractColumnData(
    raw.html,
    config
  );

  if (!extracted?.success) {
    throw new Error(
      extracted?.error || "利用者データ抽出に失敗しました"
    );
  }

  return {
    ...raw,

    flowKey:
      flow?.flow_key ||
      "attendance_fetch_today_users",

    automationConfig: config,

    extracted,
  };
};
', 256),
    1
);

INSERT INTO web_automation_files_v2 (
    flow_id,
    file_path,
    file_type,
    source_text,
    module_type,
    config_json,
    content_hash,
    is_active
) VALUES (
    @flow_id,
    'fetch.js',
    'javascript',
    'exports.fetchAttendanceHtml = async function fetchAttendanceHtml({
  input,
  helpers,
  config,
}) {
  const facilityId = String(input?.facilityId || "");
  const dateStr = String(input?.dateStr || "");

  if (!facilityId || !dateStr) {
    throw new Error(
      "施設IDまたは日付が設定されていません"
    );
  }

  const runtimeConfig = {
    ...config,

    request: {
      ...(config?.request || {}),

      query: {
        ...(config?.request?.query || {}),
        f_id: facilityId,
        date: dateStr,
      },
    },
  };

  const webviewFunction = async (CONFIG) => {
    const request = CONFIG.request || {};
    const tableConfig = CONFIG.table || {};
    const loginCheck = CONFIG.loginCheck || {};

    const params = new URLSearchParams();

    Object.entries(request.query || {}).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null
        ) {
          params.set(key, String(value));
        }
      }
    );

    const queryString = params.toString();

    const targetUrl =
      request.url +
      (queryString
        ? (
            request.url.includes("?")
              ? "&"
              : "?"
          ) + queryString
        : "");

    const extractTableFromDocument = (doc) => {
      let table = null;

      if (tableConfig.primarySelector) {
        table = doc.querySelector(
          tableConfig.primarySelector
        );
      }

      if (
        !table &&
        tableConfig.fallbackSelector
      ) {
        table = doc.querySelector(
          tableConfig.fallbackSelector
        );
      }

      if (!table) {
        const tables =
          doc.querySelectorAll("table");

        if (tables.length > 0) {
          table = tables[0];
        }
      }

      if (!table) {
        return null;
      }

      const rows =
        table.querySelectorAll("tr");

      return {
        html: table.outerHTML,
        rowCount: rows.length,
        className:
          table.className || "",
      };
    };

    try {
      const response = await fetch(
        targetUrl,
        {
          method:
            request.method || "GET",

          credentials:
            request.credentials ||
            "include",

          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "HTTP error: " +
            response.status
        );
      }

      const pageHtml =
        await response.text();

      const doc =
        new DOMParser().parseFromString(
          pageHtml,
          "text/html"
        );

      if (loginCheck.enabled !== false) {
        const selectorMatched =
          loginCheck.loginInputSelector
            ? doc.querySelector(
                loginCheck.loginInputSelector
              ) !== null
            : false;

        const titleMatched =
          loginCheck.titleContains
            ? (doc.title || "").includes(
                loginCheck.titleContains
              )
            : false;

        const htmlMatched =
          loginCheck.htmlContains
            ? pageHtml.includes(
                loginCheck.htmlContains
              )
            : false;

        if (
          selectorMatched ||
          titleMatched ||
          htmlMatched
        ) {
          throw new Error(
            "ログインページが返されました。HUGへのログイン状態を確認してください"
          );
        }
      }

      const tableResult =
        extractTableFromDocument(doc);

      if (!tableResult) {
        throw new Error(
          "利用者テーブルが見つかりません"
        );
      }

      return {
        ok: true,
        html: tableResult.html,
        rowCount:
          tableResult.rowCount,
        className:
          tableResult.className,
        pageTitle: doc.title || "",
        pageUrl:
          response.url ||
          targetUrl,
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error?.message ||
          String(error),
      };
    }
  };

  return helpers.executeFunctionInWebview({
    functionText:
      webviewFunction.toString(),

    args: [
      runtimeConfig,
    ],
  });
};
',
    'commonjs',
    NULL,
    SHA2('exports.fetchAttendanceHtml = async function fetchAttendanceHtml({
  input,
  helpers,
  config,
}) {
  const facilityId = String(input?.facilityId || "");
  const dateStr = String(input?.dateStr || "");

  if (!facilityId || !dateStr) {
    throw new Error(
      "施設IDまたは日付が設定されていません"
    );
  }

  const runtimeConfig = {
    ...config,

    request: {
      ...(config?.request || {}),

      query: {
        ...(config?.request?.query || {}),
        f_id: facilityId,
        date: dateStr,
      },
    },
  };

  const webviewFunction = async (CONFIG) => {
    const request = CONFIG.request || {};
    const tableConfig = CONFIG.table || {};
    const loginCheck = CONFIG.loginCheck || {};

    const params = new URLSearchParams();

    Object.entries(request.query || {}).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null
        ) {
          params.set(key, String(value));
        }
      }
    );

    const queryString = params.toString();

    const targetUrl =
      request.url +
      (queryString
        ? (
            request.url.includes("?")
              ? "&"
              : "?"
          ) + queryString
        : "");

    const extractTableFromDocument = (doc) => {
      let table = null;

      if (tableConfig.primarySelector) {
        table = doc.querySelector(
          tableConfig.primarySelector
        );
      }

      if (
        !table &&
        tableConfig.fallbackSelector
      ) {
        table = doc.querySelector(
          tableConfig.fallbackSelector
        );
      }

      if (!table) {
        const tables =
          doc.querySelectorAll("table");

        if (tables.length > 0) {
          table = tables[0];
        }
      }

      if (!table) {
        return null;
      }

      const rows =
        table.querySelectorAll("tr");

      return {
        html: table.outerHTML,
        rowCount: rows.length,
        className:
          table.className || "",
      };
    };

    try {
      const response = await fetch(
        targetUrl,
        {
          method:
            request.method || "GET",

          credentials:
            request.credentials ||
            "include",

          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "HTTP error: " +
            response.status
        );
      }

      const pageHtml =
        await response.text();

      const doc =
        new DOMParser().parseFromString(
          pageHtml,
          "text/html"
        );

      if (loginCheck.enabled !== false) {
        const selectorMatched =
          loginCheck.loginInputSelector
            ? doc.querySelector(
                loginCheck.loginInputSelector
              ) !== null
            : false;

        const titleMatched =
          loginCheck.titleContains
            ? (doc.title || "").includes(
                loginCheck.titleContains
              )
            : false;

        const htmlMatched =
          loginCheck.htmlContains
            ? pageHtml.includes(
                loginCheck.htmlContains
              )
            : false;

        if (
          selectorMatched ||
          titleMatched ||
          htmlMatched
        ) {
          throw new Error(
            "ログインページが返されました。HUGへのログイン状態を確認してください"
          );
        }
      }

      const tableResult =
        extractTableFromDocument(doc);

      if (!tableResult) {
        throw new Error(
          "利用者テーブルが見つかりません"
        );
      }

      return {
        ok: true,
        html: tableResult.html,
        rowCount:
          tableResult.rowCount,
        className:
          tableResult.className,
        pageTitle: doc.title || "",
        pageUrl:
          response.url ||
          targetUrl,
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error?.message ||
          String(error),
      };
    }
  };

  return helpers.executeFunctionInWebview({
    functionText:
      webviewFunction.toString(),

    args: [
      runtimeConfig,
    ],
  });
};
', 256),
    1
);

INSERT INTO web_automation_files_v2 (
    flow_id,
    file_path,
    file_type,
    source_text,
    module_type,
    config_json,
    content_hash,
    is_active
) VALUES (
    @flow_id,
    'parse.js',
    'javascript',
    'const DEFAULT_CONFIG = {
  table: {
    bodySelector: "tbody",
  },

  columns: {
    childInfo: 1,
    edit: 4,
    enter: 5,
    leave: 6,
  },

  child: {
    idQueryParameter: "id",
    nameSelector: "p",
  },

  attendance: {
    timePattern: "^\\\\d{2}:\\\\d{2}$",
  },
};

function mergeConfig(config = {}) {
  return {
    table: {
      ...DEFAULT_CONFIG.table,
      ...(config.table || {}),
    },

    columns: {
      ...DEFAULT_CONFIG.columns,
      ...(config.columns || {}),
    },

    child: {
      ...DEFAULT_CONFIG.child,
      ...(config.child || {}),
    },

    attendance: {
      ...DEFAULT_CONFIG.attendance,
      ...(config.attendance || {}),
    },
  };
}

function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\\]\\\\]/g,
    "\\\\$&"
  );
}

function createTimePattern(pattern) {
  const raw = String(
    pattern ||
      DEFAULT_CONFIG.attendance.timePattern
  );

  const normalized =
    raw.replace(/\\\\\\\\d/g, "\\\\d");

  try {
    return new RegExp(normalized);
  } catch (error) {
    console.warn(
      "[ATTENDANCE][V2] timePatternが不正なため既定値を使用:",
      {
        pattern: raw,
        error,
      }
    );

    return /^\\d{2}:\\d{2}$/;
  }
}

function parseTableHTML(
  tableHTML,
  config
) {
  if (!tableHTML) {
    return {
      success: false,
      tbody: null,
      rows: null,
      error:
        "テーブルHTMLが提供されていません",
    };
  }

  try {
    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        tableHTML,
        "text/html"
      );

    const table =
      doc.querySelector("table");

    if (!table) {
      return {
        success: false,
        tbody: null,
        rows: null,
        error:
          "テーブル要素が見つかりません",
      };
    }

    const bodySelector =
      config.table.bodySelector ||
      "tbody";

    const tbody =
      table.querySelector(
        bodySelector
      );

    if (!tbody) {
      return {
        success: false,
        tbody: null,
        rows: null,
        error:
          `${bodySelector}要素が見つかりません`,
      };
    }

    return {
      success: true,
      tbody,
      rows:
        tbody.querySelectorAll("tr"),
    };
  } catch (error) {
    return {
      success: false,
      tbody: null,
      rows: null,
      error: error.message,
    };
  }
}

function extractChildrenInfo(
  cellHtml,
  config
) {
  let children_id = "";
  let children_name = "";

  if (!cellHtml) {
    return {
      children_id,
      children_name,
    };
  }

  const decodedHtml =
    cellHtml.replace(/&amp;/g, "&");

  const parameter =
    config.child.idQueryParameter ||
    "id";

  const escapedParameter =
    escapeRegExp(parameter);

  const idPattern =
    new RegExp(
      `(?:[?&]|^)${escapedParameter}=(\\\\d+)`
    );

  const idMatch =
    decodedHtml.match(idPattern);

  if (
    idMatch &&
    idMatch[1]
  ) {
    children_id =
      idMatch[1];
  } else {
    const fallbackPattern =
      new RegExp(
        `${escapedParameter}=["'']?(\\\\d+)`
      );

    const fallbackMatch =
      decodedHtml.match(
        fallbackPattern
      );

    if (
      fallbackMatch &&
      fallbackMatch[1]
    ) {
      children_id =
        fallbackMatch[1];
    }
  }

  try {
    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        `<div id="attendance-child-root">${cellHtml}</div>`,
        "text/html"
      );

    const root =
      doc.querySelector(
        "#attendance-child-root"
      );

    const nameElement =
      root?.querySelector(
        config.child.nameSelector ||
          "p"
      );

    if (nameElement) {
      children_name =
        (
          nameElement.textContent ||
          ""
        )
          .replace(/\\s+/g, " ")
          .trim();
    }
  } catch {
    const nameBoxMatch =
      cellHtml.match(
        /<p>([\\s\\S]*?)<\\/p>/
      );

    if (
      nameBoxMatch &&
      nameBoxMatch[1]
    ) {
      children_name =
        nameBoxMatch[1]
          .replace(/\\s+/g, " ")
          .trim();
    }
  }

  return {
    children_id,
    children_name,
  };
}

function extractEditInfo(
  cells,
  config
) {
  const editIndex =
    Number(
      config.columns.edit ?? 4
    );

  const editCell =
    cells[editIndex];

  const result = {
    edit_id: "",
    edit_s_id: "",
    edit_url: "",
    location_href: "",
  };

  if (!editCell) {
    return result;
  }

  const button =
    editCell.querySelector(
      ''button[onclick*="attendance.php"][onclick*="mode=edit"]''
    );

  if (!button) {
    return result;
  }

  const onclickCode =
    button.getAttribute(
      "onclick"
    ) || "";

  const hrefMatch =
    onclickCode.match(
      /location\\.href\\s*=\\s*["'']([^"'']*attendance\\.php\\?[^"'']*mode=edit[^"'']*)["'']/i
    );

  if (!hrefMatch?.[1]) {
    return result;
  }

  const decodedUrl =
    hrefMatch[1].replace(
      /&amp;/g,
      "&"
    );

  result.edit_url =
    decodedUrl;

  result.location_href =
    decodedUrl;

  try {
    const parsedUrl =
      new URL(
        decodedUrl,
        "https://www.hug-ayumu.link/hug/wm/"
      );

    result.edit_id =
      parsedUrl.searchParams.get(
        "id"
      ) || "";

    result.edit_s_id =
      parsedUrl.searchParams.get(
        "s_id"
      ) || "";
  } catch (error) {
    console.warn(
      "[ATTENDANCE][V2] 編集URL解析失敗:",
      {
        decodedUrl,
        error,
      }
    );
  }

  return result;
}

function extractTimeColumns(
  cells,
  config
) {
  const enterIndex =
    Number(
      config.columns.enter ?? 5
    );

  const leaveIndex =
    Number(
      config.columns.leave ?? 6
    );

  const column5 =
    cells[enterIndex]
      ?.textContent
      .trim() || "";

  const column5Html =
    cells[enterIndex]
      ?.innerHTML
      .trim() || "";

  let column6 = "";
  let column6Html = "";

  const timePattern =
    createTimePattern(
      config.attendance.timePattern
    );

  if (
    timePattern.test(column5) &&
    cells.length > leaveIndex
  ) {
    column6 =
      cells[leaveIndex]
        ?.textContent
        .trim() || "";

    column6Html =
      cells[leaveIndex]
        ?.innerHTML
        .trim() || "";
  }

  return {
    column5,
    column5Html,
    column6,
    column6Html,
  };
}

function processAttendanceRow(
  row,
  rowIndex,
  config
) {
  const cells =
    row.querySelectorAll(
      "td, th"
    );

  const childInfoIndex =
    Number(
      config.columns.childInfo ?? 1
    );

  const enterIndex =
    Number(
      config.columns.enter ?? 5
    );

  const minimumRequiredIndex =
    Math.max(
      childInfoIndex,
      enterIndex
    );

  if (
    cells.length <=
    minimumRequiredIndex
  ) {
    return null;
  }

  const cell1Html =
    cells[childInfoIndex]
      ?.innerHTML
      .trim() || "";

  const {
    children_id,
    children_name,
  } =
    extractChildrenInfo(
      cell1Html,
      config
    );

  const {
    edit_id,
    edit_s_id,
    edit_url,
    location_href,
  } =
    extractEditInfo(
      cells,
      config
    );

  const {
    column5,
    column5Html,
    column6,
    column6Html,
  } =
    extractTimeColumns(
      cells,
      config
    );

  const rowData = {
    rowIndex:
      rowIndex + 1,

    children_id,
    children_name,

    edit_id,
    edit_s_id,
    edit_url,
    location_href,

    column1Html:
      cell1Html,

    column5,
    column5Html,
  };

  if (
    column6 ||
    column6Html
  ) {
    rowData.column6 =
      column6;

    rowData.column6Html =
      column6Html;
  }

  return rowData;
}

exports.extractColumnData =
  async function extractColumnData(
    tableHTML,
    automationConfig = {}
  ) {
    try {
      const config =
        mergeConfig(
          automationConfig
        );

      const parseResult =
        parseTableHTML(
          tableHTML,
          config
        );

      if (
        !parseResult.success
      ) {
        return {
          success: false,
          error:
            parseResult.error,
          data: [],
        };
      }

      const extractedData = [];

      parseResult.rows.forEach(
        (row, rowIndex) => {
          const rowData =
            processAttendanceRow(
              row,
              rowIndex,
              config
            );

          if (rowData) {
            extractedData.push(
              rowData
            );
          }
        }
      );

      return {
        success: true,
        data: extractedData,
        rowCount:
          extractedData.length,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error?.message ||
          String(error),
        data: [],
      };
    }
  };
',
    'commonjs',
    NULL,
    SHA2('const DEFAULT_CONFIG = {
  table: {
    bodySelector: "tbody",
  },

  columns: {
    childInfo: 1,
    edit: 4,
    enter: 5,
    leave: 6,
  },

  child: {
    idQueryParameter: "id",
    nameSelector: "p",
  },

  attendance: {
    timePattern: "^\\\\d{2}:\\\\d{2}$",
  },
};

function mergeConfig(config = {}) {
  return {
    table: {
      ...DEFAULT_CONFIG.table,
      ...(config.table || {}),
    },

    columns: {
      ...DEFAULT_CONFIG.columns,
      ...(config.columns || {}),
    },

    child: {
      ...DEFAULT_CONFIG.child,
      ...(config.child || {}),
    },

    attendance: {
      ...DEFAULT_CONFIG.attendance,
      ...(config.attendance || {}),
    },
  };
}

function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\\]\\\\]/g,
    "\\\\$&"
  );
}

function createTimePattern(pattern) {
  const raw = String(
    pattern ||
      DEFAULT_CONFIG.attendance.timePattern
  );

  const normalized =
    raw.replace(/\\\\\\\\d/g, "\\\\d");

  try {
    return new RegExp(normalized);
  } catch (error) {
    console.warn(
      "[ATTENDANCE][V2] timePatternが不正なため既定値を使用:",
      {
        pattern: raw,
        error,
      }
    );

    return /^\\d{2}:\\d{2}$/;
  }
}

function parseTableHTML(
  tableHTML,
  config
) {
  if (!tableHTML) {
    return {
      success: false,
      tbody: null,
      rows: null,
      error:
        "テーブルHTMLが提供されていません",
    };
  }

  try {
    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        tableHTML,
        "text/html"
      );

    const table =
      doc.querySelector("table");

    if (!table) {
      return {
        success: false,
        tbody: null,
        rows: null,
        error:
          "テーブル要素が見つかりません",
      };
    }

    const bodySelector =
      config.table.bodySelector ||
      "tbody";

    const tbody =
      table.querySelector(
        bodySelector
      );

    if (!tbody) {
      return {
        success: false,
        tbody: null,
        rows: null,
        error:
          `${bodySelector}要素が見つかりません`,
      };
    }

    return {
      success: true,
      tbody,
      rows:
        tbody.querySelectorAll("tr"),
    };
  } catch (error) {
    return {
      success: false,
      tbody: null,
      rows: null,
      error: error.message,
    };
  }
}

function extractChildrenInfo(
  cellHtml,
  config
) {
  let children_id = "";
  let children_name = "";

  if (!cellHtml) {
    return {
      children_id,
      children_name,
    };
  }

  const decodedHtml =
    cellHtml.replace(/&amp;/g, "&");

  const parameter =
    config.child.idQueryParameter ||
    "id";

  const escapedParameter =
    escapeRegExp(parameter);

  const idPattern =
    new RegExp(
      `(?:[?&]|^)${escapedParameter}=(\\\\d+)`
    );

  const idMatch =
    decodedHtml.match(idPattern);

  if (
    idMatch &&
    idMatch[1]
  ) {
    children_id =
      idMatch[1];
  } else {
    const fallbackPattern =
      new RegExp(
        `${escapedParameter}=["'']?(\\\\d+)`
      );

    const fallbackMatch =
      decodedHtml.match(
        fallbackPattern
      );

    if (
      fallbackMatch &&
      fallbackMatch[1]
    ) {
      children_id =
        fallbackMatch[1];
    }
  }

  try {
    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        `<div id="attendance-child-root">${cellHtml}</div>`,
        "text/html"
      );

    const root =
      doc.querySelector(
        "#attendance-child-root"
      );

    const nameElement =
      root?.querySelector(
        config.child.nameSelector ||
          "p"
      );

    if (nameElement) {
      children_name =
        (
          nameElement.textContent ||
          ""
        )
          .replace(/\\s+/g, " ")
          .trim();
    }
  } catch {
    const nameBoxMatch =
      cellHtml.match(
        /<p>([\\s\\S]*?)<\\/p>/
      );

    if (
      nameBoxMatch &&
      nameBoxMatch[1]
    ) {
      children_name =
        nameBoxMatch[1]
          .replace(/\\s+/g, " ")
          .trim();
    }
  }

  return {
    children_id,
    children_name,
  };
}

function extractEditInfo(
  cells,
  config
) {
  const editIndex =
    Number(
      config.columns.edit ?? 4
    );

  const editCell =
    cells[editIndex];

  const result = {
    edit_id: "",
    edit_s_id: "",
    edit_url: "",
    location_href: "",
  };

  if (!editCell) {
    return result;
  }

  const button =
    editCell.querySelector(
      ''button[onclick*="attendance.php"][onclick*="mode=edit"]''
    );

  if (!button) {
    return result;
  }

  const onclickCode =
    button.getAttribute(
      "onclick"
    ) || "";

  const hrefMatch =
    onclickCode.match(
      /location\\.href\\s*=\\s*["'']([^"'']*attendance\\.php\\?[^"'']*mode=edit[^"'']*)["'']/i
    );

  if (!hrefMatch?.[1]) {
    return result;
  }

  const decodedUrl =
    hrefMatch[1].replace(
      /&amp;/g,
      "&"
    );

  result.edit_url =
    decodedUrl;

  result.location_href =
    decodedUrl;

  try {
    const parsedUrl =
      new URL(
        decodedUrl,
        "https://www.hug-ayumu.link/hug/wm/"
      );

    result.edit_id =
      parsedUrl.searchParams.get(
        "id"
      ) || "";

    result.edit_s_id =
      parsedUrl.searchParams.get(
        "s_id"
      ) || "";
  } catch (error) {
    console.warn(
      "[ATTENDANCE][V2] 編集URL解析失敗:",
      {
        decodedUrl,
        error,
      }
    );
  }

  return result;
}

function extractTimeColumns(
  cells,
  config
) {
  const enterIndex =
    Number(
      config.columns.enter ?? 5
    );

  const leaveIndex =
    Number(
      config.columns.leave ?? 6
    );

  const column5 =
    cells[enterIndex]
      ?.textContent
      .trim() || "";

  const column5Html =
    cells[enterIndex]
      ?.innerHTML
      .trim() || "";

  let column6 = "";
  let column6Html = "";

  const timePattern =
    createTimePattern(
      config.attendance.timePattern
    );

  if (
    timePattern.test(column5) &&
    cells.length > leaveIndex
  ) {
    column6 =
      cells[leaveIndex]
        ?.textContent
        .trim() || "";

    column6Html =
      cells[leaveIndex]
        ?.innerHTML
        .trim() || "";
  }

  return {
    column5,
    column5Html,
    column6,
    column6Html,
  };
}

function processAttendanceRow(
  row,
  rowIndex,
  config
) {
  const cells =
    row.querySelectorAll(
      "td, th"
    );

  const childInfoIndex =
    Number(
      config.columns.childInfo ?? 1
    );

  const enterIndex =
    Number(
      config.columns.enter ?? 5
    );

  const minimumRequiredIndex =
    Math.max(
      childInfoIndex,
      enterIndex
    );

  if (
    cells.length <=
    minimumRequiredIndex
  ) {
    return null;
  }

  const cell1Html =
    cells[childInfoIndex]
      ?.innerHTML
      .trim() || "";

  const {
    children_id,
    children_name,
  } =
    extractChildrenInfo(
      cell1Html,
      config
    );

  const {
    edit_id,
    edit_s_id,
    edit_url,
    location_href,
  } =
    extractEditInfo(
      cells,
      config
    );

  const {
    column5,
    column5Html,
    column6,
    column6Html,
  } =
    extractTimeColumns(
      cells,
      config
    );

  const rowData = {
    rowIndex:
      rowIndex + 1,

    children_id,
    children_name,

    edit_id,
    edit_s_id,
    edit_url,
    location_href,

    column1Html:
      cell1Html,

    column5,
    column5Html,
  };

  if (
    column6 ||
    column6Html
  ) {
    rowData.column6 =
      column6;

    rowData.column6Html =
      column6Html;
  }

  return rowData;
}

exports.extractColumnData =
  async function extractColumnData(
    tableHTML,
    automationConfig = {}
  ) {
    try {
      const config =
        mergeConfig(
          automationConfig
        );

      const parseResult =
        parseTableHTML(
          tableHTML,
          config
        );

      if (
        !parseResult.success
      ) {
        return {
          success: false,
          error:
            parseResult.error,
          data: [],
        };
      }

      const extractedData = [];

      parseResult.rows.forEach(
        (row, rowIndex) => {
          const rowData =
            processAttendanceRow(
              row,
              rowIndex,
              config
            );

          if (rowData) {
            extractedData.push(
              rowData
            );
          }
        }
      );

      return {
        success: true,
        data: extractedData,
        rowCount:
          extractedData.length,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error?.message ||
          String(error),
        data: [],
      };
    }
  };
', 256),
    1
);

COMMIT;

-- 確認
SELECT
    id,
    app_key,
    flow_key,
    entry_file,
    entry_export,
    engine_version,
    version,
    status,
    published_at
FROM web_automation_flows_v2
WHERE app_key = @app_key
  AND flow_key = @flow_key
ORDER BY version DESC;

SELECT
    id,
    flow_id,
    file_path,
    file_type,
    module_type,
    CHAR_LENGTH(source_text) AS source_length,
    content_hash,
    is_active
FROM web_automation_files_v2
WHERE flow_id = @flow_id
ORDER BY file_path;
