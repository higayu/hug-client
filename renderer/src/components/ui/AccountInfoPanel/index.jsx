import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ToggleSecretText from "@/components/ui/ToggleSecretText";
import CopyButton from "@/components/ui/CopyButton";

export default function AccountInfoPanel({ title, items,isOpen = false }) {
  const [open, setOpen] = useState(isOpen);

  return (
    <div className="w-full text-xs text-left bg-gray-50 border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-1 font-semibold text-gray-700 hover:bg-gray-100 rounded-t-lg"
        aria-expanded={open}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-2 pb-2 space-y-1">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2"
            >
              <ToggleSecretText label={item.label} value={item.value} />
              <CopyButton
                text={item.value} 
                className='bg-white hover:bg-slate-500 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm shadow-sm active:scale-[0.98]'
                fontStyle='text-black'
                title='コピーする'
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
