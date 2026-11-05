export default function StaffSectionTabs({
  sections,
  activeSectionId,
  onChangeSection,
}) {
  return (
    <div className="mb-5 flex gap-2 border-b border-gray-200">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onChangeSection(section.id)}
          aria-selected={activeSectionId === section.id}
          role="tab"
          className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeSectionId === section.id
              ? 'border-blue-800 bg-blue-800 text-white shadow-sm'
              : 'border-transparent text-gray-600 hover:bg-blue-50 hover:text-blue-800'
          }`}
        >
          {section.label}
        </button>
      ))}
    </div>
  )
}
