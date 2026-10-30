import { useId, useState } from "react";

export default function ToggleContainerHorizontal({
  buttonLabel,
  children,
  defaultOpen = false,
  className = "",
  onOpenChange,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const buttonId = useId();
  const panelId = useId();
  const hasButtonLabel = typeof buttonLabel === "string"
    ? buttonLabel.trim().length > 0
    : Boolean(buttonLabel);

  return (
    <div className={`flex items-stretch border rounded-md bg-slate-400 ${className}`}>
      <button
        id={buttonId}
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          onOpenChange?.(nextOpen);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={hasButtonLabel ? undefined : open ? "内容を閉じる" : "内容を開く"}
        className={`flex shrink-0 items-center ${hasButtonLabel ? "w-44 justify-between px-4" : "w-12 justify-center px-2"} gap-2 py-3
                   text-left text-sm font-semibold text-slate-800
                   transition-colors hover:bg-gray-100`}
      >
        {hasButtonLabel && <span className="min-w-0 break-words">{buttonLabel}</span>}
        <span aria-hidden="true" className="shrink-0 text-xl">
          {open ? "◀" : "▶"}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="min-w-0 flex-1 border-l border-slate-300 p-4"
      >
        {children}
      </div>
    </div>
  );
}
