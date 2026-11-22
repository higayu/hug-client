import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { useAppState } from '@/AppStateContext'
import { addWebManagerAction_OutWindow } from '@/hooks/useTabs/actions/WebManager.js'

export default function BrowserOpenButton({
  switch_id = '',
  path = '',
  disabled_flg = false,
  title = 'Open web page',
}) {
  const { appState, iniState } = useAppState()

  const handleClick = (e) => {
    if (disabled_flg) {
      e.preventDefault()
      e.stopPropagation()

      console.log('[BrowserOpenButton] disabled click blocked', {
        switch_id,
        path,
        disabled_flg,
        title,
      })

      return
    }

    console.log('[BrowserOpenButton] clicked', {
      switch_id,
      path,
      appState,
      iniState,
    })

    addWebManagerAction_OutWindow(appState, iniState, switch_id, path)
  }

  return (
    <button
      id={`browser-open-button-${switch_id || 'default'}`}
      type="button"
      onClick={handleClick}
      aria-disabled={disabled_flg}
      title={title}
      aria-label={title}
      className={[
        'flex items-center justify-center',
        'rounded',
        'text-black',
        'px-3 py-2',
        'transition-all',
        disabled_flg
          ? 'bg-gray-300 opacity-70 cursor-not-allowed'
          : 'bg-blue-300 cursor-pointer hover:bg-[#e3f2fd]',
      ].join(' ')}
    >
      <GlobeAltIcon className="h-5 w-5" />
    </button>
  )
}