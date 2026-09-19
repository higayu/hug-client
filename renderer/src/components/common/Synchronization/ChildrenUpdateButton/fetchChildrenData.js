// main/parts/handlers/hug/ChildrenUpdateButton/fetchChildrenData.js
import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";

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

// 施設IDからf_aryインデックスを取得（1～8）
const FACILITY_INDEX_MAP = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
};

// デフォルトの施設ID
const DEFAULT_FACILITY_ID = "3";

const HUG_WM_CHILD_AGREEMENT_FILTER_URL =
  "https://www.hug-ayumu.link/hug/wm/ajax/ajax_child_agreement_filter.php";

/**
 * 施設IDからf_aryパラメータを生成
 */
function getFacilityParam(facilityId) {
  if (!facilityId) return null;

  // 数値に変換（文字列でも対応）
  const id = Number(facilityId);
  if (isNaN(id) || id < 1 || id > 8) {
    console.warn(`[fetchChildrenData] 無効な施設ID: ${facilityId}`);
    return null;
  }

  const facilityName = FACILITY_MAP[id];
  if (!facilityName) {
    console.warn(`[fetchChildrenData] 施設ID ${id} に対応する施設名がありません`);
    return null;
  }

  const index = FACILITY_INDEX_MAP[id];
  if (!index) {
    console.warn(`[fetchChildrenData] 施設ID ${id} に対応するインデックスがありません`);
    return null;
  }

  return [`f_ary[${index}]`, String(id)];
}

/**
 * POSTパラメータを動的に生成（児童用）
 * content.js の buildPostParams を参考
 */
function buildChildPostParams(facilityId, targetDate) {
  const params = new URLSearchParams();

  // 施設IDを設定
  const id = facilityId ? String(facilityId) : DEFAULT_FACILITY_ID;
  params.set(`f_ary[${id}]`, id);

  // content.js と同じパラメータ
  params.set("furigana", "0");
  params.set("parent_flg", "false");

  // ターゲット日付（CURRENT_DAY_OF_WEEK から取得）
  params.set("target_date", targetDate);

  console.log(`[fetchChildrenData] POSTパラメータ:`, Object.fromEntries(params));

  return params;
}

function cleanText(value) {
  return (value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 児童データをパース（ajax_child_agreement_filter の応答用）
 * content.js の parseChildrenFromResponse を参考
 */
function parseChildrenFromResponse(text) {
  const trimmed = text.trim();

  // 空のレスポンスをチェック
  if (!trimmed) {
    console.warn("[fetchChildrenData] 空のレスポンスを受信しました");
    return [];
  }

  // ログインページかチェック
  if (trimmed.includes('type="password"') || trimmed.includes('ログイン')) {
    console.warn("[fetchChildrenData] ログインページが返されました。セッションが切れている可能性があります。");
    return [];
  }

  // JSON応答をチェック
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed);
      console.log("[fetchChildrenData] JSON応答:", data);

      // エラーレスポンスをチェック
      if (data.error || data.status === "error") {
        console.warn("[fetchChildrenData] APIエラー:", data.error || data.message);
        return [];
      }

      const childrenList = Array.isArray(data)
        ? data
        : data.children || data.child_list || data.list || [];

      // 親リストも取得（content.js の互換性のため）
      const parentList = Array.isArray(data)
        ? data
        : data.parent || data.parent_list || [];

      if (parentList.length > 0) {
        console.log("[fetchChildrenData] 親リスト:", parentList);
      }

      if (!Array.isArray(childrenList) || childrenList.length === 0) {
        console.warn("[fetchChildrenData] 児童データが空です");
        return [];
      }

      // JSONから児童データを抽出（furiganaも保持）
      return childrenList
        .map((item) => ({
          id: Number(item.child_id ?? item.id ?? item.c_id ?? item.value),
          name: String(item.name ?? item.child_name ?? item.text ?? "").trim(),
          furigana: String(item.furigana ?? item.ふりがな ?? item.kana ?? "").trim(),
        }))
        .filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name);
    } catch (error) {
      console.warn("[fetchChildrenData] JSONパースエラー:", error);
      // HTMLとして続行
    }
  }

  // HTML（option要素）からパース
  const parseOptions = (doc) =>
    [...doc.querySelectorAll("option")].map((opt) => ({
      id: Number(opt.value),
      name: opt.textContent.trim(),
      furigana: opt.dataset.furigana || opt.dataset.kana || "",
    }));

  try {
    const htmlDoc = new DOMParser().parseFromString(trimmed, "text/html");
    const fromHtml = parseOptions(htmlDoc);
    if (fromHtml.length > 0) {
      return fromHtml.filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name);
    }

    const wrappedDoc = new DOMParser().parseFromString(
      `<select>${trimmed}</select>`,
      "text/html"
    );
    return parseOptions(wrappedDoc).filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name);
  } catch (error) {
    console.warn("[fetchChildrenData] HTMLパースエラー:", error);
    return [];
  }
}

