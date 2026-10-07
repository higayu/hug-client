// renderer/src/commponents/hug_function/GetTodayUsersChildren/attendanceTable.js
// 出勤データテーブルのパース・列抽出

export {
  fetchAttendanceTableData,
  fetchAttendanceData,
} from "./fetchAttendanceTableData";

/**
 * テーブルデータをパースして構造化データとして返す
 * @param {string} tableHTML - テーブルのHTML
 * @returns {Promise<Object>} パースされたテーブルデータ
 */
export async function parseAttendanceTable(tableHTML) {
  if (!tableHTML) {
    throw new Error('テーブルHTMLが提供されていません')
  }

  try {
    // DOMパーサーを使用してテーブルを解析
    const parser = new DOMParser()
    const doc = parser.parseFromString(tableHTML, 'text/html')
    const table = doc.querySelector('table')

    if (!table) {
      throw new Error('テーブル要素が見つかりません')
    }

    const rows = table.querySelectorAll('tr')
    const data = []

    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td, th')
      const rowData = {
        index,
        cells: Array.from(cells).map(cell => ({
          text: cell.textContent.trim(),
          html: cell.innerHTML.trim()
        }))
      }
      data.push(rowData)
    })

    return {
      success: true,
      data,
      rowCount: data.length
    }
  } catch (error) {
    console.error('❌ [ATTENDANCE] テーブルパースエラー:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * テーブルHTMLをパースしてtbody要素と行を取得する
 * @param {string} tableHTML - テーブルのHTML
 * @returns {Object} {success: boolean, tbody: HTMLElement|null, rows: NodeList|null, error: string}
 */
function parseTableHTML(tableHTML) {
  if (!tableHTML) {
    return {
      success: false,
      tbody: null,
      rows: null,
      error: 'テーブルHTMLが提供されていません'
    }
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(tableHTML, 'text/html')
    const table = doc.querySelector('table')

    if (!table) {
      return {
        success: false,
        tbody: null,
        rows: null,
        error: 'テーブル要素が見つかりません'
      }
    }

    // tbodyの行を取得（theadはスキップ）
    const tbody = table.querySelector('tbody')
    if (!tbody) {
      return {
        success: false,
        tbody: null,
        rows: null,
        error: 'tbody要素が見つかりません'
      }
    }

    const rows = tbody.querySelectorAll('tr')
    return {
      success: true,
      tbody,
      rows
    }
  } catch (error) {
    return {
      success: false,
      tbody: null,
      rows: null,
      error: error.message
    }
  }
}

/**
 * セルHTMLから児童IDと児童名を抽出する
 * @param {string} cellHtml - セルのHTML文字列（2列目の児童情報）
 * @returns {Object} {children_id: string, children_name: string}
 */
function extractChildrenInfo(cellHtml) {
  let children_id = ''
  let children_name = ''

  if (!cellHtml) {
    return { children_id, children_name }
  }

  // HTMLエンティティを通常の文字に変換（&amp; -> &）
  const decodedHtml = cellHtml.replace(/&amp;/g, '&')

  // id=パラメータを抽出（?id=, &id=, または単独のid=）
  const idMatch = decodedHtml.match(/(?:[?&]|^)id=(\d+)/)
  if (idMatch && idMatch[1]) {
    children_id = idMatch[1]
  } else {
    // フォールバック: より柔軟なパターンで検索
    const idMatchFallback = decodedHtml.match(/id=["']?(\d+)/)
    if (idMatchFallback && idMatchFallback[1]) {
      children_id = idMatchFallback[1]
    }
  }

  // デバッグ用: 抽出できなかった場合にログ出力
  if (!children_id) {
    console.warn('⚠️ [ATTENDANCE] 児童ID抽出失敗:', {
      cellHtml: cellHtml.substring(0, 200), // 最初の200文字のみ表示
      decodedHtml: decodedHtml.substring(0, 200)
    })
  }

  // 児童名を抽出（nameBox内のpタグから）
  // 例: <p>大谷　瑠壱\n                                                    さん</p> から "大谷　瑠壱 さん" を抽出
  const nameBoxMatch = cellHtml.match(/<p>([\s\S]*?)<\/p>/)
  if (nameBoxMatch && nameBoxMatch[1]) {
    // 改行や余分な空白を削除
    children_name = nameBoxMatch[1].replace(/\s+/g, ' ').trim()
  }

  return { children_id, children_name }
}

/**
 * 時間列（5列目と6列目）のデータを抽出する
 * @param {NodeList} cells - 行のセル要素のリスト
 * @returns {Object} {column5: string, column5Html: string, column6: string, column6Html: string}
 */
/**
 * HUG出席行から「編集」画面へのURLを抽出する。
 *
 * HUG側では編集リンクが以下のどちらかで出力される可能性があるため、
 * href / onclick の両方を確認する。
 *
 * - <a href="attendance.php?mode=edit&id=...&s_id=...">
 * - onclick="location.href='attendance.php?mode=edit&id=...&s_id=...'"
 *
 * @param {HTMLElement} row
 * @returns {string}
 */
function extractAttendanceEditUrl(row) {
  if (!row) return ''

  const normalizeUrl = (value) =>
    String(value ?? '')
      .replace(/&amp;/g, '&')
      .trim()

  // 1. href を優先する。
  const links = Array.from(row.querySelectorAll('a[href]'))
  for (const link of links) {
    const href = normalizeUrl(link.getAttribute('href'))

    if (/attendance\.php/i.test(href) && /[?&]mode=edit(?:&|$)/i.test(href)) {
      return href
    }

    // href="javascript:location.href='attendance.php?...'" のような形式にも対応。
    const embeddedHrefMatch = href.match(
      /['"]([^'"]*attendance\.php\?[^'"]*\bmode=edit[^'"]*)['"]/i,
    )

    if (embeddedHrefMatch?.[1]) {
      return normalizeUrl(embeddedHrefMatch[1])
    }
  }

  // 2. onclick 内の location.href / window.location.href を探す。
  const onclickElements = Array.from(row.querySelectorAll('[onclick]'))
  for (const element of onclickElements) {
    const onclick = String(element.getAttribute('onclick') ?? '')

    const locationHrefMatch = onclick.match(
      /(?:window\.)?location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i,
    )

    if (locationHrefMatch?.[1]) {
      const href = normalizeUrl(locationHrefMatch[1])
      if (/attendance\.php/i.test(href) && /[?&]mode=edit(?:&|$)/i.test(href)) {
        return href
      }
    }

    // location.href を直接代入せず、関数引数等にURL文字列だけ含むケースにも対応。
    const rawUrlMatch = onclick.match(
      /['"]([^'"]*attendance\.php\?[^'"]*\bmode=edit[^'"]*)['"]/i,
    )

    if (rawUrlMatch?.[1]) {
      return normalizeUrl(rawUrlMatch[1])
    }
  }

  return ''
}

function extractTimeColumns(cells) {
  const column5 = cells[5]?.textContent.trim() || '' // 入室時間（6列目）
  const column5Html = cells[5]?.innerHTML.trim() || '' // 入室時間のHTML（ボタン情報など）

  // column5が時間形式（HH:MM）の場合、6列目（インデックス6）も取得
  let column6 = ''
  let column6Html = ''
  // 時間形式（HH:MM）のパターンをチェック（例: "00:00", "16:54"）
  const timePattern = /^\d{2}:\d{2}$/
  if (timePattern.test(column5) && cells.length >= 7) {
    column6 = cells[6]?.textContent.trim() || ''
    column6Html = cells[6]?.innerHTML.trim() || ''
  }

  return { column5, column5Html, column6, column6Html }
}

/**
 * 1行分の出勤データを処理する
 * @param {HTMLElement} row - テーブルの行要素
 * @param {number} rowIndex - 行のインデックス（0始まり）
 * @returns {Object|null} 行データオブジェクト（セルが5つ未満の場合はnull）
 */
function processAttendanceRow(row, rowIndex) {
  const cells = row.querySelectorAll('td, th')

  // 最小5つのセルが必要
  if (cells.length < 5) {
    return null
  }

  const cell1Html = cells[1]?.innerHTML.trim() || '' // 2列目のHTML（児童情報）
  const { children_id, children_name } = extractChildrenInfo(cell1Html)
  const { column5, column5Html, column6, column6Html } = extractTimeColumns(cells)
  const editUrl = extractAttendanceEditUrl(row)

  // HUG側の1行を一意に識別する record id。
  // 例: <tr class="odd children46961"> → 46961
  const rowClassName = row.className || ''
  const recordIdMatch = String(rowClassName).match(/(?:^|\s)children(\d+)(?:\s|$)/)
  const hugRecordId = recordIdMatch?.[1] || ''

  // デバッグ用。renderer側の入退室ボタンtitleから、
  // 実際にHUGのどの行を操作する予定か確認できるようにする。
  const hugRowSelector = hugRecordId
    ? `#releasetable > tr.children${hugRecordId}`
    : ''
  const hugRealnameSelector = hugRecordId
    ? `${hugRowSelector} > td.realname`
    : ''

  const rowData = {
    rowIndex: rowIndex + 1, // 1から始まる行番号
    children_id, // 児童ID
    children_name, // 児童名
    hug_record_id: hugRecordId, // HUG出席行ID (r_id)
    hug_row_class: rowClassName,
    hug_row_selector: hugRowSelector,
    hug_realname_selector: hugRealnameSelector,
    // SimpleBoard / FanContent の編集ボタンで使用するHUG編集画面URL。
    // 呼び出し側に旧snake_case / 新camelCaseの両方があるため両方保持する。
    edit_url: editUrl,
    editUrl,
    column1Html: cell1Html, // 2列目のHTML（児童情報）
    column5, // 入室時間のテキスト
    column5Html // 入室時間のHTML（ボタン情報など）
  }

  // column6が取得された場合のみ追加
  if (column6 || column6Html) {
    rowData.column6 = column6
    rowData.column6Html = column6Html
  }

  return rowData
}

/**
 * テーブルから1列目（行番号）と5列目（入室時間）を抽出
 * @param {string} tableHTML - テーブルのHTML
 * @returns {Promise<Object>} 抽出されたデータ {success: boolean, data: Array, error: string}
 */
export async function extractColumnData(tableHTML) {
  try {
    // テーブルHTMLをパース
    const parseResult = parseTableHTML(tableHTML)
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
        data: []
      }
    }

    const { rows } = parseResult
    const extractedData = []

    // 各行を処理
    rows.forEach((row, rowIndex) => {
      const rowData = processAttendanceRow(row, rowIndex)
      if (rowData) {
        extractedData.push(rowData)
      }
    })

    console.log('✅ [ATTENDANCE] 列データ抽出完了:', {
      extractedCount: extractedData.length,
      sample: extractedData
    })

    return {
      success: true,
      data: extractedData,
      rowCount: extractedData.length
    }
  } catch (error) {
    console.error('❌ [ATTENDANCE] 列データ抽出エラー:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}
