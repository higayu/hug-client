import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function InformationButton({
  className = '',
}) {
  const handleClick = async () => {
    try {
      const result =
        await window.electronAPI?.openInformationWindow?.();

      if (result?.success === false) {
        throw new Error(
          result.error || 'Q&A画面を開けませんでした。',
        );
      }
    } catch (error) {
      console.error(
        '[InformationButton] InformationWindow起動エラー:',
        error,
      );
    }
  };

  return (
    <nav
      className={`
        relative
        z-[1001]
        flex-shrink-0
        ${className}
      `}
      aria-label="Q&A・障害対応"
    >
      <button
        id="information-window-button"
        type="button"
        onClick={handleClick}
        className="
          flex
          cursor-pointer
          items-center
          gap-2
          whitespace-nowrap
          border-none
          bg-[#455a64]
          px-3
          py-1.5
          text-sm
          text-white
          transition-colors
          hover:bg-[#607d8b]
          focus:bg-[#607d8b]
          focus:outline-none
        "
        aria-label="Q&A・障害対応を開く"
        title="Q&A・障害対応"
      >
        <QuestionMarkCircleIcon
          className="h-5 w-5 flex-shrink-0"
          aria-hidden="true"
        />
        <span>Q&amp;A</span>
      </button>
    </nav>
  );
}