/**
 * 小書き文字 → 通常文字のマッピング
 */
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

/**
 * カタカナ → ひらがな 変換
 */
const toHiragana = (text) => {
  return text.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  );
};

/**
 * ふりがなから清音の頭文字を取得
 */
const getCleanInitial = (furigana) => {
  if (!furigana || furigana.trim() === "") {
    return "";
  }

  const normalized = toHiragana(
    furigana
      .trim()
      .normalize("NFKC")
      .normalize("NFD")
      .replace(/[\u3099\u309A]/g, "")
      .normalize("NFC")
  );

  const initial = Array.from(normalized)[0] || "";
  return SMALL_KANA_MAP[initial] ?? initial;
};

/**
 * 発音テーブルのモックデータ
 */
function getMockPronunciationTable() {
  return [
    { id: 1, pronunciation: "あ" },
    { id: 2, pronunciation: "い" },
    { id: 3, pronunciation: "う" },
    { id: 4, pronunciation: "え" },
    { id: 5, pronunciation: "お" },
    { id: 6, pronunciation: "か" },
    { id: 7, pronunciation: "き" },
    { id: 8, pronunciation: "く" },
    { id: 9, pronunciation: "け" },
    { id: 10, pronunciation: "こ" },
    { id: 11, pronunciation: "さ" },
    { id: 12, pronunciation: "し" },
    { id: 13, pronunciation: "す" },
    { id: 14, pronunciation: "せ" },
    { id: 15, pronunciation: "そ" },
    { id: 16, pronunciation: "た" },
    { id: 17, pronunciation: "ち" },
    { id: 18, pronunciation: "つ" },
    { id: 19, pronunciation: "て" },
    { id: 20, pronunciation: "と" },
    { id: 21, pronunciation: "な" },
    { id: 22, pronunciation: "に" },
    { id: 23, pronunciation: "ぬ" },
    { id: 24, pronunciation: "ね" },
    { id: 25, pronunciation: "の" },
    { id: 26, pronunciation: "は" },
    { id: 27, pronunciation: "ひ" },
    { id: 28, pronunciation: "ふ" },
    { id: 29, pronunciation: "へ" },
    { id: 30, pronunciation: "ほ" },
    { id: 31, pronunciation: "ま" },
    { id: 32, pronunciation: "み" },
    { id: 33, pronunciation: "む" },
    { id: 34, pronunciation: "め" },
    { id: 35, pronunciation: "も" },
    { id: 36, pronunciation: "や" },
    { id: 37, pronunciation: "ゆ" },
    { id: 38, pronunciation: "よ" },
    { id: 39, pronunciation: "ら" },
    { id: 40, pronunciation: "り" },
    { id: 41, pronunciation: "る" },
    { id: 42, pronunciation: "れ" },
    { id: 43, pronunciation: "ろ" },
    { id: 44, pronunciation: "わ" },
    { id: 45, pronunciation: "を" },
    { id: 46, pronunciation: "ん" },
  ];
}

/**
 * 児童一覧に pronunciation_id を付与する
 */
function addPronunciationId(children, pronunciationTable) {
  if (!Array.isArray(children) || children.length === 0) {
    return [];
  }

  if (!Array.isArray(pronunciationTable) || pronunciationTable.length === 0) {
    return children.map((child) => ({
      ...child,
      initial: getCleanInitial(child.furigana || ""),
      pronunciation_id: null,
    }));
  }

  const pronunciationMap = new Map(
    pronunciationTable.map((item) => [item.pronunciation, item.id])
  );

  return children.map((child) => {
    const furigana = child.furigana || "";
    const initial = getCleanInitial(furigana);
    const pronunciationId = pronunciationMap.get(initial) ?? null;

    return {
      ...child,
      initial,
      pronunciation_id: pronunciationId,
    };
  });
}

