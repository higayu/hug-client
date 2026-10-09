SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';

START TRANSACTION;

SET @app_key =
    CONVERT('hug-banso-navi' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_key =
    CONVERT('staff_fetch' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_version = 1;

DELETE FROM web_automation_flows_v2
WHERE app_key COLLATE utf8mb4_unicode_ci = @app_key
  AND flow_key COLLATE utf8mb4_unicode_ci = @flow_key
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
    '職員一覧取得',
    'HUG staff_master.php の検索条件をWebViewセッションへPOSTし、全ページを取得して職員データを抽出するV2 Flow。',
    'index.js',
    'default',
    1,
    '{"category":"sync","request":{"url":"https://www.hug-ayumu.link/hug/wm/staff_master.php","method":"POST","credentials":"include","cache":"no-store","contentType":"application/x-www-form-urlencoded; charset=UTF-8"},"facilityMap":{"1":"あゆむ","2":"PD仁保","3":"PD吉島","4":"はーとけあ","5":"PD五日市","6":"PD光","7":"PD横川","8":"PD五日市駅前"},"facilityFieldPattern":"f_ary[{{facilityId}}]","postFields":{"mode":"search","search":"","s_enter_date":"","e_enter_date":"","s_termination_date":"","e_termination_date":""},"jobFields":{"j_ary[1]":"管理者","j_ary[2]":"児童発達支援管理責任者","j_ary[40]":"みなし児童発達支援管理責任者","j_ary[999]":"OJT研修者として扱う","j_ary[3]":"児童指導員","j_ary[30]":"機能訓練担当職員等","j_ary[19]":"児童指導員(児童指導員として５年以上児童福祉事業に従事)","j_ary[4]":"保育士","j_ary[20]":"保育士(保育士として５年以上児童福祉事業に従事)","j_ary[5]":"障害福祉サービス経験者","j_ary[6]":"指導員(その他)","j_ary[7]":"理学療法士","j_ary[8]":"作業療法士","j_ary[9]":"言語聴覚士","j_ary[37]":"心理指導担当職員等","j_ary[10]":"看護職員","j_ary[12]":"訪問支援員","j_ary[13]":"公認心理師","j_ary[14]":"臨床心理士","j_ary[16]":"柔道整復師","j_ary[17]":"鍼灸師","j_ary[18]":"あん摩マッサージ指圧師","j_ary[15]":"嘱託医","j_ary[38]":"栄養士","j_ary[39]":"調理員","j_ary[11]":"その他"},"containerSelector":"body > div.contents > div.ibox","tableSelector":"table.table","rowSelector":"tbody tr","columns":{"name":1,"workStyle":2,"belongings":3,"displayOrder":4,"enterDate":5,"terminationDate":6,"lastUpdated":7},"staffId":{"selector":"button[onclick]","attribute":"onclick","pattern":"[?&]id=(\\\\d+)"},"pagination":{"selector":".pagination a[href]","parameter":"page","firstRequest":"POST","followingRequest":"GET","useSessionSearch":true},"total":{"selector":".ibox-title h5","pattern":"全部で(\\\\d+)件"},"loginDetection":{"passwordSelector":"input[type=\\"password\\"]","titleContains":"ログイン"},"deduplicateBy":"id"}',
    '{"type":"object","required":["facilityId"],"properties":{"facilityId":{"type":["string","number"]}}}',
    '{"type":"object","required":["total_count","raw_fetched_count","fetched_count","page_count","page_debug","staff"]}',
    60000,
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
    'const {
  fetchStaffPageHtml,
  initializeStaffSearchSession,
} = await require("./fetch");

const {
  parseStaffPage,
  uniqueById,
} = await require("./parse");

module.exports = async function executeStaffFetch({
  input,
  helpers,
  config,
}) {
  const facilityId = input?.facilityId;

  if (
    facilityId === undefined ||
    facilityId === null ||
    String(facilityId).trim() === ""
  ) {
    throw new Error("施設IDが指定されていません");
  }

  const requestUrl = config?.request?.url;

  if (!requestUrl) {
    throw new Error(
      "staff_fetch の request.url が設定されていません"
    );
  }

  const searchSession =
    await initializeStaffSearchSession({
      facilityId,
      helpers,
      config,
    });

  const firstPageRaw =
    await fetchStaffPageHtml({
      page: 1,
      helpers,
      config,
    });

  const firstPage =
    parseStaffPage(
      firstPageRaw.html,
      {
        page: 1,
        url:
          firstPageRaw.responseUrl ||
          requestUrl,
        config,
      }
    );

  const totalCount = firstPage.totalCount;
  const firstPageSize = firstPage.rows.length;
  const visibleMaxPage = firstPage.visibleMaxPage;

  const calculatedPageCount =
    Number.isFinite(totalCount) &&
    totalCount > 0 &&
    firstPageSize > 0
      ? Math.ceil(
          totalCount /
            firstPageSize
        )
      : 1;

  const pageCount =
    Math.max(
      1,
      visibleMaxPage,
      calculatedPageCount
    );

  let staff = [
    ...firstPage.rows,
  ];

  const pageDebug = [
    {
      page: 1,
      rowCount:
        firstPage.rows.length,
      url:
        firstPage.url,
    },
  ];

  for (
    let page = 2;
    page <= pageCount;
    page += 1
  ) {
    const raw =
      await fetchStaffPageHtml({
        page,
        helpers,
        config,
      });

    const parsed =
      parseStaffPage(
        raw.html,
        {
          page,
          url:
            raw.responseUrl ||
            requestUrl,
          config,
        }
      );

    staff = staff.concat(
      parsed.rows
    );

    pageDebug.push({
      page,
      rowCount:
        parsed.rows.length,
      url:
        parsed.url,
    });
  }

  const rawFetchedCount =
    staff.length;

  staff =
    uniqueById(staff);

  if (staff.length === 0) {
    throw new Error(
      "同期対象の職員データがありません。"
    );
  }

  if (
    Number.isFinite(totalCount) &&
    totalCount >= 0 &&
    staff.length !== totalCount
  ) {
    throw new Error(
      [
        "職員一覧の取得件数が一致しません。",
        `HUG側=${totalCount}件`,
        `実取得=${staff.length}件`,
        `生データ=${rawFetchedCount}件`,
        `ページ数=${pageCount}`,
      ].join(" / ")
    );
  }

  return {
    total_count:
      totalCount,

    raw_fetched_count:
      rawFetchedCount,

    fetched_count:
      staff.length,

    page_count:
      pageCount,

    page_debug:
      pageDebug,

    staff,

    debug: {
      searchSession,
    },
  };
};
',
    'commonjs',
    NULL,
    SHA2('const {
  fetchStaffPageHtml,
  initializeStaffSearchSession,
} = await require("./fetch");

const {
  parseStaffPage,
  uniqueById,
} = await require("./parse");

module.exports = async function executeStaffFetch({
  input,
  helpers,
  config,
}) {
  const facilityId = input?.facilityId;

  if (
    facilityId === undefined ||
    facilityId === null ||
    String(facilityId).trim() === ""
  ) {
    throw new Error("施設IDが指定されていません");
  }

  const requestUrl = config?.request?.url;

  if (!requestUrl) {
    throw new Error(
      "staff_fetch の request.url が設定されていません"
    );
  }

  const searchSession =
    await initializeStaffSearchSession({
      facilityId,
      helpers,
      config,
    });

  const firstPageRaw =
    await fetchStaffPageHtml({
      page: 1,
      helpers,
      config,
    });

  const firstPage =
    parseStaffPage(
      firstPageRaw.html,
      {
        page: 1,
        url:
          firstPageRaw.responseUrl ||
          requestUrl,
        config,
      }
    );

  const totalCount = firstPage.totalCount;
  const firstPageSize = firstPage.rows.length;
  const visibleMaxPage = firstPage.visibleMaxPage;

  const calculatedPageCount =
    Number.isFinite(totalCount) &&
    totalCount > 0 &&
    firstPageSize > 0
      ? Math.ceil(
          totalCount /
            firstPageSize
        )
      : 1;

  const pageCount =
    Math.max(
      1,
      visibleMaxPage,
      calculatedPageCount
    );

  let staff = [
    ...firstPage.rows,
  ];

  const pageDebug = [
    {
      page: 1,
      rowCount:
        firstPage.rows.length,
      url:
        firstPage.url,
    },
  ];

  for (
    let page = 2;
    page <= pageCount;
    page += 1
  ) {
    const raw =
      await fetchStaffPageHtml({
        page,
        helpers,
        config,
      });

    const parsed =
      parseStaffPage(
        raw.html,
        {
          page,
          url:
            raw.responseUrl ||
            requestUrl,
          config,
        }
      );

    staff = staff.concat(
      parsed.rows
    );

    pageDebug.push({
      page,
      rowCount:
        parsed.rows.length,
      url:
        parsed.url,
    });
  }

  const rawFetchedCount =
    staff.length;

  staff =
    uniqueById(staff);

  if (staff.length === 0) {
    throw new Error(
      "同期対象の職員データがありません。"
    );
  }

  if (
    Number.isFinite(totalCount) &&
    totalCount >= 0 &&
    staff.length !== totalCount
  ) {
    throw new Error(
      [
        "職員一覧の取得件数が一致しません。",
        `HUG側=${totalCount}件`,
        `実取得=${staff.length}件`,
        `生データ=${rawFetchedCount}件`,
        `ページ数=${pageCount}`,
      ].join(" / ")
    );
  }

  return {
    total_count:
      totalCount,

    raw_fetched_count:
      rawFetchedCount,

    fetched_count:
      staff.length,

    page_count:
      pageCount,

    page_debug:
      pageDebug,

    staff,

    debug: {
      searchSession,
    },
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
    'function buildSearchBody({
  facilityId,
  config,
}) {
  const postFields =
    config?.postFields || {};

  const jobFields =
    config?.jobFields || {};

  const facilityMap =
    config?.facilityMap || {};

  const params =
    new URLSearchParams();

  Object.entries(postFields).forEach(
    ([key, value]) => {
      params.append(
        key,
        value ?? ""
      );
    }
  );

  Object.entries(jobFields).forEach(
    ([key, value]) => {
      params.append(
        key,
        value ?? ""
      );
    }
  );

  const facilityName =
    facilityMap[String(facilityId)] ??
    facilityMap[Number(facilityId)];

  if (
    facilityId &&
    facilityName
  ) {
    const fieldPattern =
      config?.facilityFieldPattern ||
      "f_ary[{{facilityId}}]";

    const fieldName =
      fieldPattern.replace(
        "{{facilityId}}",
        String(facilityId)
      );

    params.append(
      fieldName,
      facilityName
    );
  }

  return params.toString();
}

async function fetchInHugWebview({
  helpers,
  url,
  method = "GET",
  body = null,
  config,
}) {
  const functionText = `
    async function ({
      url,
      method,
      body,
      contentType,
    }) {
      const options = {
        method,
        credentials: "include",
        cache: "no-store",
      };

      if (method === "POST") {
        options.headers = {
          "Content-Type":
            contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        };

        options.body =
          body ?? "";
      }

      const response =
        await fetch(
          url,
          options
        );

      return {
        ok:
          response.ok,
        status:
          response.status,
        url:
          response.url,
        text:
          await response.text(),
      };
    }
  `;

  const response =
    await helpers.executeFunctionInWebview({
      functionText,
      args: [
        {
          url,
          method,
          body,
          contentType:
            config
              ?.request
              ?.contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        },
      ],
    });

  if (!response?.ok) {
    throw new Error(
      `HUG職員一覧の取得に失敗しました (HTTP ${response?.status ?? "unknown"})`
    );
  }

  return {
    html:
      response.text ?? "",

    responseUrl:
      response.url ?? url,
  };
}

exports.initializeStaffSearchSession =
  async function initializeStaffSearchSession({
    facilityId,
    helpers,
    config,
  }) {
    const requestUrl =
      config?.request?.url;

    if (!requestUrl) {
      throw new Error(
        "staff_fetch の request.url が設定されていません"
      );
    }

    const initial =
      await fetchInHugWebview({
        helpers,
        url: requestUrl,
        method: "GET",
        config,
      });

    const body =
      buildSearchBody({
        facilityId,
        config,
      });

    const search =
      await fetchInHugWebview({
        helpers,
        url: requestUrl,
        method:
          config?.request?.method ||
          "POST",
        body,
        config,
      });

    return {
      initialUrl:
        initial.responseUrl,
      searchUrl:
        search.responseUrl,
      requestUrl,
    };
  };

exports.fetchStaffPageHtml =
  async function fetchStaffPageHtml({
    page,
    helpers,
    config,
  }) {
    const requestUrl =
      config?.request?.url;

    if (!requestUrl) {
      throw new Error(
        "staff_fetch の request.url が設定されていません"
      );
    }

    const parameter =
      config?.pagination?.parameter ||
      "page";

    const url =
      new URL(requestUrl);

    url.searchParams.set(
      parameter,
      String(page)
    );

    return fetchInHugWebview({
      helpers,
      url:
        url.toString(),
      method: "GET",
      config,
    });
  };
',
    'commonjs',
    NULL,
    SHA2('function buildSearchBody({
  facilityId,
  config,
}) {
  const postFields =
    config?.postFields || {};

  const jobFields =
    config?.jobFields || {};

  const facilityMap =
    config?.facilityMap || {};

  const params =
    new URLSearchParams();

  Object.entries(postFields).forEach(
    ([key, value]) => {
      params.append(
        key,
        value ?? ""
      );
    }
  );

  Object.entries(jobFields).forEach(
    ([key, value]) => {
      params.append(
        key,
        value ?? ""
      );
    }
  );

  const facilityName =
    facilityMap[String(facilityId)] ??
    facilityMap[Number(facilityId)];

  if (
    facilityId &&
    facilityName
  ) {
    const fieldPattern =
      config?.facilityFieldPattern ||
      "f_ary[{{facilityId}}]";

    const fieldName =
      fieldPattern.replace(
        "{{facilityId}}",
        String(facilityId)
      );

    params.append(
      fieldName,
      facilityName
    );
  }

  return params.toString();
}

