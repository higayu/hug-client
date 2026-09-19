import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const WARNING_FILL = 'FEF2F2'
const WARNING_FONT = 'DC2626'

const HEADER_FILL = 'F9FAFB'
const BORDER_COLOR = 'E5E7EB'

const TEXT_COLOR = '111827'
const ATTENDANCE_COLOR = '374151'
const ADDITION_COLOR = '1D4ED8'
const RECORD_COLOR = '4338CA'
const PERSONAL_RECORD_COLOR = '047857'

function getWarningState(item) {
  const attendanceCount = Number(item.attendanceCount) || 0
  const additionCount = Number(item.additionCount) || 0
  const recordCount = Number(item.recordCount) || 0
  const personalRecordCount = Number(item.personalRecordCount) || 0

  const isAdditionWarning =
    (attendanceCount >= 2 && additionCount < 2) ||
    (attendanceCount === 1 && additionCount === 0)

  const isRecordWarning =
    (attendanceCount >= 2 && recordCount < 2) ||
    (attendanceCount === 1 && recordCount === 0)

  return {
    attendanceCount,
    additionCount,
    recordCount,
    personalRecordCount,
    isAdditionWarning,
    isRecordWarning,
    hasWarning: isAdditionWarning || isRecordWarning,
  }
}

export async function exportMonthlySummaryToExcel({
  items,
  year,
  month,
}) {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'hug-client'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('児童別月間集計')

  // -----------------------------
  // 列幅
  // -----------------------------
  worksheet.columns = [
    {
      key: 'childName',
      width: 28,
    },
    {
      key: 'attendanceCount',
      width: 14,
    },
    {
      key: 'additionCount',
      width: 16,
    },
    {
      key: 'recordCount',
      width: 20,
    },
    {
      key: 'personalRecordCount',
      width: 16,
    },
  ]

  // -----------------------------
  // タイトル
  // -----------------------------
  worksheet.mergeCells('A1:E1')

  const titleCell = worksheet.getCell('A1')

  titleCell.value =
    year && month
      ? `${year}年${month}月 児童別 月間集計`
      : '児童別 月間集計'

  titleCell.font = {
    bold: true,
    size: 16,
    color: {
      argb: TEXT_COLOR,
    },
  }

  titleCell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
  }

  worksheet.getRow(1).height = 26

  // -----------------------------
  // 説明
  // -----------------------------
  worksheet.mergeCells('A2:E2')

  const descriptionCell = worksheet.getCell('A2')

  descriptionCell.value =
    '月内に出席があった児童を基準に、出席数、専門的支援実施加算（ID=55）の登録数、専門的支援一覧数、Laravel保存済み個人記録数を集計しています。'

  descriptionCell.font = {
    size: 10,
    color: {
      argb: '6B7280',
    },
  }

  descriptionCell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
  }

  worksheet.getRow(2).height = 24

  // 1行空ける
  worksheet.addRow([])

  // -----------------------------
  // ヘッダー
  // -----------------------------
  const headerRow = worksheet.addRow([
    '氏名',
    '出席数',
    '加算登録数',
    '専門的支援一覧数',
    '個人記録数',
  ])

  headerRow.height = 24

  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: {
        argb: '4B5563',
      },
    }

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: HEADER_FILL,
      },
    }

    cell.border = {
      top: {
        style: 'thin',
        color: { argb: BORDER_COLOR },
      },
      left: {
        style: 'thin',
        color: { argb: BORDER_COLOR },
      },
      bottom: {
        style: 'thin',
        color: { argb: BORDER_COLOR },
      },
      right: {
        style: 'thin',
        color: { argb: BORDER_COLOR },
      },
    }

    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    }
  })

  headerRow.getCell(1).alignment = {
    vertical: 'middle',
    horizontal: 'left',
  }

  // -----------------------------
  // データ
  // -----------------------------
  items.forEach((item) => {
    const {
      attendanceCount,
      additionCount,
      recordCount,
      personalRecordCount,
      isAdditionWarning,
      isRecordWarning,
      hasWarning,
    } = getWarningState(item)

    const row = worksheet.addRow([
      item.childName,
      attendanceCount,
      additionCount,
      recordCount,
      personalRecordCount,
    ])

    row.height = 24

    // 行全体の背景
    if (hasWarning) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: WARNING_FILL,
          },
        }
      })
    }

    // 共通border
    row.eachCell((cell) => {
      cell.border = {
        top: {
          style: 'thin',
          color: { argb: BORDER_COLOR },
        },
        left: {
          style: 'thin',
          color: { argb: BORDER_COLOR },
        },
        bottom: {
          style: 'thin',
          color: { argb: BORDER_COLOR },
        },
        right: {
          style: 'thin',
          color: { argb: BORDER_COLOR },
        },
      }

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
    })

    // 氏名
    row.getCell(1).font = {
      bold: true,
      color: {
        argb: TEXT_COLOR,
      },
    }

    row.getCell(1).alignment = {
      vertical: 'middle',
      horizontal: 'left',
    }

    // 出席数
    row.getCell(2).font = {
      bold: true,
      color: {
        argb: ATTENDANCE_COLOR,
      },
    }

    // 加算登録数
    row.getCell(3).font = isAdditionWarning
      ? {
          bold: true,
          size: 14,
          color: {
            argb: WARNING_FONT,
          },
        }
      : {
          bold: true,
          color: {
            argb: ADDITION_COLOR,
          },
        }

    // 専門的支援一覧数
    row.getCell(4).font = isRecordWarning
      ? {
          bold: true,
          size: 14,
          color: {
            argb: WARNING_FONT,
          },
        }
      : {
          bold: true,
          color: {
            argb: RECORD_COLOR,
          },
        }

    // 個人記録数
    row.getCell(5).font = {
      bold: true,
      color: {
        argb: PERSONAL_RECORD_COLOR,
      },
    }
  })

  // -----------------------------
  // 固定表示
  // -----------------------------
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 4,
    },
  ]

  // -----------------------------
  // Excel生成
  // -----------------------------
  const buffer = await workbook.xlsx.writeBuffer()

  const blob = new Blob(
    [buffer],
    {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  )

  const filename =
    year && month
      ? `児童別月間集計_${year}-${String(month).padStart(2, '0')}.xlsx`
      : '児童別月間集計.xlsx'

  saveAs(blob, filename)
}