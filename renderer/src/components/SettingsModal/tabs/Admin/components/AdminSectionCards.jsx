export default function AdminSectionCards({
  sections,
  activeSectionId,
  onChangeSection,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {sections.map((section) => {
        const isActive = activeSectionId === section.id

        return (
          <button
            key={section.id}
            type="button"
            title={section.description}
            onClick={() => onChangeSection(section.id)}
            className={`
              shrink-0
              whitespace-nowrap
              rounded-md
              border
              px-4
              py-1.5
              text-sm
              font-semibold
              transition-colors
              ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {section.label}
          </button>
        )
      })}
    </div>
  )
}