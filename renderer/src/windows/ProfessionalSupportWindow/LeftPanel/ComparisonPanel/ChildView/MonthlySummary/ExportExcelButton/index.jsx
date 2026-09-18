import { useState } from 'react'

import { exportMonthlySummaryToExcel } from './exportMonthlySummaryToExcel'

export default function ExportExcelButton({
  items,
  year,
  month,
}) {
  const [exporting, setExporting] = useState(false)

  const handleClick = async () => {
    if (exporting) {
      return
    }

    try {
      setExporting(true)

      await exportMonthlySummaryToExcel({
        items,
        year,
        month,
      })
    } catch (error) {
      console.error(
        '[ExportExcelButton] Excel出力エラー:',
        error,
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={exporting || items.length === 0}
      className="
        shrink-0
        rounded-md
        border
        border-green-600
        bg-green-600
        px-3
        py-1.5
        text-xs
        font-semibold
        text-white
        transition
        hover:bg-green-700
        disabled:cursor-not-allowed
        disabled:border-gray-300
        disabled:bg-gray-300
      "
    >
      {exporting ? '出力中...' : 'Excel出力'}
    </button>
  )
}