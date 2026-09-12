import {
  useRef,
  useState,
} from 'react'

const DEFAULT_PERCENT = 50

export default function VerticaPanel({
  top,
  bottom,
  defaultTopPercent = DEFAULT_PERCENT,
  minTopHeight = 160,
  minBottomHeight = 160,
  resizeBarHeight = 12,
  gripHeight = 8,
  className = '',
}) {
  const containerRef = useRef(null)
  const resizeBarRef = useRef(null)
  const isDraggingRef = useRef(false)

  const [
    topPercent,
    setTopPercent,
  ] = useState(defaultTopPercent)

  const [
    isResizing,
    setIsResizing,
  ] = useState(false)

  function updateHeight(clientY) {
    if (!isDraggingRef.current) {
      return
    }

    const container = containerRef.current

    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()

    if (rect.height <= 0) {
      return
    }

    let nextTopHeight =
      clientY - rect.top

    const maxTopHeight =
      rect.height - minBottomHeight

    nextTopHeight = Math.max(
      minTopHeight,
      Math.min(
        nextTopHeight,
        maxTopHeight,
      ),
    )

    const nextPercent =
      (nextTopHeight / rect.height) * 100

    setTopPercent(nextPercent)
  }

  function handlePointerDown(event) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()

    const resizeBar = resizeBarRef.current

    if (!resizeBar) {
      return
    }

    try {
      resizeBar.setPointerCapture(
        event.pointerId,
      )
    } catch (error) {
      console.warn(
        '[ResizableDashboardSplitPane] Pointer Captureの開始に失敗しました。',
        error,
      )
    }

    isDraggingRef.current = true
    setIsResizing(true)

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'row-resize'
  }

  function handlePointerMove(event) {
    if (!isDraggingRef.current) {
      return
    }

    updateHeight(event.clientY)
  }

  function finishResize(event) {
    if (!isDraggingRef.current) {
      return
    }

    isDraggingRef.current = false
    setIsResizing(false)

    document.body.style.userSelect = ''
    document.body.style.cursor = ''

    const resizeBar = resizeBarRef.current

    if (!resizeBar) {
      return
    }

    try {
      if (
        resizeBar.hasPointerCapture(
          event.pointerId,
        )
      ) {
        resizeBar.releasePointerCapture(
          event.pointerId,
        )
      }
    } catch (error) {
      console.warn(
        '[ResizableDashboardSplitPane] Pointer Captureの解除に失敗しました。',
        error,
      )
    }
  }

  function handlePointerUp(event) {
    finishResize(event)
  }

  function handlePointerCancel(event) {
    finishResize(event)
  }

  function handleLostPointerCapture() {
    isDraggingRef.current = false
    setIsResizing(false)

    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  function handleReset() {
    if (isDraggingRef.current) {
      return
    }

    setTopPercent(defaultTopPercent)
  }

  return (
    <div
      ref={containerRef}
      className={`
        flex
        h-full
        min-h-0
        min-w-0
        w-full
        flex-col
        overflow-hidden
        ${className}
      `}
    >
      {/* 上段 */}
      <div
        className="
          min-h-0
          min-w-0
          shrink-0
          overflow-hidden
        "
        style={{
          height: `${topPercent}%`,
        }}
      >
        {top}
      </div>

      {/* 上下リサイズバー */}
      <div
        ref={resizeBarRef}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Dashboardの上下パネル高さを変更"
        title="ドラッグして高さを変更 / ダブルクリックでリセット"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onDoubleClick={handleReset}
        className={`
          group
          relative
          z-20
          shrink-0
          touch-none
          cursor-row-resize
          select-none
          transition-colors
          ${
            isResizing
              ? 'bg-sky-500'
              : 'bg-gray-200 hover:bg-sky-400'
          }
        `}
        style={{
          height: `${resizeBarHeight}px`,
        }}
      >
        {/* 中央グリップ */}
        <div
          className={`
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            w-12
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            transition-colors
            ${
              isResizing
                ? 'bg-white'
                : 'bg-gray-400 group-hover:bg-white'
            }
          `}
          style={{
            height: `${gripHeight}px`,
          }}
        />
      </div>

      {/* 下段 */}
      <div
        className="
          min-h-0
          min-w-0
          flex-1
          overflow-hidden
        "
      >
        {bottom}
      </div>
    </div>
  )
}
