import ExportExcelButton from './ExportExcelButton'
import MonthlySummaryRow from './MonthlySummaryRow'

export default function MonthlySummary({
  items,
  year,
  month,
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            児童別 月間集計
          </h3>

          <p className="mt-0.5 text-xs text-gray-500">
            月内に出席があった児童を基準に、出席数、
            専門的支援実施加算（ID=55）の登録数と
            各種加算・議事録管理から専門的支援実施加算の数を集計しています。
          </p>
        </div>

        <ExportExcelButton
          items={items}
          year={year}
          month={month}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-white text-left text-xs text-gray-500">
            <tr>
              <th className="w-[40%] px-4 py-2 font-medium">
                氏名
              </th>

              <th className="w-[20%] px-4 py-2 text-center font-medium">
                出席数
              </th>

              <th className="w-[20%] px-4 py-2 text-center font-medium">
                加算登録数
              </th>

              <th className="w-[20%] px-4 py-2 text-center font-medium">
                専門的支援一覧数
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <MonthlySummaryRow
                key={item.childKey}
                item={item}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}