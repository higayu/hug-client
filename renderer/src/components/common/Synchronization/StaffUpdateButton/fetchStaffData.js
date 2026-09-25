// main/parts/handlers/hug/StaffUpdateButton/fetchStaffData.js
import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";

const HUG_WM_POST_URL =
  "https://www.hug-ayumu.link/hug/wm/staff_master.php";
const IBOX_SELECTOR = "body > div.contents > div.ibox";

// 施設IDと施設名のマッピング
const FACILITY_MAP = {
  1: "あゆむ",
  2: "PD仁保",
  3: "PD吉島",
  4: "はーとけあ",
  5: "PD五日市",
  6: "PD光",
  7: "PD横川",
  8: "PD五日市駅前",
};

// デフォルトのPOSTパラメータ（施設指定なし）
const BASE_POST_PARAMS = [
  ["mode", "search"],
  ["search", ""],
  ["j_ary[1]", "管理者"],
  ["j_ary[2]", "児童発達支援管理責任者"],
  ["j_ary[40]", "みなし児童発達支援管理責任者"],
  ["j_ary[999]", "OJT研修者として扱う"],
  ["j_ary[3]", "児童指導員"],
  ["j_ary[30]", "機能訓練担当職員等"],
  ["j_ary[19]", "児童指導員(児童指導員として５年以上児童福祉事業に従事)"],
  ["j_ary[4]", "保育士"],
  ["j_ary[20]", "保育士(保育士として５年以上児童福祉事業に従事)"],
  ["j_ary[5]", "障害福祉サービス経験者"],
  ["j_ary[6]", "指導員(その他)"],
  ["j_ary[7]", "理学療法士"],
  ["j_ary[8]", "作業療法士"],
  ["j_ary[9]", "言語聴覚士"],
  ["j_ary[37]", "心理指導担当職員等"],
  ["j_ary[10]", "看護職員"],
  ["j_ary[12]", "訪問支援員"],
  ["j_ary[13]", "公認心理師"],
  ["j_ary[14]", "臨床心理士"],
  ["j_ary[16]", "柔道整復師"],
  ["j_ary[17]", "鍼灸師"],
  ["j_ary[18]", "あん摩マッサージ指圧師"],
  ["j_ary[15]", "嘱託医"],
  ["j_ary[38]", "栄養士"],
  ["j_ary[39]", "調理員"],
  ["j_ary[11]", "その他"],
  ["s_enter_date", ""],
  ["e_enter_date", ""],
  ["s_termination_date", ""],
  ["e_termination_date", ""],
];

/**
 * 施設IDからf_aryパラメータを生成
 */
function getFacilityParam(facilityId) {
  if (!facilityId) return null;
  
  const facilityName = FACILITY_MAP[facilityId];
  if (!facilityName) return null;
  
  // 施設IDからf_aryのインデックスを取得（1～8）
  const index = Number(facilityId);
  if (index < 1 || index > 8) return null;
  
  return [`f_ary[${index}]`, facilityName];
}

/**
 * POSTパラメータを動的に生成
 */
function buildPostParams(facilityId) {
  const params = [...BASE_POST_PARAMS];
  
  // 指定された施設のパラメータを追加
  const facilityParam = getFacilityParam(facilityId);
  if (facilityParam) {
    params.push(facilityParam);
  }
  
  return params;
}

function cleanText(value) {
  return (value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumberOrNull(value) {
  const text = cleanText(value);
  if (!text) return null;

  const number = Number(text);
  return Number.isNaN(number) ? null : number;
}

function normalizeNullableDate(value) {
  const text = cleanText(value).replace(/\//g, "-");

  if (!text || text === "0000-00-00") {
    return null;
  }

  return text;
}

function parseStaffId(row) {
  const onclick =
    row.querySelector("button[onclick]")?.getAttribute("onclick") || "";
  const match = onclick.match(/[?&]id=(\d+)/);
  return match ? Number(match[1]) : null;
}

function parseLastUpdated(value) {
  const text = cleanText(value);
  const match = text.match(
    /^(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+)$/
  );

  return {
    last_updated_at: match ? match[1] : text,
    last_updated_by: match ? match[2] : "",
  };
}

function parseBelongings(value) {
  const text = cleanText(value);
  if (!text) return [];

  return text
    .split(/、(?=[^、：]+：)/)
    .map(cleanText)
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("：");
      if (separatorIndex === -1) {
        return {
          facility: "",
          job: part,
          experience: "",
          notes: [],
          raw: part,
        };
      }

      const facility = cleanText(part.slice(0, separatorIndex));
      let jobText = cleanText(part.slice(separatorIndex + 1));
      const experienceMatch = jobText.match(
        /[（(]児童福祉事業実務経験：([^）)]+)[）)]/
      );
      const experience = experienceMatch
        ? cleanText(experienceMatch[1])
        : "";

      if (experienceMatch) {
        jobText = cleanText(jobText.replace(experienceMatch[0], ""));
      }

      const [job = "", ...notes] = jobText
        .split("・")
        .map(cleanText)
        .filter(Boolean);

      return { facility, job, experience, notes, raw: part };
    });
}

