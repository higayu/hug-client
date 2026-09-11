// src/components/Sidebar/SelectChildrenList/TodayChildrenList/ChildrenListTabs.jsx

import { TAB_ITEMS } from "@/components/common/constants";

export default function ChildrenListTabs({
  activeTab,
  onChangeTab,
}) {
  return (
    <div className="flex gap-1 mb-2">
      {TAB_ITEMS.map(([label, key]) => (
        <button
          key={key}
          onClick={() => onChangeTab(key)}
          className={`px-3 py-1 rounded text-sm ${
            activeTab === key
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}