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
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            activeSectionId === section.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {section.label}
        </button>
      ))}
    </div>
  )
}