function parseIbox(html, config = {}) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ibox = doc.querySelector(config?.containerSelector || IBOX_SELECTOR);

  if (!ibox) {
    const isLoginPage =
      doc.querySelector('input[type="password"]') ||
      /ログイン/.test(doc.title || "");
    throw new Error(
      isLoginPage
        ? "HUGのログインが切れています。ログイン後に再実行してください。"
        : "職員一覧を取得できませんでした。HUGの画面状態を確認してください。"
    );
  }

  return ibox;
}

function parseStaffRows(ibox) {
  return [...ibox.querySelectorAll("table.table tbody tr")]
    .map((row) => {
      const cells = [...row.querySelectorAll("td")];
      if (cells.length < 8) return null;

      const belongingText = cleanText(cells[3]?.textContent);

      return {
        id: parseStaffId(row),
        name: cleanText(cells[1]?.textContent),
        work_style: cleanText(cells[2]?.textContent),
        belongings: parseBelongings(belongingText),
        belonging_text: belongingText,
        display_order: toNumberOrNull(cells[4]?.textContent),
        enter_date: normalizeNullableDate(cells[5]?.textContent),
        termination_date: normalizeNullableDate(cells[6]?.textContent),
        ...parseLastUpdated(cells[7]?.textContent),
      };
    })
    .filter((staff) => staff?.id !== null || staff?.name);
}

function parseTotalCount(ibox) {
  const title = cleanText(ibox.querySelector(".ibox-title h5")?.textContent);
  const match = title.match(/全部で(\d+)件/);
  return match ? Number(match[1]) : null;
}

function parseMaxPage(ibox) {
  const pages = [...ibox.querySelectorAll(".pagination a[href]")]
    .map((link) => {
      const match = (link.getAttribute("href") || "").match(
        /[?&]page=(\d+)/
      );
      return match ? Number(match[1]) : null;
    })
    .filter(Number.isInteger);

  return pages.length ? Math.max(...pages) : 1;
}

function uniqueById(staffList) {
  const map = new Map();

  for (const staff of staffList) {
    const key = staff.id ?? `${staff.name}_${staff.display_order}`;
    if (!map.has(key)) map.set(key, staff);
  }

  return [...map.values()];
}

async function fetchInHugWebview(webview, { url, method = "GET", body }) {
  const script = `
    (async () => {
      const response = await fetch(${JSON.stringify(url)}, {
        method: ${JSON.stringify(method)},
        credentials: "include",
        cache: "no-store",
        ${
          method === "POST"
            ? `headers: {
                 "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
               },
               body: ${JSON.stringify(body)},`
            : ""
        }
      });

      return {
        ok: response.ok,
        status: response.status,
        url: response.url,
        text: await response.text(),
      };
    })()
  `;

  const response = await webview.executeJavaScript(script);
  if (!response.ok) {
    throw new Error(`HUG職員一覧の取得に失敗しました (HTTP ${response.status})`);
  }

  return response.text;
}

export async function fetchStaffData(onProgress, facilityId, webviewOverride = null, options = {}) {
  const { config = {} } = options;
  const webview = webviewOverride ?? await getHugWebviewForCache();
  
  // DB設定がある場合は config_json のPOST項目を優先する。
  const configuredPostFields = config?.postFields || {};
  const configuredJobFields = config?.jobFields || {};
  const configuredFacilityMap = config?.facilityMap || {};

  let postParams;
  if (Object.keys(configuredPostFields).length || Object.keys(configuredJobFields).length) {
    postParams = [
      ...Object.entries(configuredPostFields),
      ...Object.entries(configuredJobFields),
    ].map(([key, value]) => [key, value ?? ""]);

    const facilityName =
      configuredFacilityMap[String(facilityId)] ??
      configuredFacilityMap[Number(facilityId)] ??
      FACILITY_MAP[Number(facilityId)];

    if (facilityId && facilityName) {
      const fieldPattern = config?.facilityFieldPattern || "f_ary[{{facilityId}}]";
      const fieldName = fieldPattern.replace("{{facilityId}}", String(facilityId));
      postParams.push([fieldName, facilityName]);
    }
  } else {
    postParams = buildPostParams(facilityId);
  }

  const body = new URLSearchParams(postParams).toString();
  const requestUrl = config?.request?.url || HUG_WM_POST_URL;
  
  console.log(`[fetchStaffData] 施設ID: ${facilityId}, パラメータ:`, postParams);
  
  const firstHtml = await fetchInHugWebview(webview, {
    url: requestUrl,
    method: "POST",
    body,
  });
  const firstIbox = parseIbox(firstHtml, config);
  const totalCount = parseTotalCount(firstIbox);
  const maxPage = parseMaxPage(firstIbox);
  let staff = parseStaffRows(firstIbox);

  onProgress?.(1, maxPage);

  for (let page = 2; page <= maxPage; page += 1) {
    const url = new URL(requestUrl);
    url.searchParams.set("page", String(page));
    const html = await fetchInHugWebview(webview, {
      url: url.toString(),
    });
    staff = staff.concat(parseStaffRows(parseIbox(html, config)));
    onProgress?.(page, maxPage);
  }

  staff = uniqueById(staff);
  if (staff.length === 0) {
    throw new Error("同期対象の職員データがありません。");
  }

  return {
    total_count: totalCount,
    fetched_count: staff.length,
    staff,
  };
}