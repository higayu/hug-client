import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import ToggleSecretText from '@/components/ui/ToggleSecretText'
import CopyButton from '@/components/ui/CopyButton'

export default function AccountInfoPanel({
  title,
  items,
  font = 'text-sm',
  backColor = '#ffffff',
  isOpen = false,
}) {
  const [open, setOpen] =
    useState(isOpen)

  return (
    <div
      className="
        w-full
        rounded-lg
        border
        border-gray-200
        text-left
        text-xs
        text-black
      "
      style={{
        backgroundColor:
          backColor,
      }}
    >
      <button
        type="button"
        onClick={() => {
          setOpen(
            (currentOpen) =>
              !currentOpen,
          )
        }}
        className="
          flex
          w-full
          items-center
          justify-between
          rounded-t-lg
          px-2
          py-1
          font-semibold
          text-black
          hover:bg-gray-100
        "
        style={{
          backgroundColor:
            backColor,
        }}
        aria-expanded={open}
      >
        <span className={font}>
          {title}
        </span>

        {open
          ? <ChevronUp size={14} />
          : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="space-y-1 px-2 pb-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >
              <ToggleSecretText
                label={item.label}
                value={item.value}
                textColor="#000000"
                backgroundColor="#ffffff"
                className="min-w-0 flex-1"
              />

              <CopyButton
                text={item.value}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-2xl
                  bg-white
                  px-3
                  py-2
                  text-sm
                  shadow-sm
                  hover:bg-gray-100
                  active:scale-[0.98]
                "
                fontStyle="text-black"
                title="コピーする"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}