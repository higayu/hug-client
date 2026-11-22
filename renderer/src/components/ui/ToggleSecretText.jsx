// @/components/ui/ToggleSecretText.jsx
import { useState } from 'react'
import {
  Eye,
  EyeOff,
} from 'lucide-react'

/**
 * ToggleSecretText
 *
 * @param {object} props
 * @param {string} props.label ラベル表示用テキスト
 * @param {string} props.value メイン表示テキスト（秘匿対象）
 * @param {string} props.textColor テキスト色
 * @param {string} props.backgroundColor 背景色
 * @param {string} props.className 追加するTailwind CSSクラス
 * @param {object} props.style 追加するインラインスタイル
 */
export default function ToggleSecretText({
  label,
  value,
  textColor = 'inherit',
  backgroundColor = 'transparent',
  className = '',
  style = {},
}) {
  const [visible, setVisible] =
    useState(false)

  const displayValue =
    value || '（未設定）'

  return (
    <div
      className={`
        flex
        items-center
        gap-2
        rounded-md
        px-3
        py-2
        ${className}
      `}
      style={{
        color: textColor,
        backgroundColor,
        ...style,
      }}
    >
      <span className="font-semibold">
        {label}:
      </span>

      <span className="min-w-0 break-all font-mono">
        {visible
          ? displayValue
          : '••••••••'}
      </span>

      <button
        type="button"
        onClick={() => {
          setVisible(
            (currentVisible) =>
              !currentVisible,
          )
        }}
        aria-label={
          visible
            ? `${label}を非表示`
            : `${label}を表示`
        }
        aria-pressed={visible}
        className="
          ml-1
          inline-flex
          shrink-0
          items-center
          rounded
          p-1
          text-current
          opacity-70
          transition-opacity
          hover:opacity-100
          focus:outline-none
          focus:ring-2
          focus:ring-current
        "
      >
        {visible
          ? <EyeOff size={16} />
          : <Eye size={16} />}
      </button>
    </div>
  )
}