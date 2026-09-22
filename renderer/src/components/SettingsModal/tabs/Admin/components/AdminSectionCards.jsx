export default function AdminSectionCards({
  sections,
  activeSectionId,
  onChangeSection,
}) {
  return (
    <div className="mb-5 grid gap-3 md:grid-cols-2">
      {sections.map((section) => {
        const isActive = activeSectionId === section.id

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onChangeSection(section.id)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              isActive
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div
              className={`text-sm font-semibold ${
                isActive ? 'text-blue-700' : 'text-gray-800'
              }`}
            >
              {section.label}
            </div>
            <div className="mt-1 text-xs leading-5 text-gray-600">
              {section.description}
            </div>
          </button>
        )
      })}
    </div>
  )
}
