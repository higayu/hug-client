const TABS = [
  { id: 'comparison', label: '月次比較' },
  { id: 'attendance', label: '出席データ' },
  { id: 'additionCount', label: '加算登録数データ' },
  { id: 'additionList', label: '加算一覧データ' },
]

export default function LeftTabs({
  activeTab,
  onChange,
}) {
  return (
    <div
      className="flex border-b border-gray-200 bg-gray-50 px-4 pt-2"
      role="tablist"
      aria-label="専門的支援データ"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'border-blue-500 bg-white text-blue-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
