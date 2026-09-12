import {
  useRef,
  useState,
} from 'react'

const DEFAULT_PERCENT = 50

export default function HorizonPanel({
  left,
  right,
  defaultLeftPercent =
    DEFAULT_PERCENT,
  minLeftWidth = 300,
  minRightWidth = 300,

  // リサイズバー全体の太さ
  resizeBarWidth = 8,

  // 中央グリップの太さ
  gripWidth = 8,

  className = '',
}) {
  const containerRef =
    useRef(null)

  const resizeBarRef =
    useRef(null)

  const isDraggingRef =
    useRef(false)

  const [
    leftPercent,
    setLeftPercent,
  ] = useState(
    defaultLeftPercent,
  )

  const [
    isResizing,
    setIsResizing,
  ] = useState(false)

  function updateWidth(
    clientX,
  ) {
    /*
     * ドラッグ開始されていない場合は、
     * マウスが動いても何もしない。
     */
    if (
      !isDraggingRef.current
    ) {
      return
    }

    const container =
      containerRef.current

    if (!container) {
      return
    }

    const rect =
      container.getBoundingClientRect()

    if (
      rect.width <= 0
    ) {
      return
    }

    /*
     * コンテナ左端から
     * ポインター位置までの幅。
     */
    let nextLeftWidth =
      clientX -
      rect.left

    /*
     * 右側パネルの最低幅を
     * 確保した最大値。
     */
    const maxLeftWidth =
      rect.width -
      minRightWidth

    /*
     * 左右の最低幅を超えないようにする。
     */
    nextLeftWidth =
      Math.max(
        minLeftWidth,
        Math.min(
          nextLeftWidth,
          maxLeftWidth,
        ),
      )

    const nextPercent =
      (
        nextLeftWidth /
        rect.width
      ) * 100

    setLeftPercent(
      nextPercent,
    )
  }

  function handlePointerDown(
    event,
  ) {
    /*
     * 左クリックだけ有効。
     */
    if (
      event.button !== 0
    ) {
      return
    }

    event.preventDefault()

    const resizeBar =
      resizeBarRef.current

    if (!resizeBar) {
      return
    }

    /*
     * Pointer Captureを開始する。
     *
     * これにより、ポインターが
     * WebView上へ移動しても
     * resizeBarがイベントを
     * 受け取り続ける。
     */
    try {
      resizeBar.setPointerCapture(
        event.pointerId,
      )
    } catch (error) {
      console.warn(
        '[ResizableSplitPane] Pointer Captureの開始に失敗しました。',
        error,
      )
    }

    isDraggingRef.current =
      true

    setIsResizing(true)

    document.body.style.userSelect =
      'none'

    document.body.style.cursor =
      'col-resize'
  }

  function handlePointerMove(
    event,
  ) {
    /*
     * pointerdownされていない状態では
     * 絶対にリサイズしない。
     */
    if (
      !isDraggingRef.current
    ) {
      return
    }

    updateWidth(
      event.clientX,
    )
  }

  function finishResize(
    event,
  ) {
    if (
      !isDraggingRef.current
    ) {
      return
    }

    isDraggingRef.current =
      false

    setIsResizing(false)

    document.body.style.userSelect =
      ''

    document.body.style.cursor =
      ''

    const resizeBar =
      resizeBarRef.current

    if (!resizeBar) {
      return
    }

    /*
     * Pointer Captureを解除する。
     */
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
        '[ResizableSplitPane] Pointer Captureの解除に失敗しました。',
        error,
      )
    }
  }

  function handlePointerUp(
    event,
  ) {
    finishResize(
      event,
    )
  }

  function handlePointerCancel(
    event,
  ) {
    /*
     * OS側などでドラッグが
     * キャンセルされた場合にも終了する。
     */
    finishResize(
      event,
    )
  }

  function handleLostPointerCapture() {
    /*
     * Pointer Captureが何らかの理由で
     * 失われた場合にも必ず終了する。
     */
    isDraggingRef.current =
      false

    setIsResizing(false)

    document.body.style.userSelect =
      ''

    document.body.style.cursor =
      ''
  }

  function handleReset() {
    /*
     * ドラッグ中は
     * ダブルクリックリセットしない。
     */
    if (
      isDraggingRef.current
    ) {
      return
    }

    setLeftPercent(
      defaultLeftPercent,
    )
  }

  return (
    <div
      ref={
        containerRef
      }
      className={`
        flex
        h-full
        min-h-0
        min-w-0
        w-full
        overflow-hidden
        ${className}
      `}
    >
      {/* 左パネル */}
      <div
        className="
          min-h-0
          min-w-0
          shrink-0
          overflow-hidden
        "
        style={{
          width:
            `${leftPercent}%`,
        }}
      >
        {left}
      </div>

      {/* リサイズバー */}
      <div
        ref={
          resizeBarRef
        }
        role="separator"
        aria-orientation="vertical"
        aria-label="パネル幅を変更"
        title="ドラッグして幅を変更 / ダブルクリックでリセット"
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
        onLostPointerCapture={
          handleLostPointerCapture
        }
        onDoubleClick={
          handleReset
        }
        className={`
          group
          relative
          z-20
          shrink-0
          touch-none
          cursor-col-resize
          select-none
          transition-colors
          ${
            isResizing
              ? `
                bg-sky-500
              `
              : `
                bg-gray-200
                hover:bg-sky-400
              `
          }
        `}
        style={{
          width:
            `${resizeBarWidth}px`,
        }}
      >
        {/* 中央のグリップ */}
        <div
          className={`
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-12
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            transition-colors
            ${
              isResizing
                ? `
                  bg-white
                `
                : `
                  bg-gray-400
                  group-hover:bg-white
                `
            }
          `}
          style={{
            width:
              `${gripWidth}px`,
          }}
        />
      </div>

      {/* 右パネル */}
      <div
        className="
          min-h-0
          min-w-0
          flex-1
          overflow-hidden
        "
      >
        {right}
      </div>
    </div>
  )
}