import { useMemo, useState } from 'react'

import ExportExcelButton from './ExportExcelButton'
import MonthlySummaryRow from './MonthlySummaryRow'
import { getMonthlySummaryWarningState } from './MonthlySummaryRow/utils'

const FILTER_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'redBackground', label: '赤背景のみ' },
  { value: 'noRedBackground', label: '赤背景なし' },
  { value: 'additionWarning', label: '加算登録不足で赤' },
  { value: 'recordWarning', label: '専門的支援一覧不足で赤' },
  { value: 'bothWarnings', label: '両方不足で赤' },
]

const SORT_OPTIONS = [
  { value: 'childName', label: '氏名' },
  { value: 'attendanceCount', label: '出席数' },
  { value: 'additionCount', label: '加算登録数' },
  { value: 'recordCount', label: '専門的支援一覧数' },
  { value: 'personalRecordCount', label: '個人記録数' },
]

const normalizeSearchText = (value) =>
  String(value || '')
    .replace(/[\s　]+/g, '')
    .toLocaleLowerCase('ja-JP')

export default function MonthlySummary({
  items,
  year,
  month,
  expandedChildKey,
  onToggleChild,
  recordStatusMap,
  personalRecordStatusMap,
}) {
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortKey, setSortKey] = useState('childName')
  const [sortDirection, setSortDirection] = useState('asc')

  const sourceItems = Array.isArray(items) ? items : []

  const displayedItems = useMemo(() => {
    const keyword = normalizeSearchText(searchText)

    const filteredItems = sourceItems.filter((item) => {
      if (
        keyword &&
        !normalizeSearchText(item?.childName).includes(keyword)
      ) {
        return false
      }

      const {
        isAdditionWarning,
        isRecordWarning,
        hasWarning,
      } = getMonthlySummaryWarningState(item)

      switch (filterType) {
        case 'redBackground':
          return hasWarning
        case 'noRedBackground':
          return !hasWarning
        case 'additionWarning':
          return isAdditionWarning
        case 'recordWarning':
          return isRecordWarning
        case 'bothWarnings':
          return isAdditionWarning && isRecordWarning
        default:
          return true
      }
    })

    return [...filteredItems].sort((a, b) => {
      let result = 0

      if (sortKey === 'childName') {
        result = String(a?.childName || '').localeCompare(
          String(b?.childName || ''),
          'ja',
          {
            numeric: true,
            sensitivity: 'base',
          },
        )
      } else {
        const aValue = Number(a?.[sortKey]) || 0
        const bValue = Number(b?.[sortKey]) || 0

        result = aValue - bValue
      }

      return sortDirection === 'desc' ? -result : result
    })
  }, [sourceItems, searchText, filterType, sortKey, sortDirection])

  const resetFilters = () => {
    setSearchText('')
    setFilterType('all')
    setSortKey('childName')
    setSortDirection('asc')
  }

  const hasActiveConditions =
    searchText ||
    filterType !== 'all' ||
    sortKey !== 'childName' ||
    sortDirection !== 'asc'

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            児童別 月間集計
          </h3>

          <p className="mt-0.5 text-xs text-gray-500">
            児童の行をクリックすると、月内の日別詳細を展開して確認できます。
          </p>
        </div>

        <ExportExcelButton
          items={displayedItems}
          year={year}
          month={month}
        />
      </div>

      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[200px] flex-1 sm:max-w-xs">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              氏名で検索
            </span>

            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="児童名を入力"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="min-w-[160px]">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              絞り込み
            </span>

            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[180px]">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              並び替え
            </span>

            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[110px]">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              順序
            </span>

            <select
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveConditions}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            リセット
          </button>

          <div className="ml-auto pb-2 text-xs text-gray-500">
            {displayedItems.length} / {sourceItems.length}件表示
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-white text-left text-xs text-gray-500">
            <tr>
              <th className="w-[32%] px-4 py-2 font-medium">氏名</th>

              <th className="w-[17%] px-4 py-2 text-center font-medium">
                出席数
              </th>

              <th className="w-[17%] px-4 py-2 text-center font-medium">
                加算登録数
              </th>

              <th className="w-[17%] px-4 py-2 text-center font-medium">
                専門的支援一覧数
              </th>

              <th className="w-[17%] px-4 py-2 text-center font-medium">
                個人記録数
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {displayedItems.map((item) => (
              <MonthlySummaryRow
                key={item.childKey}
                item={item}
                expanded={expandedChildKey === item.childKey}
                onToggle={() => onToggleChild(item.childKey)}
                recordStatusMap={recordStatusMap}
                personalRecordStatusMap={personalRecordStatusMap}
              />
            ))}

            {displayedItems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  条件に一致する児童はいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
