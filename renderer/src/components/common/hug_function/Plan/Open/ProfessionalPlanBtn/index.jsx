import DynamicOpenBrowserBtn from '@/components/ui/DynamicOpenBrowserBtn'
import { resolveProfessionalPlanUrl } from './resolveProfessionalPlanUrl.js'

export default function ProfessionalPlanBtn({
  selectedChildId,
  className = '',
  label = '専門的支援-計画',
  title = '専門的支援計画を開く',
  disabled = false,
  onOpened,

}) {
  const childId = selectedChildId

  return (
    <DynamicOpenBrowserBtn
      id="Specialized-Support-Plan"
      role="menuitem"
      label={label}
      title={title}
      resolveUrl={() =>
        resolveProfessionalPlanUrl({
          childId,
        })
      }
      disabled={disabled || !childId}
      resolvingLabel="検索中…"
      openingLabel="起動中…"
      onOpened={onOpened}
      className={`
        w-full
        bg-red-600
        px-4
        text-sm
        text-white
        transition-colors
        hover:bg-red-700
        focus:bg-red-700
        ${className}
      `}
    />
  )
}