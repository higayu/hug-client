import OpenBrowserBtn from '@/components/ui/OpenBrowserBtn'

const BROWSER_URL = 'https://github.com/higayu/hug-client/releases'

export default function ReleaseButton({
  className = '',
}) {
  return (
    <OpenBrowserBtn
      url={BROWSER_URL}
      label="リリースのリンク"

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