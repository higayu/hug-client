import { useMemo } from 'react'

import { useAppState } from '@/AppStateContext'

const DEFAULT_OPTIONS = [
  {
    value: 0,
    label: '全件表示',
  },
  {
    value: 1,
    label: '選択施設',
  },
  {
    value: 2,
    label: '欠席を除く',
  },
  {
    value: 3,
    label: '欠席・午前を除く',
  },
  {
    value: 4,
    label: '欠席・午前・退室済みを除く',
  },
]

/**
 * GetTodayUsersChildren 共通フィルター。
 *
 * SimpleBoard など、画面側の表示ルールが異なる場合は
 * options prop で選択肢を差し替える。
 */
export default function SelectChildFilter({
  options = DEFAULT_OPTIONS,
  value,
  onChange,
}) {
  const {
    SELECT_CHILD_FILTER_MODE,
    setSelectChildFilterMode,
  } = useAppState()

  const safeOptions = useMemo(
    () => {
      if (!Array.isArray(options) || options.length <= 0) {
        return DEFAULT_OPTIONS
      }

      return options
        .map((option) => ({
          value: Number(option?.value ?? 0),
          label: String(option?.label ?? ''),
        }))
        .filter((option) => option.label)
    },
    [options],
  )

  const selectedValue = Number(
    value ?? SELECT_CHILD_FILTER_MODE ?? 0
  )

  const handleChange = (event) => {
    const nextValue = Number(event.target.value)

    if (typeof onChange === 'function') {
      onChange(nextValue)
      return
    }

    setSelectChildFilterMode(
      nextValue,
    )
  }

  return (
    <div>
      <select
        className="p-1 border border-gray-300 rounded text-sm bg-white text-black"
        value={String(selectedValue)}
        onChange={handleChange}
      >
        {safeOptions.map((option) => (
          <option
            key={option.value}
            value={String(option.value)}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