async function fetchInHugWebview({
  helpers,
  url,
  method = "GET",
  body = null,
  config,
}) {
  const functionText = `
    async function ({
      url,
      method,
      body,
      contentType,
    }) {
      const options = {
        method,
        credentials: "include",
        cache: "no-store",
      };

      if (method === "POST") {
        options.headers = {
          "Content-Type":
            contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        };

        options.body =
          body ?? "";
      }

      const response =
        await fetch(
          url,
          options
        );

      return {
        ok:
          response.ok,
        status:
          response.status,
        url:
          response.url,
        text:
          await response.text(),
      };
    }
  `;

  const response =
    await helpers.executeFunctionInWebview({
      functionText,
      args: [
        {
          url,
          method,
          body,
          contentType:
            config
              ?.request
              ?.contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        },
      ],
    });

  if (!response?.ok) {
    throw new Error(
      `HUG職員一覧の取得に失敗しました (HTTP ${response?.status ?? "unknown"})`
    );
  }

  return {
    html:
      response.text ?? "",

    responseUrl:
      response.url ?? url,
  };
}

exports.initializeStaffSearchSession =
  async function initializeStaffSearchSession({
    facilityId,
    helpers,
    config,
  }) {
    const requestUrl =
      config?.request?.url;

    if (!requestUrl) {
      throw new Error(
        "staff_fetch の request.url が設定されていません"
      );
    }

    const initial =
      await fetchInHugWebview({
        helpers,
        url: requestUrl,
        method: "GET",
        config,
      });

    const body =
      buildSearchBody({
        facilityId,
        config,
      });

    const search =
      await fetchInHugWebview({
        helpers,
        url: requestUrl,
        method:
          config?.request?.method ||
          "POST",
        body,
        config,
      });

    return {
      initialUrl:
        initial.responseUrl,
      searchUrl:
        search.responseUrl,
      requestUrl,
    };
  };

