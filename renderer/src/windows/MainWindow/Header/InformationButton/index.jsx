import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

export default function InformationButton({ className = '' }) {
  const handleClick = async () => {
    try {
      const openInformationWindow = window.electronAPI?.openInformationWindow

      if (typeof openInformationWindow !== 'function') {
        console.error(
          '[InformationButton] openInformationWindow が利用できません。main / preload の更新を確認してください。',
        )
        return
      }

      const result = await openInformationWindow()

      if (result?.success === false) {
        throw new Error(
          result?.message ||
            result?.error ||
            'InformationWindow の起動に失敗しました。',
        )
      }
    } catch (error) {
      console.error('[InformationButton] InformationWindow 起動エラー:', error)
    }
  }

  return (
    <nav
      className={`relative z-[1001] inline-block min-w-fit flex-shrink-0 ${className}`}
      aria-label="Q&A"
    >
      <button
        id="information-window-button"
        type="button"
        onClick={handleClick}
        className="flex cursor-pointer items-center gap-2 whitespace-nowrap border-none bg-amber-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-amber-500 focus:bg-amber-500 focus:outline-none"
        title="Q&A・障害対応を開く"
      >
        <QuestionMarkCircleIcon
          className="h-5 w-5 flex-shrink-0"
          aria-hidden="true"
        />
        <span>Q&amp;A</span>
      </button>
    </nav>
  )
}
