// ProfessionalSupportListButton/index.jsx
import { useTabs } from '@/hooks/useTabs'

export default function ProfessionalSupportListButton({ className = "", spaceId }) {
  const { addProfessionalSupportListTab } = useTabs(spaceId)

  return (
    <button
      id="professional-support"
      type="button"
      title="専門的支援の一覧を表示"
      onClick={addProfessionalSupportListTab}
      className={`flex-1 bg-gray-100 hover:bg-gray-200 py-1 rounded text-xs text-gray-600 transition-all flex items-center justify-center gap-1 ${className}`.trim()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      一覧
    </button>
  )
}