// main/parts/handlers/hug/StaffUpdateButton/fetchStaffData.js

import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache.js'

const HUG_WM_POST_URL =
  'https://www.hug-ayumu.link/hug/wm/staff_master.php'

const IBOX_SELECTOR = 'body > div.contents > div.ibox'

// 施設IDと施設名のマッピング
const FACILITY_MAP = {
  1: 'あゆむ',
  2: 'PD仁保',
  3: 'PD吉島',
  4: 'はーとけあ',
  5: 'PD五日市',
  6: 'PD光',
  7: 'PD横川',
  8: 'PD五日市駅前',
}

// デフォルトのPOSTパラメータ（施設指定なし）
const BASE_POST_PARAMS = [
  ['mode', 'search'],
  ['search', ''],

  ['j_ary[1]', '管理者'],
  ['j_ary[2]', '児童発達支援管理責任者'],
  ['j_ary[40]', 'みなし児童発達支援管理責任者'],
  ['j_ary[999]', 'OJT研修者として扱う'],
  ['j_ary[3]', '児童指導員'],
  ['j_ary[30]', '機能訓練担当職員等'],
  [
    'j_ary[19]',
    '児童指導員(児童指導員として５年以上児童福祉事業に従事)',
  ],
  ['j_ary[4]', '保育士'],
  [
    'j_ary[20]',
    '保育士(保育士として５年以上児童福祉事業に従事)',
  ],
  ['j_ary[5]', '障害福祉サービス経験者'],
  ['j_ary[6]', '指導員(その他)'],
  ['j_ary[7]', '理学療法士'],
  ['j_ary[8]', '作業療法士'],
  ['j_ary[9]', '言語聴覚士'],
  ['j_ary[37]', '心理指導担当職員等'],
  ['j_ary[10]', '看護職員'],
  ['j_ary[12]', '訪問支援員'],
  ['j_ary[13]', '公認心理師'],
  ['j_ary[14]', '臨床心理士'],
  ['j_ary[16]', '柔道整復師'],
  ['j_ary[17]', '鍼灸師'],
  ['j_ary[18]', 'あん摩マッサージ指圧師'],
  ['j_ary[15]', '嘱託医'],
  ['j_ary[38]', '栄養士'],
  ['j_ary[39]', '調理員'],
  ['j_ary[11]', 'その他'],

  ['s_enter_date', ''],
  ['e_enter_date', ''],
  ['s_termination_date', ''],
  ['e_termination_date', ''],
]

/**
 * 施設IDからf_aryパラメータを生成
 */
function getFacilityParam(facilityId) {
  if (!facilityId) {
    return null
  }

  const id = Number(facilityId)
  const facilityName = FACILITY_MAP[id]

  if (!facilityName) {
    return null
  }

  if (id < 1 || id > 8) {
    return null
  }

  return [`f_ary[${id}]`, facilityName]
}

/**
 * POSTパラメータを動的に生成
 */
