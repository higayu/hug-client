import OpenBrowserBtn from '@/components/ui/OpenBrowserBtn'

const BROWSER_URL = 'https://dev-hug-banso.we-labo.com/public/admin'

export default function BackEndButton({
  className = '',
}) {
  return (
    <OpenBrowserBtn
      url={BROWSER_URL}
      label="バックエンド管理画面"

      className={`
        bg-purple-500
        text-white
        transition-colors
        hover:bg-purple-700
        ${className}
      `}
    />
  )
}