async function fetchInHugWebview(webview, { url, method = "GET", body, headers = {} }) {
  const script = `
    (async () => {
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        ${Object.entries(headers)
          .map(([key, value]) => `"${key}": ${JSON.stringify(value)}`)
          .join(", ")}
      };

      const response = await fetch(${JSON.stringify(url)}, {
        method: ${JSON.stringify(method)},
        credentials: "include",
        cache: "no-store",
        headers: headers,
        ${method === "POST" ? `body: ${JSON.stringify(body)},` : ""}
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

  console.log(`[fetchInHugWebview] ステータス: ${response.status}, OK: ${response.ok}`);
  console.log(`[fetchInHugWebview] レスポンス先頭200文字:`, response.text?.slice(0, 200));

  if (!response.ok) {
    throw new Error(`HUG児童一覧の取得に失敗しました (HTTP ${response.status})`);
  }

  return response.text;
}

export async function fetchChildrenData(onProgress, facilityId, currentDayOfWeek, webviewOverride = null) {
  console.log(`[fetchChildrenData] 開始 - facilityId: ${facilityId} (${typeof facilityId})`);
  console.log(`[fetchChildrenData] currentDayOfWeek:`, currentDayOfWeek);

  const webview = webviewOverride ?? await getHugWebviewForCache();

  // currentDayOfWeek から日付文字列を生成（YYYY-MM-DD 形式）
  let targetDate;
  if (currentDayOfWeek) {
    // currentDayOfWeek が Date オブジェクトの場合
    if (currentDayOfWeek instanceof Date) {
      const year = currentDayOfWeek.getFullYear();
      const month = String(currentDayOfWeek.getMonth() + 1).padStart(2, '0');
      const day = String(currentDayOfWeek.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${day}`;
    } 
    // 文字列の場合（YYYY-MM-DD 形式と想定）
    else if (typeof currentDayOfWeek === 'string') {
      targetDate = currentDayOfWeek;
    }
    // その他の場合（数値など）
    else {
      const date = new Date(currentDayOfWeek);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        targetDate = `${year}-${month}-${day}`;
      } else {
        // フォールバック：本日
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        targetDate = `${year}-${month}-${day}`;
        console.warn(`[fetchChildrenData] 無効な日付のため本日を使用: ${targetDate}`);
      }
    }
  } else {
    // フォールバック：本日
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    targetDate = `${year}-${month}-${day}`;
    console.warn(`[fetchChildrenData] currentDayOfWeek が未定義のため本日を使用: ${targetDate}`);
  }

  console.log(`[fetchChildrenData] targetDate: ${targetDate}`);

  // 施設IDに基づいてPOSTパラメータを動的に生成
  const body = buildChildPostParams(facilityId, targetDate);

  try {
    // 児童データを取得（ajax_child_agreement_filter）
    const responseText = await fetchInHugWebview(webview, {
      url: HUG_WM_CHILD_AGREEMENT_FILTER_URL,
      method: "POST",
      body: body.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    console.log(`[fetchChildrenData] レスポンス長: ${responseText.length}文字`);

    // レスポンスをパース
    const children = parseChildrenFromResponse(responseText);
    console.log(`[fetchChildrenData] パース結果: ${children.length}件`, children.slice(0, 3));

    // 発音テーブルを取得（モック）
    const pronunciationTable = getMockPronunciationTable();

    // 児童データに発音IDを付与
    const childrenWithPronunciation = addPronunciationId(children, pronunciationTable);

    // 施設IDを各児童に付与
    const facilityIds = facilityId ? [String(facilityId)] : [DEFAULT_FACILITY_ID];
    const childrenWithFacility = childrenWithPronunciation.map((child) => ({
      ...child,
      facility_id: facilityIds.length > 0 ? facilityIds[0] : DEFAULT_FACILITY_ID,
      facility_ids: facilityIds,
    }));

    // ページネーション対応（ajax_child_agreement_filter は一度に全件取得の想定）
    const totalCount = childrenWithFacility.length;
    const maxPage = 1;

    onProgress?.(1, maxPage);

    if (childrenWithFacility.length === 0) {
      console.error("[fetchChildrenData] 児童データが0件です。レスポンスの内容:", responseText.slice(0, 500));
      throw new Error("同期対象の児童データがありません。HUGのログイン状態と施設選択を確認してください。");
    }

    return {
      total_count: totalCount,
      fetched_count: childrenWithFacility.length,
      facility_ids: facilityIds,
      target_date: targetDate,
      children: childrenWithFacility,
    };
  } catch (error) {
    console.error("[fetchChildrenData] エラー:", error);
    throw error;
  }
}