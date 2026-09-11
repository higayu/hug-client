import { useEffect, useRef, useState } from 'react'
import { useAppState } from '@/AppStateContext'

const baseTabs = [
  {
    id: 'FanContent',
    label: 'クイック操作',
  },
  {
    id: 'insertManageChildren',
    label: '👶 児童追加',
  },
  {
    id: 'updateManager',
    label: '👥 担当編集',
  },
  {
    id: 'tools',
    label: '旧操作パネル',
  },
]

// 親ボタン中心から見た右下方向の円弧
// 4つともほぼ同じ半径上に配置
const menuPositions = [
  { x: 145, y: 40 },
  { x: 120, y: 95 },
  { x: 80, y: 135 },
  { x: 25, y: 155 },
]

export default function FanMenuButton() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  const {
    activeSidebarTab: activeTab,
    setActiveSidebarTab: setActiveTab,
  } = useAppState()

  const selectedTab = baseTabs.find(
    (tab) => tab.id === activeTab
  )

  const mainButtonLabel = selectedTab?.label ?? 'メニュー'

  const handleMainButtonClick = () => {
    setIsOpen((prev) => !prev)
  }

  const handleItemClick = (item) => {
    setActiveTab(item.id)
    setIsOpen(false)
  }

  // 外側クリックで閉じる
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )
    }
  }, [])

  return (
    <div
      ref={menuRef}
      className="relative z-[110] h-12 w-36"
    >
      {/* ========================================
          右下の扇形背景
      ======================================== */}
      <div
        className={`
          pointer-events-none
          absolute

          left-1/2
          top-1/2

          h-[220px]
          w-[220px]

          origin-top-left

          rounded-br-full

          bg-[radial-gradient(circle_at_left_top,transparent_0_55px,rgba(0,0,0,0.05)_56px_100%)]

          transition-all
          duration-300

          ${
            isOpen
              ? 'scale-100 opacity-100'
              : 'scale-50 opacity-0'
          }
        `}
      />

      {/* ========================================
          子ボタン
      ======================================== */}
      {baseTabs.map((item, index) => {
        const isActive = activeTab === item.id
        const position = menuPositions[index]

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item)}
            aria-pressed={isActive}
            style={{
              transform: isOpen
                ? `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(1)`
                : 'translate(-50%, -50%) translate(0px, 0px) scale(0.4)',
            }}
            className={`
              absolute

              left-1/2
              top-1/2

              z-30

              flex
              h-16
              w-16

              items-center
              justify-center

              rounded-full

              px-2

              text-center
              text-[11px]
              font-semibold
              leading-tight

              shadow-[0_5px_16px_rgba(0,0,0,0.18)]

              transition-all
              duration-[450ms]
              ease-[cubic-bezier(.2,.8,.2,1)]

              focus:outline-none
              focus:ring-2
              focus:ring-blue-400
              focus:ring-offset-2

              ${
                isActive
                  ? `
                    bg-blue-100
                    text-blue-700
                    ring-2
                    ring-blue-400
                  `
                  : `
                    bg-white
                    text-gray-800
                    hover:bg-gray-100
                  `
              }

              ${
                isOpen
                  ? `
                    pointer-events-auto
                    opacity-100
                  `
                  : `
                    pointer-events-none
                    opacity-0
                  `
              }
            `}
          >
            {item.label}
          </button>
        )
      })}

      {/* ========================================
          親ボタン
      ======================================== */}
      <button
        type="button"
        onClick={handleMainButtonClick}
        title={`${mainButtonLabel}（選択中）`}
        aria-label={
          isOpen
            ? `${mainButtonLabel}のメニューを閉じる`
            : `${mainButtonLabel}のメニューを開く`
        }
        aria-expanded={isOpen}
        className={`
          absolute

          bottom-0
          left-1/2

          z-40

          flex
          h-12
          w-36

          -translate-x-1/2

          items-center
          justify-center

          rounded-xl

          bg-gray-900

          px-3

          text-sm
          font-semibold
          text-white

          shadow-[0_6px_20px_rgba(0,0,0,0.28)]

          transition-all
          duration-300

          hover:bg-gray-800

          focus:outline-none
          focus:ring-2
          focus:ring-gray-500
          focus:ring-offset-2
        `}
      >
        {mainButtonLabel}
      </button>
    </div>
  )
}