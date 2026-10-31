import { forwardRef, useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const PassWordInput = forwardRef(function PassWordInput({
  className = '',
  containerClassName = '',
  visibilityLabel = 'パスワード',
  disabled,
  ...props
}, ref) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeSlashIcon : EyeIcon

  return (
    <div className={`relative inline-flex min-w-0 items-center ${containerClassName}`}>
      <input {...props} ref={ref} type={visible ? 'text' : 'password'} disabled={disabled}
        className={`w-full ${className} pr-10`} />
      <button type="button" disabled={disabled} aria-pressed={visible}
        aria-label={`${visibilityLabel}を${visible ? '隠す' : '表示'}`}
        title={`${visibilityLabel}を${visible ? '隠す' : '表示'}`}
        onClick={() => setVisible((previous) => !previous)}
        className="absolute right-2 rounded border-none bg-transparent p-1 text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
})

export default PassWordInput
