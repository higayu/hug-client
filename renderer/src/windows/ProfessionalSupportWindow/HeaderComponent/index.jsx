import { useMemo } from 'react'

export default function HeaderComponent({
  facilities,
  selectedFacilityId,
  selectedYear,
  selectedMonth,
  onYearMonthChange,
}) {
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const minYear = Math.min(2015, Number(selectedYear) || currentYear)
    const maxYear = Math.max(currentYear + 3, Number(selectedYear) || currentYear)

    return Array.from(
      { length: maxYear - minYear + 1 },
      (_, index) => minYear + index,
    )
  }, [selectedYear])

  const handleYearChange = (event) => {
    onYearMonthChange?.({
      year: Number(event.target.value),
      month: Number(selectedMonth),
    })
  }

  const handleMonthChange = (event) => {
    onYearMonthChange?.({
      year: Number(selectedYear),
      month: Number(event.target.value),
    })
  }

  return (
    <header className="border-b border-gray-200 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            専門的支援加算の計算
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {selectedYear}年{selectedMonth}月
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="whitespace-nowrap">年月</span>

            <select
              value={String(selectedYear)}
              onChange={handleYearChange}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>

            <select
              value={String(selectedMonth)}
              onChange={handleMonthChange}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map(
                (month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="whitespace-nowrap">施設</span>

            <select
              value={String(selectedFacilityId ?? '')}
              disabled
              className="min-w-56 cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 outline-none"
            >
              {facilities.length === 0 && (
                <option value="">施設データなし</option>
              )}

              {facilities.map((facility) => (
                <option
                  key={String(facility.id)}
                  value={String(facility.id)}
                >
                  {facility.name || `施設ID: ${facility.id}`}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  )
}
