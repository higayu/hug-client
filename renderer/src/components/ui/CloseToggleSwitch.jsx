import { useEffect } from 'react'

/**
 * 閉じるボタン表示トグル
 *
 * @param {boolean} checked - 初期ON/OFF
 * @param {(checked: boolean) => void} onChange
 * @param {string} title
 * @param {string} id
 */
function CloseToggleSwitch({
  checked = true,
  onChange,
  title = '閉じるボタン表示トグル',
  id = 'closeToggle',
}) {

  useEffect(() => {
    console.log('🔘 [CloseToggleSwitch] mounted:', { checked })
  }, [])

  const handleChange = (e) => {
    const next = e.target.checked
    console.log('🔘 [CloseToggleSwitch] changed:', next)
    onChange?.(next)
  }

  return (
  <div className=''>
    <label
      className="toggle-switch relative inline-block w-10 h-[22px] ml-2 align-middle"
      title={title}
    >
      <input
        type="checkbox"
        id={id}
        defaultChecked={checked}
        onChange={handleChange}
        className="opacity-0 w-0 h-0"
      />
      <span
        className="
          slider absolute cursor-pointer
          top-0 left-0 right-0 bottom-0
          bg-[#ccc] rounded-[22px] transition-all
          before:content-['']
          before:absolute before:h-4 before:w-4
          before:left-[3px] before:bottom-[3px]
          before:bg-white before:rounded-full
          before:transition-all
        "
      />
    </label>
  </div>
  )
}

export default CloseToggleSwitch
