import { useState } from 'react'

/** 上部のボタンで表裏を切り替える3Dパネル。 */
export default function FlipCard({
  front = <DefaultFront />,
  back = <DefaultBack />,
  width = 250,
  height = 350,
  defaultFlipped = false,
  className = '',
  onFlip,
  // ダッシュボード等で利用する全幅・スクロール対応モード。
  panel = false,
  frontLabel = 'テーブル表示',
  backLabel = '個人記録表示',
}) {
  const [flipped, setFlipped] = useState(defaultFlipped)

  function toggle() {
    const next = !flipped
    setFlipped(next)
    onFlip?.(next)
  }

  if (panel) {
    return (
      <div className={`flex min-w-0 flex-col gap-3 ${className}`}>
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg border border-sky-200 bg-sky-50 p-1" role="group" aria-label="表示切り替え">
            <button type="button" onClick={flipped ? toggle : undefined} aria-pressed={!flipped}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${!flipped ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}>
              {frontLabel}
            </button>
            <button type="button" onClick={!flipped ? toggle : undefined} aria-pressed={flipped}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${flipped ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}>
              {backLabel}
            </button>
          </div>
        </div>
        <div className="min-w-0 [perspective:1200px]" style={{ width, height }}>
          <div className="relative h-full w-full transition-transform duration-[600ms] ease-in-out [transform-style:preserve-3d] motion-reduce:transition-none"
            style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            <div aria-hidden={flipped} inert={flipped ? '' : undefined}
              className="absolute inset-0 min-w-0 overflow-auto bg-white [backface-visibility:hidden]">
              {front}
            </div>
            <div aria-hidden={!flipped} inert={!flipped ? '' : undefined}
              className="absolute inset-0 min-w-0 overflow-auto bg-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {back}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      <button type="button" onClick={toggle} aria-pressed={flipped}
        className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-md transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">
        {flipped ? '表面に切り替える' : '裏面に切り替える'}
      </button>
      <div className="[perspective:1000px]" style={{ width, height }}>
        <div className="relative h-full w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          <div aria-hidden={flipped} className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-4 border-white bg-gradient-to-br from-[#007bff] to-[#0056b3] text-center text-2xl font-bold text-white shadow-[0_10px_25px_rgba(0,0,0,0.5)] [backface-visibility:hidden]">{front}</div>
          <div aria-hidden={!flipped} className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-4 border-white bg-gradient-to-br from-[#ff416c] to-[#ff4b2b] text-center text-2xl font-bold text-white shadow-[0_10px_25px_rgba(0,0,0,0.5)] [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
        </div>
      </div>
    </div>
  )
}

function DefaultFront() { return <><span>【 表 面 】</span><span className="mt-3 text-base font-normal">上のボタンで回転</span></> }
function DefaultBack() { return <><span>【 裏 面 】</span><span className="mt-3 text-base font-normal">ボタンでもう一度回転</span></> }