exports.fetchStaffPageHtml =
  async function fetchStaffPageHtml({
    page,
    helpers,
    config,
  }) {
    const requestUrl =
      config?.request?.url;

    if (!requestUrl) {
      throw new Error(
        "staff_fetch の request.url が設定されていません"
      );
    }

    const parameter =
      config?.pagination?.parameter ||
      "page";

    const url =
      new URL(requestUrl);

    url.searchParams.set(
      parameter,
      String(page)
    );

    return fetchInHugWebview({
      helpers,
      url:
        url.toString(),
      method: "GET",
      config,
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
    'function cleanText(value) {
  return String(value ?? "")
    .replace(/\\u00a0/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

function toNumberOrNull(value) {
  const text =
    cleanText(value);

  if (!text) {
    return null;
  }

  const number =
    Number(text);

  return Number.isNaN(number)
    ? null
    : number;
}

function normalizeNullableDate(value) {
  const text =
    cleanText(value)
      .replace(/\\//g, "-");

  if (
    !text ||
    text === "0000-00-00"
  ) {
    return null;
  }

  return text;
}

function parseLastUpdated(value) {
  const text =
    cleanText(value);

  const match =
    text.match(
      /^(\\d{4}\\/\\d{2}\\/\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+(.+)$/
    );

  return {
    last_updated_at:
      match
        ? match[1].replace(
            /\\//g,
            "-"
          )
        : text,

    last_updated_by:
      match
        ? match[2]
        : "",
  };
}

function parseBelongings(value) {
  const text =
    cleanText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/、(?=[^、：]+：)/)
    .map(cleanText)
    .filter(Boolean)
    .map((part) => {
      const separatorIndex =
        part.indexOf("：");

      if (
        separatorIndex === -1
      ) {
        return {
          facility: "",
          job: part,
          experience: "",
          notes: [],
          raw: part,
        };
      }

      const facility =
        cleanText(
          part.slice(
            0,
            separatorIndex
          )
        );

      let jobText =
        cleanText(
          part.slice(
            separatorIndex + 1
          )
        );

      const experienceMatch =
        jobText.match(
          /[（(]児童福祉事業実務経験：([^）)]+)[）)]/
        );

      const experience =
        experienceMatch
          ? cleanText(
              experienceMatch[1]
            )
          : "";

      if (experienceMatch) {
        jobText =
          cleanText(
            jobText.replace(
              experienceMatch[0],
              ""
            )
          );
      }

      const [
        job = "",
        ...notes
      ] = jobText
        .split("・")
        .map(cleanText)
        .filter(Boolean);

      return {
        facility,
        job,
        experience,
        notes,
        raw: part,
      };
    });
}

function parseStaffId(
  row,
  config
) {
  const selector =
    config?.staffId?.selector ||
    "button[onclick]";

  const attribute =
    config?.staffId?.attribute ||
    "onclick";

  const patternText =
    config?.staffId?.pattern ||
    "[?&]id=(\\\\d+)";

  const value =
    row
      .querySelector(selector)
      ?.getAttribute(attribute) ?? "";

  const pattern =
    new RegExp(
      String(patternText)
        .replace(
          /\\\\\\\\d/g,
          "\\\\d"
        )
    );

  const match =
    value.match(pattern);

  return match
    ? Number(match[1])
    : null;
}

function findStaffContainer(
  doc,
  config
) {
  const loginDetection =
    config?.loginDetection || {};

  const passwordSelector =
    loginDetection.passwordSelector ||
    ''input[type="password"]'';

  const titleContains =
    loginDetection.titleContains ||
    "ログイン";

  const isLoginPage =
    !!doc.querySelector(
      passwordSelector
    ) ||
    String(
      doc.title || ""
    ).includes(
      titleContains
    );

  if (isLoginPage) {
    throw new Error(
      "HUGのログインが切れています。ログイン後に再実行してください。"
    );
  }

  const selector =
    config?.containerSelector ||
    "body > div.contents > div.ibox";

  const tableSelector =
    config?.tableSelector ||
    "table.table";

  const iboxes =
    Array.from(
      doc.querySelectorAll(
        selector
      )
    );

  const staffIbox =
    iboxes.find((ibox) => {
      const headings =
        Array.from(
          ibox.querySelectorAll(
            `${tableSelector} thead th`
          )
        ).map(
          (th) =>
            cleanText(
              th.textContent
            )
        );

      return (
        headings.includes("指導員名") &&
        headings.includes("勤務形態") &&
        headings.includes("所属施設・職種") &&
        headings.includes("表示順") &&
        headings.includes("入社日") &&
        headings.includes("退職日") &&
        headings.includes("最終更新")
      );
    }) ??
    doc.querySelector(selector);

  if (!staffIbox) {
    throw new Error(
      "職員一覧を取得できませんでした。HUGの画面状態を確認してください。"
    );
  }

  return staffIbox;
}

function parseStaffRows(
  container,
  config
) {
  const rowSelector =
    config?.rowSelector ||
    "tbody tr";

  const tableSelector =
    config?.tableSelector ||
    "table.table";

  const columns =
    config?.columns || {};

  const nameIndex =
    Number(columns.name ?? 1);

  const workStyleIndex =
    Number(columns.workStyle ?? 2);

  const belongingsIndex =
    Number(columns.belongings ?? 3);

  const displayOrderIndex =
    Number(columns.displayOrder ?? 4);

  const enterDateIndex =
    Number(columns.enterDate ?? 5);

  const terminationDateIndex =
    Number(columns.terminationDate ?? 6);

  const lastUpdatedIndex =
    Number(columns.lastUpdated ?? 7);

  const rows =
    Array.from(
      container.querySelectorAll(
        `${tableSelector} ${rowSelector}`
      )
    );

  return rows
    .map((row) => {
      const cells =
        Array.from(
          row.querySelectorAll("td")
        );

      const maxIndex =
        Math.max(
          nameIndex,
          workStyleIndex,
          belongingsIndex,
          displayOrderIndex,
          enterDateIndex,
          terminationDateIndex,
          lastUpdatedIndex
        );

      if (
        cells.length <=
        maxIndex
      ) {
        return null;
      }

      const belongingText =
        cleanText(
          cells[
            belongingsIndex
          ]?.textContent
        );

      return {
        id:
          parseStaffId(
            row,
            config
          ),

        name:
          cleanText(
            cells[
              nameIndex
            ]?.textContent
          ),

        work_style:
          cleanText(
            cells[
              workStyleIndex
            ]?.textContent
          ),

        belongings:
          parseBelongings(
            belongingText
          ),

        belonging_text:
          belongingText,

        display_order:
          toNumberOrNull(
            cells[
              displayOrderIndex
            ]?.textContent
          ),

        enter_date:
          normalizeNullableDate(
            cells[
              enterDateIndex
            ]?.textContent
          ),

        termination_date:
          normalizeNullableDate(
            cells[
              terminationDateIndex
            ]?.textContent
          ),

        ...parseLastUpdated(
          cells[
            lastUpdatedIndex
          ]?.textContent
        ),
      };
    })
    .filter(
      (staff) =>
        staff &&
        (
          staff.id !== null ||
          staff.name
        )
    );
}

function parseTotalCount(
  container,
  config
) {
  const selector =
    config?.total?.selector ||
    ".ibox-title h5";

  const patternText =
    config?.total?.pattern ||
    "全部で(\\\\d+)件";

  const pattern =
    new RegExp(
      String(patternText)
        .replace(
          /\\\\\\\\d/g,
          "\\\\d"
        )
    );

  const titles =
    Array.from(
      container.querySelectorAll(
        selector
      )
    );

  for (const title of titles) {
    const text =
      cleanText(
        title.textContent
      );

    const match =
      text.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function parseVisibleMaxPage(
  container,
  config
) {
  const selector =
    config?.pagination?.selector ||
    ".pagination a[href]";

  const parameter =
    config?.pagination?.parameter ||
    "page";

  const escapedParameter =
    String(parameter).replace(
      /[.*+?^${}()|[\\]\\\\]/g,
      "\\\\$&"
    );

  const pattern =
    new RegExp(
      `[?&]${escapedParameter}=(\\\\d+)`
    );

  const pages =
    Array.from(
      container.querySelectorAll(
        selector
      )
    )
      .map((link) => {
        const href =
          link.getAttribute("href") ?? "";

        const match =
          href.match(pattern);

        return match
          ? Number(match[1])
          : null;
      })
      .filter(
        (page) =>
          Number.isInteger(page) &&
          page > 0
      );

  return pages.length
    ? Math.max(...pages)
    : 1;
}

exports.parseStaffPage =
  function parseStaffPage(
    html,
    {
      page,
      url,
      config,
    }
  ) {
    const doc =
      new DOMParser()
        .parseFromString(
          html,
          "text/html"
        );

    const container =
      findStaffContainer(
        doc,
        config
      );

    return {
      page,
      url,
      rows:
        parseStaffRows(
          container,
          config
        ),
      totalCount:
        parseTotalCount(
          container,
          config
        ),
      visibleMaxPage:
        parseVisibleMaxPage(
          container,
          config
        ),
    };
  };

exports.uniqueById =
  function uniqueById(
    staffList
  ) {
    const map =
      new Map();

    for (const staff of staffList) {
      const key =
        staff.id !== null &&
        staff.id !== undefined
          ? `id:${staff.id}`
          : [
              "fallback",
              staff.name,
              staff.display_order,
              staff.enter_date,
              staff.termination_date,
            ].join("|");

      if (!map.has(key)) {
        map.set(
          key,
          staff
        );
      }
    }

    return Array.from(
      map.values()
    );
  };
',
    'commonjs',
    NULL,
    SHA2('function cleanText(value) {
  return String(value ?? "")
    .replace(/\\u00a0/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

function toNumberOrNull(value) {
  const text =
    cleanText(value);

  if (!text) {
    return null;
  }

  const number =
    Number(text);

  return Number.isNaN(number)
    ? null
    : number;
}

function normalizeNullableDate(value) {
  const text =
    cleanText(value)
      .replace(/\\//g, "-");

  if (
    !text ||
    text === "0000-00-00"
  ) {
    return null;
  }

  return text;
}

function parseLastUpdated(value) {
  const text =
    cleanText(value);

  const match =
    text.match(
      /^(\\d{4}\\/\\d{2}\\/\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+(.+)$/
    );

  return {
    last_updated_at:
      match
        ? match[1].replace(
            /\\//g,
            "-"
          )
        : text,

    last_updated_by:
      match
        ? match[2]
        : "",
  };
}

function parseBelongings(value) {
  const text =
    cleanText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/、(?=[^、：]+：)/)
    .map(cleanText)
    .filter(Boolean)
    .map((part) => {
      const separatorIndex =
        part.indexOf("：");

      if (
        separatorIndex === -1
      ) {
        return {
          facility: "",
          job: part,
          experience: "",
          notes: [],
          raw: part,
        };
      }

      const facility =
        cleanText(
          part.slice(
            0,
            separatorIndex
          )
        );

      let jobText =
        cleanText(
          part.slice(
            separatorIndex + 1
          )
        );

      const experienceMatch =
        jobText.match(
          /[（(]児童福祉事業実務経験：([^）)]+)[）)]/
        );

      const experience =
        experienceMatch
          ? cleanText(
              experienceMatch[1]
            )
          : "";

      if (experienceMatch) {
        jobText =
          cleanText(
            jobText.replace(
              experienceMatch[0],
              ""
            )
          );
      }

      const [
        job = "",
        ...notes
      ] = jobText
        .split("・")
        .map(cleanText)
        .filter(Boolean);

      return {
        facility,
        job,
        experience,
        notes,
        raw: part,
      };
    });
}

function parseStaffId(
  row,
  config
) {
  const selector =
    config?.staffId?.selector ||
    "button[onclick]";

  const attribute =
    config?.staffId?.attribute ||
    "onclick";

  const patternText =
    config?.staffId?.pattern ||
    "[?&]id=(\\\\d+)";

  const value =
    row
      .querySelector(selector)
      ?.getAttribute(attribute) ?? "";

  const pattern =
    new RegExp(
      String(patternText)
        .replace(
          /\\\\\\\\d/g,
          "\\\\d"
        )
    );

  const match =
    value.match(pattern);

  return match
    ? Number(match[1])
    : null;
}

function findStaffContainer(
  doc,
  config
) {
  const loginDetection =
    config?.loginDetection || {};

  const passwordSelector =
    loginDetection.passwordSelector ||
    ''input[type="password"]'';

  const titleContains =
    loginDetection.titleContains ||
    "ログイン";

  const isLoginPage =
    !!doc.querySelector(
      passwordSelector
    ) ||
    String(
      doc.title || ""
    ).includes(
      titleContains
    );

  if (isLoginPage) {
    throw new Error(
      "HUGのログインが切れています。ログイン後に再実行してください。"
    );
  }

  const selector =
    config?.containerSelector ||
    "body > div.contents > div.ibox";

  const tableSelector =
    config?.tableSelector ||
    "table.table";

  const iboxes =
    Array.from(
      doc.querySelectorAll(
        selector
      )
    );

  const staffIbox =
    iboxes.find((ibox) => {
      const headings =
        Array.from(
          ibox.querySelectorAll(
            `${tableSelector} thead th`
          )
        ).map(
          (th) =>
            cleanText(
              th.textContent
            )
        );

      return (
        headings.includes("指導員名") &&
        headings.includes("勤務形態") &&
        headings.includes("所属施設・職種") &&
        headings.includes("表示順") &&
        headings.includes("入社日") &&
        headings.includes("退職日") &&
        headings.includes("最終更新")
      );
    }) ??
    doc.querySelector(selector);

  if (!staffIbox) {
    throw new Error(
      "職員一覧を取得できませんでした。HUGの画面状態を確認してください。"
    );
  }

  return staffIbox;
}

function parseStaffRows(
  container,
  config
) {
  const rowSelector =
    config?.rowSelector ||
    "tbody tr";

  const tableSelector =
    config?.tableSelector ||
    "table.table";

  const columns =
    config?.columns || {};

  const nameIndex =
    Number(columns.name ?? 1);

  const workStyleIndex =
    Number(columns.workStyle ?? 2);

  const belongingsIndex =
    Number(columns.belongings ?? 3);

  const displayOrderIndex =
    Number(columns.displayOrder ?? 4);

  const enterDateIndex =
    Number(columns.enterDate ?? 5);

  const terminationDateIndex =
    Number(columns.terminationDate ?? 6);

  const lastUpdatedIndex =
    Number(columns.lastUpdated ?? 7);

  const rows =
    Array.from(
      container.querySelectorAll(
        `${tableSelector} ${rowSelector}`
      )
    );

  return rows
    .map((row) => {
      const cells =
        Array.from(
          row.querySelectorAll("td")
        );

      const maxIndex =
        Math.max(
          nameIndex,
          workStyleIndex,
          belongingsIndex,
          displayOrderIndex,
          enterDateIndex,
          terminationDateIndex,
          lastUpdatedIndex
        );

      if (
        cells.length <=
        maxIndex
      ) {
        return null;
      }

      const belongingText =
        cleanText(
          cells[
            belongingsIndex
          ]?.textContent
        );

      return {
        id:
          parseStaffId(
            row,
            config
          ),

        name:
          cleanText(
            cells[
              nameIndex
            ]?.textContent
          ),

        work_style:
          cleanText(
            cells[
              workStyleIndex
            ]?.textContent
          ),

        belongings:
          parseBelongings(
            belongingText
          ),

        belonging_text:
          belongingText,

        display_order:
          toNumberOrNull(
            cells[
              displayOrderIndex
            ]?.textContent
          ),

        enter_date:
          normalizeNullableDate(
            cells[
              enterDateIndex
            ]?.textContent
          ),

        termination_date:
          normalizeNullableDate(
            cells[
              terminationDateIndex
            ]?.textContent
          ),

        ...parseLastUpdated(
          cells[
            lastUpdatedIndex
          ]?.textContent
        ),
      };
    })
    .filter(
      (staff) =>
        staff &&
        (
          staff.id !== null ||
          staff.name
        )
    );
}

function parseTotalCount(
  container,
  config
) {
  const selector =
    config?.total?.selector ||
    ".ibox-title h5";

  const patternText =
    config?.total?.pattern ||
    "全部で(\\\\d+)件";

  const pattern =
    new RegExp(
      String(patternText)
        .replace(
          /\\\\\\\\d/g,
          "\\\\d"
        )
    );

  const titles =
    Array.from(
      container.querySelectorAll(
        selector
      )
    );

  for (const title of titles) {
    const text =
      cleanText(
        title.textContent
      );

    const match =
      text.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function parseVisibleMaxPage(
  container,
  config
) {
  const selector =
    config?.pagination?.selector ||
    ".pagination a[href]";

  const parameter =
    config?.pagination?.parameter ||
    "page";

  const escapedParameter =
    String(parameter).replace(
      /[.*+?^${}()|[\\]\\\\]/g,
      "\\\\$&"
    );

  const pattern =
    new RegExp(
      `[?&]${escapedParameter}=(\\\\d+)`
    );

  const pages =
    Array.from(
      container.querySelectorAll(
        selector
      )
    )
      .map((link) => {
        const href =
          link.getAttribute("href") ?? "";

        const match =
          href.match(pattern);

        return match
          ? Number(match[1])
          : null;
      })
      .filter(
        (page) =>
          Number.isInteger(page) &&
          page > 0
      );

  return pages.length
    ? Math.max(...pages)
    : 1;
}

exports.parseStaffPage =
  function parseStaffPage(
    html,
    {
      page,
      url,
      config,
    }
  ) {
    const doc =
      new DOMParser()
        .parseFromString(
          html,
          "text/html"
        );

    const container =
      findStaffContainer(
        doc,
        config
      );

    return {
      page,
      url,
      rows:
        parseStaffRows(
          container,
          config
        ),
      totalCount:
        parseTotalCount(
          container,
          config
        ),
      visibleMaxPage:
        parseVisibleMaxPage(
          container,
          config
        ),
    };
  };

exports.uniqueById =
  function uniqueById(
    staffList
  ) {
    const map =
      new Map();

    for (const staff of staffList) {
      const key =
        staff.id !== null &&
        staff.id !== undefined
          ? `id:${staff.id}`
          : [
              "fallback",
              staff.name,
              staff.display_order,
              staff.enter_date,
              staff.termination_date,
            ].join("|");

      if (!map.has(key)) {
        map.set(
          key,
          staff
        );
      }
    }

    return Array.from(
      map.values()
    );
  };
', 256),
    1
);

INSERT INTO web_automation_flow_memos_v2 (
    flow_id,
    memo,
    sort_order,
    is_active
) VALUES
(
    @flow_id,
    'V1 all_sync の staff_fetch RuleをV2独立Flowへ移行。syncHugStaffsへ渡す戻り値形式はV1と同一。',
    10,
    1
),
(
    @flow_id,
    '検索POSTレスポンス自体は一覧1ページ目として使用せず、HUG側セッションへ検索条件を保持した後に必ず page=1 をGETする。',
    20,
    1
),
(
    @flow_id,
    'HUG表示総件数と重複除外後の取得件数が一致しない場合は同期を中止する。',
    30,
    1
);

COMMIT;
