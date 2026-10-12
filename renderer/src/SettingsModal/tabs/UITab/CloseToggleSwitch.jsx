import { useEffect } from 'react'

function CloseToggleSwitch({
  checked = true,
  onChange,
  title = 'Close button visibility',
  id = 'show-close-buttons',
}) {
  useEffect(() => {
    console.log('[CloseToggleSwitch] mounted:', { checked })
  }, [])

  const handleChange = (event) => {
    const next = event.target.checked
    console.log('[CloseToggleSwitch] changed:', next)
    onChange?.(next)
  }

  return (
    <label
      className="relative inline-block h-[22px] w-10 align-middle"
      title={title}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        className="peer h-0 w-0 opacity-0"
      />
      <span
        className="
          absolute inset-0 cursor-pointer rounded-[22px] bg-[#ccc]
          transition-all
          before:absolute before:bottom-[3px] before:left-[3px]
          before:h-4 before:w-4 before:rounded-full before:bg-white
          before:transition-all before:content-['']
          peer-checked:bg-blue-600 peer-checked:before:translate-x-[18px]
          peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600
          peer-focus-visible:ring-offset-2
        "
      />
    </label>
  )
}

export default CloseToggleSwitch
