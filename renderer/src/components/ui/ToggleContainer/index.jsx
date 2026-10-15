import { useState } from "react";

export default function ToggleContainer({ buttonLabel, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-md bg-slate-400">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full text-sm flex justify-between items-center px-4 py-3
                   text-left font-semibold text-slate-800
                   hover:bg-gray-100 transition-colors"
      >
        {buttonLabel}
        <span className="text-xl">{open ? "▲" : "▼"}</span>
      </button>

      <div className={open ? "p-4 transition-all duration-300" : "hidden"}>
        {children}
      </div>
    </div>
  );
}