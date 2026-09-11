// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/parts/ChildNotes/index.jsx

import React from "react";

export default function ChildNotes({
  notes = "",
  emptyText = "メモがありません",
  className = "",
}) {
  return (
    <div
      className={`max-h-64 overflow-y-auto text-xs bg-gray-700 text-white p-2 rounded whitespace-pre-wrap ${className}`}
    >
      {notes || emptyText}
    </div>
  );
}
