SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';

START TRANSACTION;

SET @app_key =
    CONVERT('hug-banso-navi' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_key =
    CONVERT('children_fetch' USING utf8mb4)
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
    '児童一覧取得',
    'HUG ajax_child_agreement_filter.php へPOSTして施設の本日時点の児童一覧を取得し、ふりがなからpronunciation_idを付与するV2 Flow。',
    'index.js',
    'default',
    1,
    '{"category":"sync","request":{"url":"https://www.hug-ayumu.link/hug/wm/ajax/ajax_child_agreement_filter.php","method":"POST","credentials":"include","cache":"no-store","contentType":"application/x-www-form-urlencoded; charset=UTF-8","xRequestedWith":"XMLHttpRequest"},"facilityFieldPattern":"f_ary[{{facilityId}}]","postFields":{"furigana":"0","parent_flg":"false","target_date":"{{targetDate}}"},"response":{"type":"auto","possibleChildKeys":["children","child_list","list"],"possibleParentKeys":["parent","parent_list"]},"loginDetection":{"htmlContains":["type=\\"password\\"","ログイン"]},"dateMode":"today","pagination":false}',
    '{"type":"object","required":["facilityId"],"properties":{"facilityId":{"type":["string","number"]},"targetDate":{"type":"string"}}}',
    '{"type":"object","required":["total_count","fetched_count","facility_ids","target_date","children"]}',
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
    'const {
  fetchChildrenResponse,
} = await require("./fetch");

const {
  parseChildrenResponse,
  addPronunciationId,
} = await require("./parse");

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

module.exports = async function executeChildrenFetch({
  input,
  helpers,
  config,
}) {
  const facilityId =
    input?.facilityId;

  if (
    facilityId === undefined ||
    facilityId === null ||
    String(facilityId).trim() === ""
  ) {
    throw new Error(
      "施設IDが指定されていません"
    );
  }

  // V1と同じく児童同期は実行時点の本日を対象にする。
  // targetDateが明示された場合も、通常呼び出しでは本日を渡す。
  const targetDate =
    input?.targetDate ||
    formatLocalDate(new Date());

  const raw =
    await fetchChildrenResponse({
      facilityId,
      targetDate,
      helpers,
      config,
    });

  let children =
    parseChildrenResponse(
      raw.text,
      config
    );

  children =
    addPronunciationId(
      children
    );

  const facilityIds = [
    String(facilityId),
  ];

  children = children.map(
    (child) => ({
      ...child,
      facility_id:
        facilityIds[0],
      facility_ids:
        facilityIds,
    })
  );

  if (children.length === 0) {
    throw new Error(
      "同期対象の児童データがありません。HUGのログイン状態と施設選択を確認してください。"
    );
  }

  return {
    total_count:
      children.length,

    fetched_count:
      children.length,

    facility_ids:
      facilityIds,

    target_date:
      targetDate,

    children,

    debug: {
      responseUrl:
        raw.responseUrl,
      status:
        raw.status,
      responseLength:
        raw.text?.length ?? 0,
    },
  };
};
',
    'commonjs',
    NULL,
    SHA2('const {
  fetchChildrenResponse,
} = await require("./fetch");

const {
  parseChildrenResponse,
  addPronunciationId,
} = await require("./parse");

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