function buildPostParams(facilityId) {
  const params = [...BASE_POST_PARAMS]

  const facilityParam =
    getFacilityParam(facilityId)

  if (facilityParam) {
    params.push(facilityParam)
  }

  return params
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toNumberOrNull(value) {
  const text = cleanText(value)

  if (!text) {
    return null
  }

  const number = Number(text)

  return Number.isNaN(number)
    ? null
    : number
}

/**
 * 日付をDB保存可能な形へ正規化する。
 *
 * 空文字 / 0000-00-00 はNULL。
 */
function normalizeNullableDate(value) {
  const text = cleanText(value)
    .replace(/\//g, '-')

  if (
    !text ||
    text === '0000-00-00'
  ) {
    return null
  }

  return text
}

function parseStaffId(row) {
  const onclick =
    row
      .querySelector('button[onclick]')
      ?.getAttribute('onclick') ?? ''

  const match =
    onclick.match(/[?&]id=(\d+)/)

  return match
    ? Number(match[1])
    : null
}

function parseLastUpdated(value) {
  const text =
    cleanText(value)

  const match = text.match(
    /^(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+)$/,
  )

  return {
    last_updated_at:
      match
        ? match[1].replace(/\//g, '-')
        : text,

    last_updated_by:
      match
        ? match[2]
        : '',
  }
}

function parseBelongings(value) {
  const text =
    cleanText(value)

  if (!text) {
    return []
  }

  return text
    .split(/、(?=[^、：]+：)/)
    .map(cleanText)
    .filter(Boolean)
    .map((part) => {
      const separatorIndex =
        part.indexOf('：')

      if (separatorIndex === -1) {
        return {
          facility: '',
          job: part,
          experience: '',
          notes: [],
          raw: part,
        }
      }

      const facility =
        cleanText(
          part.slice(
            0,
            separatorIndex,
          ),
        )

      let jobText =
        cleanText(
          part.slice(
            separatorIndex + 1,
          ),
        )

      const experienceMatch =
        jobText.match(
          /[（(]児童福祉事業実務経験：([^）)]+)[）)]/,
        )

      const experience =
        experienceMatch
          ? cleanText(
              experienceMatch[1],
            )
          : ''

      if (experienceMatch) {
        jobText =
          cleanText(
            jobText.replace(
              experienceMatch[0],
              '',
            ),
          )
      }

      const [
        job = '',
        ...notes
      ] = jobText
        .split('・')
        .map(cleanText)
        .filter(Boolean)

      return {
        facility,
        job,
        experience,
        notes,
        raw: part,
      }
    })
}

/**
 * HTMLから職員一覧のiboxを取得する。
 */
function parseIbox(
  html,
  config = {},
) {
  const doc =
    new DOMParser().parseFromString(
      html,
      'text/html',
    )

  const isLoginPage =
    !!doc.querySelector(
      'input[type="password"]',
    ) ||
    /ログイン/.test(
      doc.title || '',
    )

  if (isLoginPage) {
    throw new Error(
      'HUGのログインが切れています。ログイン後に再実行してください。',
    )
  }

  const selector =
    config?.containerSelector ||
    IBOX_SELECTOR

  /**
   * contents直下には複数iboxが存在する可能性があるため、
   * 職員一覧テーブルを持つiboxを優先する。
   */
  const iboxes = Array.from(
    doc.querySelectorAll(selector),
  )

  const staffIbox =
    iboxes.find((ibox) => {
      const headings =
        Array.from(
          ibox.querySelectorAll(
            'table.table thead th',
          ),
        ).map((th) =>
          cleanText(
            th.textContent,
          ),
        )

      return (
        headings.includes('指導員名') &&
        headings.includes('勤務形態') &&
        headings.includes(
          '所属施設・職種',
        ) &&
        headings.includes('表示順') &&
        headings.includes('入社日') &&
        headings.includes('退職日') &&
        headings.includes('最終更新')
      )
    }) ??
    doc.querySelector(selector)

  if (!staffIbox) {
    throw new Error(
      '職員一覧を取得できませんでした。HUGの画面状態を確認してください。',
    )
  }

  return staffIbox
}

function parseStaffRows(ibox) {
  return Array.from(
    ibox.querySelectorAll(
      'table.table tbody tr',
    ),
  )
    .map((row) => {
      const cells =
        Array.from(
          row.querySelectorAll('td'),
        )

      if (cells.length < 8) {
        return null
      }

      const belongingText =
        cleanText(
          cells[3]?.textContent,
        )

      return {
        id: parseStaffId(row),

        name:
          cleanText(
            cells[1]?.textContent,
          ),

        work_style:
          cleanText(
            cells[2]?.textContent,
          ),

        belongings:
          parseBelongings(
            belongingText,
          ),

        belonging_text:
          belongingText,

        display_order:
          toNumberOrNull(
            cells[4]?.textContent,
          ),

        enter_date:
          normalizeNullableDate(
            cells[5]?.textContent,
          ),

        termination_date:
          normalizeNullableDate(
            cells[6]?.textContent,
          ),

        ...parseLastUpdated(
          cells[7]?.textContent,
        ),
      }
    })
    .filter(
      (staff) =>
        staff &&
        (
          staff.id !== null ||
          staff.name
        ),
    )
}

/**
 * 「全部で126件のデータがあります」
 * から総件数を取得。
 */
function parseTotalCount(ibox) {
  const titles =
    Array.from(
      ibox.querySelectorAll(
        '.ibox-title h5',
      ),
    )

  for (const title of titles) {
    const text =
      cleanText(
        title.textContent,
      )

    const match =
      text.match(
        /全部で\s*(\d+)\s*件/,
      )

    if (match) {
      return Number(
        match[1],
      )
    }
  }

  return null
}

/**
 * 現在HTMLに表示されているページ番号の最大値。
 *
 * 注意:
 * HUGはページネーションを一部しか表示しないことがあるため、
 * この値だけで最終ページを決めない。
 */
function parseVisibleMaxPage(ibox) {
  const pages =
    Array.from(
      ibox.querySelectorAll(
        '.pagination a[href]',
      ),
    )
      .map((link) => {
        const href =
          link.getAttribute(
            'href',
          ) ?? ''

        const match =
          href.match(
            /[?&]page=(\d+)/,
          )

        return match
          ? Number(match[1])
          : null
      })
      .filter(
        (page) =>
          Number.isInteger(page) &&
          page > 0,
      )

  return pages.length
    ? Math.max(...pages)
    : 1
}

function uniqueById(
  staffList,
) {
  const map =
    new Map()

  for (
    const staff of staffList
  ) {
    /**
     * 職員は基本的にIDで一意。
     *
     * IDが取れない異常データだけfallback。
     */
    const key =
      staff.id !== null &&
      staff.id !== undefined
        ? `id:${staff.id}`
        : [
            'fallback',
            staff.name,
            staff.display_order,
            staff.enter_date,
            staff.termination_date,
          ].join('|')

    if (!map.has(key)) {
      map.set(
        key,
        staff,
      )
    }
  }

  return Array.from(
    map.values(),
  )
}

/**
 * HUG WebView内fetch。
 */
async function fetchInHugWebview(
  webview,
  {
    url,
    method = 'GET',
    body,
  },
) {
  const script = `
    (async () => {
      const response = await fetch(
        ${JSON.stringify(url)},
        {
          method: ${JSON.stringify(method)},
          credentials: 'include',
          cache: 'no-store',

          ${
            method === 'POST'
              ? `
                headers: {
                  'Content-Type':
                    'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: ${JSON.stringify(body)},
              `
              : ''
          }
        }
      );

      return {
        ok: response.ok,
        status: response.status,
        url: response.url,
        text: await response.text(),
      };
    })()
  `

  const response =
    await webview.executeJavaScript(
      script,
    )

  if (!response?.ok) {
    throw new Error(
      `HUG職員一覧の取得に失敗しました (HTTP ${response?.status ?? 'unknown'})`,
    )
  }

  return {
    html:
      response.text ?? '',

    responseUrl:
      response.url ?? url,
  }
}

/**
 * 指定ページをGETする。
 */
async function fetchStaffPage({
  webview,
  requestUrl,
  page,
  config,
}) {
  const paginationParameter =
    config?.pagination?.parameter ||
    'page'

  const url =
    new URL(requestUrl)

  url.searchParams.set(
    paginationParameter,
    String(page),
  )

  const {
    html,
    responseUrl,
  } =
    await fetchInHugWebview(
      webview,
      {
        url: url.toString(),
        method: 'GET',
      },
    )

  const ibox =
    parseIbox(
      html,
      config,
    )

  const rows =
    parseStaffRows(ibox)

  return {
    page,
    url:
      responseUrl ||
      url.toString(),
    ibox,
    rows,
  }
}

export async function fetchStaffData(
  onProgress,
  facilityId,
  webviewOverride = null,
  options = {},
) {
  const {
    config = {},
  } = options

  const webview =
    webviewOverride ??
    await getHugWebviewForCache()

  if (!webview) {
    throw new Error(
      'HUG WebViewを取得できませんでした。',
    )
  }

  /*
   * ==========================================
   * 1. POST条件作成
   * ==========================================
   */

  const configuredPostFields =
    config?.postFields || {}

  const configuredJobFields =
    config?.jobFields || {}

  const configuredFacilityMap =
    config?.facilityMap || {}

  let postParams

  if (
    Object.keys(
      configuredPostFields,
    ).length ||
    Object.keys(
      configuredJobFields,
    ).length
  ) {
    postParams = [
      ...Object.entries(
        configuredPostFields,
      ),

      ...Object.entries(
        configuredJobFields,
      ),
    ].map(
      ([key, value]) => [
        key,
        value ?? '',
      ],
    )

    const facilityName =
      configuredFacilityMap[
        String(facilityId)
      ] ??
      configuredFacilityMap[
        Number(facilityId)
      ] ??
      FACILITY_MAP[
        Number(facilityId)
      ]

    if (
      facilityId &&
      facilityName
    ) {
      const fieldPattern =
        config
          ?.facilityFieldPattern ||
        'f_ary[{{facilityId}}]'

      const fieldName =
        fieldPattern.replace(
          '{{facilityId}}',
          String(facilityId),
        )

      postParams.push([
        fieldName,
        facilityName,
      ])
    }
  } else {
    postParams =
      buildPostParams(
        facilityId,
      )
  }

  const body =
    new URLSearchParams(
      postParams,
    ).toString()

  const requestUrl =
    config?.request?.url ||
    HUG_WM_POST_URL

  console.log(
    '[fetchStaffData] 検索開始',
    {
      facilityId,
      requestUrl,
      postParams,
    },
  )

  /*
   * ==========================================
   * 2. 初期GET
   *
   * ログイン状態・ページ到達確認。
   * ==========================================
   */

  const initialResponse =
    await fetchInHugWebview(
      webview,
      {
        url: requestUrl,
        method: 'GET',
      },
    )

  parseIbox(
    initialResponse.html,
    config,
  )

  /*
   * ==========================================
   * 3. 検索POST
   *
   * 重要:
   * POSTレスポンスを「1ページ目」として使用しない。
   *
   * HUG側セッションへ検索条件を保持させるためだけに使う。
   * ==========================================
   */

  const searchResponse =
    await fetchInHugWebview(
      webview,
      {
        url: requestUrl,
        method: 'POST',
        body,
      },
    )

  /**
   * ログイン切れなどだけ確認。
   * 一覧データとしては使用しない。
   */
  parseIbox(
    searchResponse.html,
    config,
  )

  /*
   * ==========================================
   * 4. 必ず page=1 を明示GET
   * ==========================================
   */

  const firstPage =
    await fetchStaffPage({
      webview,
      requestUrl,
      page: 1,
      config,
    })

  const totalCount =
    parseTotalCount(
      firstPage.ibox,
    )

  const firstPageSize =
    firstPage.rows.length

  const visibleMaxPage =
    parseVisibleMaxPage(
      firstPage.ibox,
    )

  /*
   * ==========================================
   * 5. 全ページ数算出
   *
   * HTML上に1～5しか表示されていなくても、
   * 126件 / 20件 = 7ページ
   * のように総件数から補完する。
   * ==========================================
   */

  const calculatedPageCount =
    Number.isFinite(
      totalCount,
    ) &&
    totalCount > 0 &&
    firstPageSize > 0
      ? Math.ceil(
          totalCount /
            firstPageSize,
        )
      : 1

  const pageCount =
    Math.max(
      1,
      visibleMaxPage,
      calculatedPageCount,
    )

  console.log(
    '[fetchStaffData] ページ情報',
    {
      totalCount,
      firstPageSize,
      visibleMaxPage,
      calculatedPageCount,
      pageCount,
    },
  )

  /*
   * ==========================================
   * 6. page=1のデータを追加
   * ==========================================
   */

  let staff = [
    ...firstPage.rows,
  ]

  const pageDebug = [
    {
      page: 1,
      rowCount:
        firstPage.rows.length,
      url: firstPage.url,
    },
  ]

  onProgress?.(
    1,
    pageCount,
  )

  /*
   * ==========================================
   * 7. page=2 ～ 最終ページ
   * ==========================================
   */

  for (
    let page = 2;
    page <= pageCount;
    page += 1
  ) {
    const pageResult =
      await fetchStaffPage({
        webview,
        requestUrl,
        page,
        config,
      })

    staff = staff.concat(
      pageResult.rows,
    )

    pageDebug.push({
      page,
      rowCount:
        pageResult.rows.length,
      url:
        pageResult.url,
    })

    console.log(
      `[fetchStaffData] page=${page}/${pageCount}`,
      {
        pageRowCount:
          pageResult.rows.length,
        accumulated:
          staff.length,
      },
    )

    onProgress?.(
      page,
      pageCount,
    )
  }

  /*
   * ==========================================
   * 8. ID重複排除
   * ==========================================
   */

  const rawFetchedCount =
    staff.length

  staff =
    uniqueById(staff)

  /*
   * ==========================================
   * 9. 空チェック
   * ==========================================
   */

  if (
    staff.length === 0
  ) {
    throw new Error(
      '同期対象の職員データがありません。',
    )
  }

  /*
   * ==========================================
   * 10. 件数整合性チェック
   *
   * HUGが「全部で126件」と表示しているなら、
   * ID重複排除後も126件取得できなければ同期を中止。
   * ==========================================
   */

  if (
    Number.isFinite(
      totalCount,
    ) &&
    totalCount >= 0 &&
    staff.length !==
      totalCount
  ) {
    console.error(
      '[fetchStaffData] 件数不一致',
      {
        totalCount,
        rawFetchedCount,
        uniqueFetchedCount:
          staff.length,
        pageCount,
        pageDebug,
      },
    )

    throw new Error(
      [
        '職員一覧の取得件数が一致しません。',
        `HUG側=${totalCount}件`,
        `実取得=${staff.length}件`,
        `生データ=${rawFetchedCount}件`,
        `ページ数=${pageCount}`,
      ].join(' / '),
    )
  }

  console.log(
    '[fetchStaffData] 取得完了',
    {
      totalCount,
      rawFetchedCount,
      fetchedCount:
        staff.length,
      pageCount,
      pageDebug,
    },
  )

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
  }
}