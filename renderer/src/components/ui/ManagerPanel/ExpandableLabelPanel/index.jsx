import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function ExpandableLabelPanel({
  className = '',
  label = 'ラベル名',
  buttonClassName = 'bg-gray-900 hover:bg-gray-800',
  panelClassName = '',
  disabled = false,
  expandDirection = 'up',
  closeOnButtonClick = true,
  children = null,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [overlayStyle, setOverlayStyle] = useState(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const overlayRef = useRef(null)
  const isExpandDown = expandDirection === 'down'
  const arrowRotationClass = isExpandDown
    ? isOpen ? 'rotate-180' : 'rotate-0'
    : isOpen ? 'rotate-0' : 'rotate-180'

  useEffect(() => {
    if (disabled) setIsOpen(false)
  }, [disabled])

  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target) &&
          !overlayRef.current?.contains(event.target)) setIsOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useLayoutEffect(() => {
    if (!isOpen) {
      setOverlayStyle(null)
      return
    }
    const updateOverlayPosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const gap = 4
      const height = overlayRef.current?.offsetHeight || 118
      const top = isExpandDown ? rect.bottom + gap : Math.max(gap, rect.top - height - gap)
      setOverlayStyle({ position: 'fixed', top: `${top}px`, left: `${rect.left}px`, width: `${rect.width}px`, zIndex: 9999 })
    }
    updateOverlayPosition()
    const raf = requestAnimationFrame(updateOverlayPosition)
    window.addEventListener('resize', updateOverlayPosition)
    window.addEventListener('scroll', updateOverlayPosition, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateOverlayPosition)
      window.removeEventListener('scroll', updateOverlayPosition, true)
    }
  }, [isOpen, isExpandDown])

  useLayoutEffect(() => {
    if (!isOpen || !overlayRef.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect || !overlayRef.current) return
      const top = isExpandDown ? rect.bottom + 4 : Math.max(4, rect.top - overlayRef.current.offsetHeight - 4)
      setOverlayStyle(prev => prev && ({ ...prev, top: `${top}px`, left: `${rect.left}px`, width: `${rect.width}px` }))
    })
    observer.observe(overlayRef.current)
    if (triggerRef.current) observer.observe(triggerRef.current)
    return () => observer.disconnect()
  }, [isOpen, isExpandDown, Boolean(overlayStyle)])

  function handlePanelClick(event) {
    if (!closeOnButtonClick) return
    const button = event.target?.closest?.('button, input[type="button"], input[type="submit"], [role="button"]')
    if (!button || !event.currentTarget.contains(button)) return
    if (button.matches(':disabled, [aria-disabled="true"]')) return
    if (button.closest('[data-keep-panel-open]')) return
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className={`relative flex flex-col ${isOpen ? 'z-[120]' : 'z-0'} ${className}`}>
      {isOpen && overlayStyle && createPortal(
        <div ref={overlayRef} onClick={handlePanelClick} style={overlayStyle} className={`min-h-12 rounded-md bg-gray-900 p-1.5 shadow-xl ${panelClassName}`}>
          {children}
        </div>, document.body
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        className={`flex h-10 w-full items-center justify-between gap-2 px-3 font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
      >
        <span className="min-w-0 truncate">{label}</span>
          <svg className={`h-4 w-4 transition-transform duration-200 ${arrowRotationClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
      </button>
    </div>
  )
}
