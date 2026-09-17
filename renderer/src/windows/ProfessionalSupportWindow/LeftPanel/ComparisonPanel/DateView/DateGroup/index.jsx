import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import {
  formatMonthDay,
  hasProfessionalSupportAddition,
  normalizeName,
} from '../utils'

export default function DateGroup({
  date,
  children,
  recordStatusMap,
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          flex w-full items-center justify-between
          border-b border-gray-200
          bg-gray-50
          px-4 py-2
          text-left
          transition
          hover:bg-gray-100
        "
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {formatMonthDay(date)}
          </h3>

          <span className="text-xs text-gray-400">
            {children.length}名
          </span>
        </div>

        {isOpen ? (
          <ChevronUp
            size={18}
            className="text-gray-500"
          />
        ) : (
          <ChevronDown
            size={18}
            className="text-gray-500"
          />
        )}
      </button>

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-white text-left text-xs text-gray-500">
              <tr>
                <th className="w-[42%] px-4 py-2 font-medium">
                  氏名
                </th>

                <th className="w-[20%] px-4 py-2 text-center font-medium">
                  加算登録
                </th>

                <th className="w-[38%] px-4 py-2 font-medium">
                  専門的支援一覧
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {children.map((row, index) => {
                const childName = row?.child_name || '-'

                const key =
                  `${date}::${normalizeName(childName)}`

                const recordStatus =
                  recordStatusMap.get(key) || ''

                const hasAddition =
                  hasProfessionalSupportAddition(row)

                return (
                  <tr
                    key={`${date}-${row?.child_name_key || childName}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {childName}
                    </td>

                    <td className="px-4 py-2.5 text-center">
                      {hasAddition ? (
                        <span className="text-lg font-bold text-green-600">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-300">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      {recordStatus ? (
                        <span className="font-medium text-gray-700">
                          {recordStatus}
                        </span>
                      ) : (
                        <span className="text-gray-300">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}