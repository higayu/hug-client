import ExportExcelButton from './ExportExcelButton'
import MonthlySummaryRow from './MonthlySummaryRow'

export default function MonthlySummary({
  items,
  year,
  month,
  expandedChildKey,
  onToggleChild,
  recordStatusMap,
  personalRecordStatusMap,
}) {
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

        <ExportExcelButton items={items} year={year} month={month} />
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
            {items.map((item) => (
              <MonthlySummaryRow
                key={item.childKey}
                item={item}
                expanded={expandedChildKey === item.childKey}
                onToggle={() => onToggleChild(item.childKey)}
                recordStatusMap={recordStatusMap}
                personalRecordStatusMap={personalRecordStatusMap}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
