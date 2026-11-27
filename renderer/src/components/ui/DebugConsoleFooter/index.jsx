import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const MAX_LOGS = 300

function formatValue(value) {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`
  }

  if (typeof value === 'string') {
    return value
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value == null
  ) {
    return String(value)
  }

  try {
    return JSON.stringify(
      value,
      null,
      2,
    )
  } catch {
    return String(value)
  }
}

function formatArgs(args) {
  return args
    .map(formatValue)
    .join(' ')
}

function getLogStyle(level) {
  switch (level) {
    case 'error':
      return {
        row:
          'bg-rose-950/40 text-rose-200',
        badge:
          'bg-rose-500/20 text-rose-300',
      }

    case 'warn':
      return {
        row:
          'bg-amber-950/30 text-amber-200',
        badge:
          'bg-amber-500/20 text-amber-300',
      }

    case 'info':
      return {
        row:
          'text-cyan-200',
        badge:
          'bg-cyan-500/20 text-cyan-300',
      }

    default:
      return {
        row:
          'text-slate-300',
        badge:
          'bg-slate-500/20 text-slate-300',
      }
  }
}

export default function DebugConsoleFooter({
  defaultOpen = false,
}) {
  const [logs, setLogs] =
    useState([])

  const [isOpen, setIsOpen] =
    useState(defaultOpen)

  const [filter, setFilter] =
    useState('all')

  const scrollRef =
    useRef(null)

  /*
   * console.log / warn / error / info を捕捉
   */
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }

    function addLog(
      level,
      args,
    ) {
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp:
          new Date(),
        level,
        message:
          formatArgs(args),
      }

      setLogs(
        (current) => {
          const next = [
            ...current,
            entry,
          ]

          if (
            next.length >
            MAX_LOGS
          ) {
            return next.slice(
              next.length -
                MAX_LOGS,
            )
          }

          return next
        },
      )
    }

    console.log = (
      ...args
    ) => {
      originalConsole.log(
        ...args,
      )

      addLog(
        'log',
        args,
      )
    }

    console.info = (
      ...args
    ) => {
      originalConsole.info(
        ...args,
      )

      addLog(
        'info',
        args,
      )
    }

    console.warn = (
      ...args
    ) => {
      originalConsole.warn(
        ...args,
      )

      addLog(
        'warn',
        args,
      )
    }

    console.error = (
      ...args
    ) => {
      originalConsole.error(
        ...args,
      )

      addLog(
        'error',
        args,
      )
    }

    /*
     * 通常のJavaScriptエラー
     */
    function handleWindowError(
      event,
    ) {
      addLog(
        'error',
        [
          '[Window Error]',
          event.message,
          event.filename
            ? `${event.filename}:${event.lineno}:${event.colno}`
            : '',
        ],
      )
    }

    /*
     * Promiseの未処理エラー
     */
    function handleUnhandledRejection(
      event,
    ) {
      addLog(
        'error',
        [
          '[Unhandled Promise Rejection]',
          event.reason,
        ],
      )
    }

    window.addEventListener(
      'error',
      handleWindowError,
    )

    window.addEventListener(
      'unhandledrejection',
      handleUnhandledRejection,
    )

    return () => {
      console.log =
        originalConsole.log

      console.info =
        originalConsole.info

      console.warn =
        originalConsole.warn

      console.error =
        originalConsole.error

      window.removeEventListener(
        'error',
        handleWindowError,
      )

      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      )
    }
  }, [])

  /*
   * 新しいログが追加されたら一番下へ
   */
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const element =
      scrollRef.current

    if (!element) {
      return
    }

    element.scrollTop =
      element.scrollHeight
  }, [
    logs,
    isOpen,
  ])

  const filteredLogs =
    useMemo(() => {
      if (
        filter === 'all'
      ) {
        return logs
      }

      if (
        filter === 'webrtc'
      ) {
        return logs.filter(
          (log) =>
            log.message.includes(
              '[WebRTC]',
            ),
        )
      }

      if (
        filter ===
        'websocket'
      ) {
        return logs.filter(
          (log) =>
            log.message.includes(
              '[WebSocket]',
            ),
        )
      }

      return logs.filter(
        (log) =>
          log.level ===
          filter,
      )
    }, [
      logs,
      filter,
    ])

  const errorCount =
    logs.filter(
      (log) =>
        log.level ===
        'error',
    ).length

  const warningCount =
    logs.filter(
      (log) =>
        log.level ===
        'warn',
    ).length

  function clearLogs() {
    setLogs([])
  }

  async function copyLogs() {
    const text =
      filteredLogs
        .map((log) => {
          const time =
            log.timestamp.toLocaleTimeString(
              'ja-JP',
              {
                hour12:
                  false,
              },
            )

          return [
            `[${time}]`,
            `[${log.level.toUpperCase()}]`,
            log.message,
          ].join(' ')
        })
        .join('\n')

    try {
      await navigator.clipboard.writeText(
        text,
      )

      void 0
    } catch (error) {
      console.error(
        '[DebugFooter] ログのコピーに失敗しました',
        error,
      )
    }
  }

  return (
    <div
      className="
        w-full
        shrink-0
        border-t
        border-slate-700
        bg-slate-950
        text-xs
      "
    >
      {/* フッターヘッダー */}
      <div
        className="
          flex
          min-h-[42px]
          items-center
          justify-between
          gap-3
          px-4
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <button
            type="button"
            className="
              rounded
              bg-slate-800
              px-3
              py-1.5
              font-semibold
              text-slate-200
              hover:bg-slate-700
            "
            onClick={() =>
              setIsOpen(
                (current) =>
                  !current,
              )
            }
          >
            {isOpen
              ? '▼'
              : '▲'}
            {' '}
            接続ログ
          </button>

          <span
            className="
              text-slate-400
            "
          >
            {logs.length}
            {' 件'}
          </span>

          {warningCount >
            0 && (
            <span
              className="
                rounded
                bg-amber-500/20
                px-2
                py-1
                text-amber-300
              "
            >
              WARN{' '}
              {warningCount}
            </span>
          )}

          {errorCount >
            0 && (
            <span
              className="
                rounded
                bg-rose-500/20
                px-2
                py-1
                font-semibold
                text-rose-300
              "
            >
              ERROR{' '}
              {errorCount}
            </span>
          )}
        </div>

        {isOpen && (
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <select
              value={
                filter
              }
              onChange={(
                event,
              ) =>
                setFilter(
                  event
                    .target
                    .value,
                )
              }
              className="
                rounded
                border
                border-slate-700
                bg-slate-900
                px-2
                py-1
                text-slate-200
              "
            >
              <option
                value="all"
              >
                すべて
              </option>

              <option
                value="webrtc"
              >
                WebRTC
              </option>

              <option
                value="websocket"
              >
                WebSocket
              </option>

              <option
                value="error"
              >
                Error
              </option>

              <option
                value="warn"
              >
                Warn
              </option>

              <option
                value="log"
              >
                Log
              </option>
            </select>

            <button
              type="button"
              className="
                rounded
                bg-slate-800
                px-3
                py-1
                text-slate-200
                hover:bg-slate-700
              "
              onClick={
                copyLogs
              }
            >
              コピー
            </button>

            <button
              type="button"
              className="
                rounded
                bg-slate-800
                px-3
                py-1
                text-slate-200
                hover:bg-slate-700
              "
              onClick={
                clearLogs
              }
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {/* ログ表示 */}
      {isOpen && (
        <div
          ref={
            scrollRef
          }
          className="
            h-[220px]
            overflow-y-auto
            border-t
            border-slate-800
            bg-black/60
            font-mono
          "
        >
          {filteredLogs.length ===
          0 ? (
            <div
              className="
                p-4
                text-slate-500
              "
            >
              ログはありません
            </div>
          ) : (
            filteredLogs.map(
              (log) => {
                const style =
                  getLogStyle(
                    log.level,
                  )

                return (
                  <div
                    key={
                      log.id
                    }
                    className={`
                      flex
                      gap-3
                      border-b
                      border-slate-900
                      px-3
                      py-1.5
                      ${style.row}
                    `}
                  >
                    <span
                      className="
                        shrink-0
                        text-slate-500
                      "
                    >
                      {log.timestamp.toLocaleTimeString(
                        'ja-JP',
                        {
                          hour12:
                            false,
                        },
                      )}
                    </span>

                    <span
                      className={`
                        h-fit
                        shrink-0
                        rounded
                        px-1.5
                        py-0.5
                        text-[10px]
                        font-semibold
                        uppercase
                        ${style.badge}
                      `}
                    >
                      {log.level}
                    </span>

                    <pre
                      className="
                        min-w-0
                        flex-1
                        whitespace-pre-wrap
                        break-all
                        font-mono
                      "
                    >
                      {
                        log.message
                      }
                    </pre>
                  </div>
                )
              },
            )
          )}
        </div>
      )}
    </div>
  )
}