module.exports = async function executeChildrenFetch({
  input,
  helpers,
  config,
}) {
  const facilityId =
    input?.facilityId;

  if (
    facilityId === undefined ||
    facilityId === null ||
    String(facilityId).trim() === ""
  ) {
    throw new Error(
      "施設IDが指定されていません"
    );
  }

  // V1と同じく児童同期は実行時点の本日を対象にする。
  // targetDateが明示された場合も、通常呼び出しでは本日を渡す。
  const targetDate =
    input?.targetDate ||
    formatLocalDate(new Date());

  const raw =
    await fetchChildrenResponse({
      facilityId,
      targetDate,
      helpers,
      config,
    });

  let children =
    parseChildrenResponse(
      raw.text,
      config
    );

  children =
    addPronunciationId(
      children
    );

  const facilityIds = [
    String(facilityId),
  ];

  children = children.map(
    (child) => ({
      ...child,
      facility_id:
        facilityIds[0],
      facility_ids:
        facilityIds,
    })
  );

  if (children.length === 0) {
    throw new Error(
      "同期対象の児童データがありません。HUGのログイン状態と施設選択を確認してください。"
    );
  }

  return {
    total_count:
      children.length,

    fetched_count:
      children.length,

    facility_ids:
      facilityIds,

    target_date:
      targetDate,

    children,

    debug: {
      responseUrl:
        raw.responseUrl,
      status:
        raw.status,
      responseLength:
        raw.text?.length ?? 0,
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
    'function buildChildPostBody({
  facilityId,
  targetDate,
  config,
}) {
  const params =
    new URLSearchParams();

  const facilityFieldPattern =
    config?.facilityFieldPattern ||
    "f_ary[{{facilityId}}]";

  const facilityField =
    facilityFieldPattern.replace(
      "{{facilityId}}",
      String(facilityId)
    );

  params.set(
    facilityField,
    String(facilityId)
  );

  const postFields =
    config?.postFields || {};

  Object.entries(
    postFields
  ).forEach(
    ([key, value]) => {
      const replaced =
        String(value ?? "")
          .replace(
            /\\{\\{targetDate\\}\\}/g,
            targetDate
          );

      params.set(
        key,
        replaced
      );
    }
  );

  if (
    !params.has("target_date")
  ) {
    params.set(
      "target_date",
      targetDate
    );
  }

  return params.toString();
}

exports.fetchChildrenResponse =
  async function fetchChildrenResponse({
    facilityId,
    targetDate,
    helpers,
    config,
  }) {
    const request =
      config?.request || {};

    const url =
      request.url ||
      "https://www.hug-ayumu.link/hug/wm/ajax/ajax_child_agreement_filter.php";

    const body =
      buildChildPostBody({
        facilityId,
        targetDate,
        config,
      });

    const functionText = `
      async function ({
        url,
        method,
        body,
        contentType,
        xRequestedWith,
      }) {
        const headers = {
          "Content-Type":
            contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        };

        if (xRequestedWith) {
          headers["X-Requested-With"] =
            xRequestedWith;
        }

        const response =
          await fetch(
            url,
            {
              method:
                method || "POST",
              credentials:
                "include",
              cache:
                "no-store",
              headers,
              body,
            }
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
            method:
              request.method ||
              "POST",
            body,
            contentType:
              request.contentType ||
              "application/x-www-form-urlencoded; charset=UTF-8",
            xRequestedWith:
              request.xRequestedWith ||
              "XMLHttpRequest",
          },
        ],
      });

    if (!response?.ok) {
      throw new Error(
        `HUG児童一覧の取得に失敗しました (HTTP ${response?.status ?? "unknown"})`
      );
    }

    return {
      text:
        response.text ?? "",
      responseUrl:
        response.url ?? url,
      status:
        response.status,
    };
  };
',
    'commonjs',
    NULL,
    SHA2('function buildChildPostBody({
  facilityId,
  targetDate,
  config,
}) {
  const params =
    new URLSearchParams();

  const facilityFieldPattern =
    config?.facilityFieldPattern ||
    "f_ary[{{facilityId}}]";

  const facilityField =
    facilityFieldPattern.replace(
      "{{facilityId}}",
      String(facilityId)
    );

  params.set(
    facilityField,
    String(facilityId)
  );

  const postFields =
    config?.postFields || {};

  Object.entries(
    postFields
  ).forEach(
    ([key, value]) => {
      const replaced =
        String(value ?? "")
          .replace(
            /\\{\\{targetDate\\}\\}/g,
            targetDate
          );

      params.set(
        key,
        replaced
      );
    }
  );

  if (
    !params.has("target_date")
  ) {
    params.set(
      "target_date",
      targetDate
    );
  }

  return params.toString();
}

exports.fetchChildrenResponse =
  async function fetchChildrenResponse({
    facilityId,
    targetDate,
    helpers,
    config,
  }) {
    const request =
      config?.request || {};

    const url =
      request.url ||
      "https://www.hug-ayumu.link/hug/wm/ajax/ajax_child_agreement_filter.php";

    const body =
      buildChildPostBody({
        facilityId,
        targetDate,
        config,
      });

    const functionText = `
      async function ({
        url,
        method,
        body,
        contentType,
        xRequestedWith,
      }) {
        const headers = {
          "Content-Type":
            contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        };

        if (xRequestedWith) {
          headers["X-Requested-With"] =
            xRequestedWith;
        }

        const response =
          await fetch(
            url,
            {
              method:
                method || "POST",
              credentials:
                "include",
              cache:
                "no-store",
              headers,
              body,
            }
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
            method:
              request.method ||
              "POST",
            body,
            contentType:
              request.contentType ||
              "application/x-www-form-urlencoded; charset=UTF-8",
            xRequestedWith:
              request.xRequestedWith ||
              "XMLHttpRequest",
          },
        ],
      });

    if (!response?.ok) {
      throw new Error(
        `HUG児童一覧の取得に失敗しました (HTTP ${response?.status ?? "unknown"})`
      );
    }

    return {
      text:
        response.text ?? "",
      responseUrl:
        response.url ?? url,
      status:
        response.status,
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
    'parse.js',
    'javascript',
    'function cleanText(value) {
  return String(value ?? "")
    .replace(/\\u00a0/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

function normalizeChild(item) {
  const id = Number(
    item?.child_id ??
    item?.id ??
    item?.c_id ??
    item?.value
  );

  const name = cleanText(
    item?.name ??
    item?.child_name ??
    item?.text ??
    ""
  );

  const furigana = cleanText(
    item?.furigana ??
    item?.["ふりがな"] ??
    item?.kana ??
    ""
  );

  return {
    id,
    name,
    furigana,
  };
}

function parseOptions(doc) {
  return Array.from(
    doc.querySelectorAll("option")
  ).map((option) => ({
    id:
      Number(option.value),
    name:
      cleanText(
        option.textContent
      ),
    furigana:
      cleanText(
        option.dataset.furigana ||
        option.dataset.kana ||
        ""
      ),
  }));
}

function validChildren(children) {
  return children.filter(
    (child) =>
      Number.isFinite(child.id) &&
      child.id > 0 &&
      !!child.name
  );
}

exports.parseChildrenResponse =
  function parseChildrenResponse(
    text,
    config
  ) {
    const trimmed =
      String(text ?? "").trim();

    if (!trimmed) {
      return [];
    }

    const loginDetection =
      config?.loginDetection || {};

    const htmlContains =
      Array.isArray(
        loginDetection.htmlContains
      )
        ? loginDetection.htmlContains
        : [
            ''type="password"'',
            "ログイン",
          ];

    if (
      htmlContains.some(
        (value) =>
          value &&
          trimmed.includes(value)
      )
    ) {
      throw new Error(
        "HUGのログインが切れています。ログイン後に再実行してください。"
      );
    }

    if (
      trimmed.startsWith("[") ||
      trimmed.startsWith("{")
    ) {
      try {
        const data =
          JSON.parse(trimmed);

        if (
          data?.error ||
          data?.status === "error"
        ) {
          throw new Error(
            data?.error ||
            data?.message ||
            "HUG児童一覧APIでエラーが返されました"
          );
        }

        const response =
          config?.response || {};

        const possibleChildKeys =
          response.possibleChildKeys ||
          [
            "children",
            "child_list",
            "list",
          ];

        let childrenList =
          Array.isArray(data)
            ? data
            : null;

        if (!childrenList) {
          for (
            const key of possibleChildKeys
          ) {
            if (
              Array.isArray(data?.[key])
            ) {
              childrenList =
                data[key];
              break;
            }
          }
        }

        if (
          Array.isArray(childrenList)
        ) {
          return validChildren(
            childrenList.map(
              normalizeChild
            )
          );
        }
      } catch (error) {
        if (
          error?.message?.includes(
            "HUG児童一覧API"
          )
        ) {
          throw error;
        }

        // JSONとして解釈できない場合は
        // HTML / option形式として続行する。
      }
    }

    const doc =
      new DOMParser()
        .parseFromString(
          trimmed,
          "text/html"
        );

    let children =
      validChildren(
        parseOptions(doc)
      );

    if (children.length > 0) {
      return children;
    }

    const wrappedDoc =
      new DOMParser()
        .parseFromString(
          `<select>${trimmed}</select>`,
          "text/html"
        );

    return validChildren(
      parseOptions(wrappedDoc)
    );
  };

const SMALL_KANA_MAP = {
  "ぁ": "あ",
  "ぃ": "い",
  "ぅ": "う",
  "ぇ": "え",
  "ぉ": "お",
  "ゃ": "や",
  "ゅ": "ゆ",
  "ょ": "よ",
  "っ": "つ",
  "ゎ": "わ",
};

function toHiragana(text) {
  return String(text ?? "")
    .replace(
      /[\\u30A1-\\u30F6]/g,
      (char) =>
        String.fromCharCode(
          char.charCodeAt(0) -
          0x60
        )
    );
}

function getCleanInitial(furigana) {
  if (
    !furigana ||
    !String(furigana).trim()
  ) {
    return "";
  }

  const normalized =
    toHiragana(
      String(furigana)
        .trim()
        .normalize("NFKC")
        .normalize("NFD")
        .replace(
          /[\\u3099\\u309A]/g,
          ""
        )
        .normalize("NFC")
    );

  const initial =
    Array.from(normalized)[0] ||
    "";

  return (
    SMALL_KANA_MAP[initial] ??
    initial
  );
}

const PRONUNCIATIONS = [
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ",
  "た", "ち", "つ", "て", "と",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ",
  "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ",
  "ら", "り", "る", "れ", "ろ",
  "わ", "を", "ん",
];

const PRONUNCIATION_MAP =
  new Map(
    PRONUNCIATIONS.map(
      (pronunciation, index) => [
        pronunciation,
        index + 1,
      ]
    )
  );

exports.addPronunciationId =
  function addPronunciationId(
    children
  ) {
    return children.map(
      (child) => {
        const initial =
          getCleanInitial(
            child.furigana || ""
          );

        return {
          ...child,
          initial,
          pronunciation_id:
            PRONUNCIATION_MAP.get(
              initial
            ) ?? null,
        };
      }
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

function normalizeChild(item) {
  const id = Number(
    item?.child_id ??
    item?.id ??
    item?.c_id ??
    item?.value
  );

  const name = cleanText(
    item?.name ??
    item?.child_name ??
    item?.text ??
    ""
  );

  const furigana = cleanText(
    item?.furigana ??
    item?.["ふりがな"] ??
    item?.kana ??
    ""
  );

  return {
    id,
    name,
    furigana,
  };
}

function parseOptions(doc) {
  return Array.from(
    doc.querySelectorAll("option")
  ).map((option) => ({
    id:
      Number(option.value),
    name:
      cleanText(
        option.textContent
      ),
    furigana:
      cleanText(
        option.dataset.furigana ||
        option.dataset.kana ||
        ""
      ),
  }));
}

function validChildren(children) {
  return children.filter(
    (child) =>
      Number.isFinite(child.id) &&
      child.id > 0 &&
      !!child.name
  );
}

exports.parseChildrenResponse =
  function parseChildrenResponse(
    text,
    config
  ) {
    const trimmed =
      String(text ?? "").trim();

    if (!trimmed) {
      return [];
    }

    const loginDetection =
      config?.loginDetection || {};

    const htmlContains =
      Array.isArray(
        loginDetection.htmlContains
      )
        ? loginDetection.htmlContains
        : [
            ''type="password"'',
            "ログイン",
          ];

    if (
      htmlContains.some(
        (value) =>
          value &&
          trimmed.includes(value)
      )
    ) {
      throw new Error(
        "HUGのログインが切れています。ログイン後に再実行してください。"
      );
    }

    if (
      trimmed.startsWith("[") ||
      trimmed.startsWith("{")
    ) {
      try {
        const data =
          JSON.parse(trimmed);

        if (
          data?.error ||
          data?.status === "error"
        ) {
          throw new Error(
            data?.error ||
            data?.message ||
            "HUG児童一覧APIでエラーが返されました"
          );
        }

        const response =
          config?.response || {};

        const possibleChildKeys =
          response.possibleChildKeys ||
          [
            "children",
            "child_list",
            "list",
          ];

        let childrenList =
          Array.isArray(data)
            ? data
            : null;

        if (!childrenList) {
          for (
            const key of possibleChildKeys
          ) {
            if (
              Array.isArray(data?.[key])
            ) {
              childrenList =
                data[key];
              break;
            }
          }
        }

        if (
          Array.isArray(childrenList)
        ) {
          return validChildren(
            childrenList.map(
              normalizeChild
            )
          );
        }
      } catch (error) {
        if (
          error?.message?.includes(
            "HUG児童一覧API"
          )
        ) {
          throw error;
        }

        // JSONとして解釈できない場合は
        // HTML / option形式として続行する。
      }
    }

    const doc =
      new DOMParser()
        .parseFromString(
          trimmed,
          "text/html"
        );

    let children =
      validChildren(
        parseOptions(doc)
      );

    if (children.length > 0) {
      return children;
    }

    const wrappedDoc =
      new DOMParser()
        .parseFromString(
          `<select>${trimmed}</select>`,
          "text/html"
        );

    return validChildren(
      parseOptions(wrappedDoc)
    );
  };

const SMALL_KANA_MAP = {
  "ぁ": "あ",
  "ぃ": "い",
  "ぅ": "う",
  "ぇ": "え",
  "ぉ": "お",
  "ゃ": "や",
  "ゅ": "ゆ",
  "ょ": "よ",
  "っ": "つ",
  "ゎ": "わ",
};

function toHiragana(text) {
  return String(text ?? "")
    .replace(
      /[\\u30A1-\\u30F6]/g,
      (char) =>
        String.fromCharCode(
          char.charCodeAt(0) -
          0x60
        )
    );
}

function getCleanInitial(furigana) {
  if (
    !furigana ||
    !String(furigana).trim()
  ) {
    return "";
  }

  const normalized =
    toHiragana(
      String(furigana)
        .trim()
        .normalize("NFKC")
        .normalize("NFD")
        .replace(
          /[\\u3099\\u309A]/g,
          ""
        )
        .normalize("NFC")
    );

  const initial =
    Array.from(normalized)[0] ||
    "";

  return (
    SMALL_KANA_MAP[initial] ??
    initial
  );
}

const PRONUNCIATIONS = [
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ",
  "た", "ち", "つ", "て", "と",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ",
  "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ",
  "ら", "り", "る", "れ", "ろ",
  "わ", "を", "ん",
];

const PRONUNCIATION_MAP =
  new Map(
    PRONUNCIATIONS.map(
      (pronunciation, index) => [
        pronunciation,
        index + 1,
      ]
    )
  );

exports.addPronunciationId =
  function addPronunciationId(
    children
  ) {
    return children.map(
      (child) => {
        const initial =
          getCleanInitial(
            child.furigana || ""
          );

        return {
          ...child,
          initial,
          pronunciation_id:
            PRONUNCIATION_MAP.get(
              initial
            ) ?? null,
        };
      }
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
    'V1 all_sync の children_fetch RuleをV2独立Flowへ移行。syncHugChildrensへ渡すためのchildren戻り値形式を維持。',
    10,
    1
),
(
    @flow_id,
    '児童同期は実行時点の本日を対象にする。JSONレスポンスとoption要素形式のHTMLレスポンスの両方を解析する。',
    20,
    1
),
(
    @flow_id,
    'ふりがなの先頭文字を正規化し、既存V1と同じ46文字のpronunciation_idを付与する。',
    30,
    1
);

COMMIT;
