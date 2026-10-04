// renderer/src/components/common/hug_function/GetTodayUsersChildren/useAttendanceFetch/attendance/attendanceTable/index.js
// 出勤データテーブルのパース・列抽出
//
// DB駆動化後は attendance_fetch_today_users Rule の以下を参照する:
// - table.bodySelector
// - columns.childInfo / enter / leave
// - child.idQueryParameter / nameSelector
// - attendance.timePattern
//
// DB値が欠けた場合のみ、DB化前と同じ値をフォールバックとして使用する。

const DEFAULT_CONFIG = {
  table: {
    bodySelector: 'tbody'
  },
  columns: {
    childInfo: 1,
    enter: 5,
    leave: 6
  },
  child: {
    idQueryParameter: 'id',
    nameSelector: 'p'
  },
  attendance: {
    timePattern: '^\\d{2}:\\d{2}$'
  }
}

function mergeConfig(config = {}) {
  return {
    table: { ...DEFAULT_CONFIG.table, ...(config.table || {}) },
    columns: { ...DEFAULT_CONFIG.columns, ...(config.columns || {}) },
    child: { ...DEFAULT_CONFIG.child, ...(config.child || {}) },
    attendance: { ...DEFAULT_CONFIG.attendance, ...(config.attendance || {}) }
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function createTimePattern(pattern) {
  const raw = String(pattern || DEFAULT_CONFIG.attendance.timePattern)

  // SQL/JSON経由で \\d が二重エスケープされた既存データにも対応する。
  const normalized = raw.replace(/\\\\d/g, '\\d')

  try {
    return new RegExp(normalized)
  } catch (error) {
    console.warn('⚠️ [ATTENDANCE] timePatternが不正なため既定値を使用:', {
      pattern: raw,
      error
    })
    return /^\d{2}:\d{2}$/
  }
}

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

function parseTableHTML(tableHTML, config) {
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

    const bodySelector = config.table.bodySelector || 'tbody'
    const tbody = table.querySelector(bodySelector)
    if (!tbody) {
      return {
        success: false,
        tbody: null,
        rows: null,
        error: `${bodySelector}要素が見つかりません`
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

function extractChildrenInfo(cellHtml, config) {
  let children_id = ''
  let children_name = ''

  if (!cellHtml) {
    return { children_id, children_name }
  }

  const decodedHtml = cellHtml.replace(/&amp;/g, '&')
  const parameter = config.child.idQueryParameter || 'id'
  const escapedParameter = escapeRegExp(parameter)

  const idPattern = new RegExp(`(?:[?&]|^)${escapedParameter}=(\\d+)`)
  const idMatch = decodedHtml.match(idPattern)
  if (idMatch && idMatch[1]) {
    children_id = idMatch[1]
  } else {
    const fallbackPattern = new RegExp(`${escapedParameter}=["']?(\\d+)`)
    const idMatchFallback = decodedHtml.match(fallbackPattern)
    if (idMatchFallback && idMatchFallback[1]) {
      children_id = idMatchFallback[1]
    }
  }

  if (!children_id) {
    console.warn('⚠️ [ATTENDANCE] 児童ID抽出失敗:', {
      cellHtml: cellHtml.substring(0, 200),
      decodedHtml: decodedHtml.substring(0, 200),
      idQueryParameter: parameter
    })
  }

  // 元実装と同じ結果になるよう、DOMでnameSelectorを取得して空白を整形する。
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div id="attendance-child-root">${cellHtml}</div>`, 'text/html')
    const root = doc.querySelector('#attendance-child-root')
    const nameElement = root?.querySelector(config.child.nameSelector || 'p')
    if (nameElement) {
      children_name = (nameElement.textContent || '').replace(/\s+/g, ' ').trim()
    }
  } catch {
    // DOMParser失敗時だけ旧pタグ抽出へフォールバックする。
    const nameBoxMatch = cellHtml.match(/<p>([\s\S]*?)<\/p>/)
    if (nameBoxMatch && nameBoxMatch[1]) {
      children_name = nameBoxMatch[1].replace(/\s+/g, ' ').trim()
    }
  }

  return { children_id, children_name }
}

function extractTimeColumns(cells, config) {
  const enterIndex = Number(config.columns.enter ?? 5)
  const leaveIndex = Number(config.columns.leave ?? 6)

  const column5 = cells[enterIndex]?.textContent.trim() || ''
  const column5Html = cells[enterIndex]?.innerHTML.trim() || ''

  let column6 = ''
  let column6Html = ''
  const timePattern = createTimePattern(config.attendance.timePattern)

  // DB化前と同じ仕様: 入室列がHH:MMのときだけ退室列を取得する。
  if (timePattern.test(column5) && cells.length > leaveIndex) {
    column6 = cells[leaveIndex]?.textContent.trim() || ''
    column6Html = cells[leaveIndex]?.innerHTML.trim() || ''
  }

  return { column5, column5Html, column6, column6Html }
}

function processAttendanceRow(row, rowIndex, config) {
  const cells = row.querySelectorAll('td, th')
  const childInfoIndex = Number(config.columns.childInfo ?? 1)
  const enterIndex = Number(config.columns.enter ?? 5)

  // 元実装ではcells.length < 5を除外していた。
  // DB列番号が変更された場合も対象列が存在しない行は除外する。
  const minimumRequiredIndex = Math.max(childInfoIndex, enterIndex)
  if (cells.length <= minimumRequiredIndex) {
    return null
  }

  const cell1Html = cells[childInfoIndex]?.innerHTML.trim() || ''
  const { children_id, children_name } = extractChildrenInfo(cell1Html, config)
  const { column5, column5Html, column6, column6Html } = extractTimeColumns(cells, config)

  const rowData = {
    rowIndex: rowIndex + 1,
    children_id,
    children_name,
    // 下流互換のためkey名は変更しない。
    column1Html: cell1Html,
    column5,
    column5Html
  }

  if (column6 || column6Html) {
    rowData.column6 = column6
    rowData.column6Html = column6Html
  }

  return rowData
}

/**
 * DBで指定された列定義を使って利用者情報を抽出する。
 * 戻り値の構造はDB化前から変更しない。
 *
 * @param {string} tableHTML
 * @param {Object} automationConfig attendance_fetch_today_users Ruleの実行時config
 */
export async function extractColumnData(tableHTML, automationConfig = {}) {
  try {
    const config = mergeConfig(automationConfig)
    const parseResult = parseTableHTML(tableHTML, config)
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
        data: []
      }
    }

    const { rows } = parseResult
    const extractedData = []

    rows.forEach((row, rowIndex) => {
      const rowData = processAttendanceRow(row, rowIndex, config)
      if (rowData) {
        extractedData.push(rowData)
      }
    })

    console.log('✅ [ATTENDANCE][DB] 列データ抽出完了:', {
      extractedCount: extractedData.length,
      sample: extractedData,
      columns: config.columns
    })

    return {
      success: true,
      data: extractedData,
      rowCount: extractedData.length
    }
  } catch (error) {
    console.error('❌ [ATTENDANCE][DB] 列データ抽出エラー:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}
