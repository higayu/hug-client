const DEFAULT_CONFIG = {
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
    timePattern: "^\\d{2}:\\d{2}$",
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
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function createTimePattern(pattern) {
  const raw = String(
    pattern ||
      DEFAULT_CONFIG.attendance.timePattern
  );

  const normalized =
    raw.replace(/\\\\d/g, "\\d");

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

    return /^\d{2}:\d{2}$/;
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
      `(?:[?&]|^)${escapedParameter}=(\\d+)`
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
        `${escapedParameter}=["']?(\\d+)`
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
          .replace(/\s+/g, " ")
          .trim();
    }
  } catch {
    const nameBoxMatch =
      cellHtml.match(
        /<p>([\s\S]*?)<\/p>/
      );

    if (
      nameBoxMatch &&
      nameBoxMatch[1]
    ) {
      children_name =
        nameBoxMatch[1]
          .replace(/\s+/g, " ")
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
      'button[onclick*="attendance.php"][onclick*="mode=edit"]'
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
      /location\.href\s*=\s*["']([^"']*attendance\.php\?[^"']*mode=edit[^"']*)["']/i
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
