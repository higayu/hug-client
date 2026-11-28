import { useCallback } from 'react'

import { useAppState } from '@/AppStateContext'
import { addMonitoringTabAction } from '@/hooks/useTabs/actions/monitoring'

export default function MonitoringButtton({
  selectedChildId,
  selectedChildName,
  disabled = false,
  label = 'モニタリング',
  title = 'モニタリング',
  className = '',
}) {
  const { appState } = useAppState()

  const handleClick = useCallback(() => {
    addMonitoringTabAction(appState,selectedChildId, selectedChildName)
  }, [appState])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`
        cursor-pointer
        transition-all
        whitespace-nowrap
        disabled:grayscale
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${className}
      `}
    >
      {label}
    </button>
  )
}