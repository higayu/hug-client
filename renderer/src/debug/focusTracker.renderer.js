/**
 * focusTracker.renderer.js
 *
 * 「テキストエリアに入力できなくなる」原因を調査するためのデバッグ用モジュール。
 * renderer プロセス（画面を描画している側）の起動時に一度だけ読み込む。
 *
 * 使い方:
 *   import { startFocusTracker } from "./focusTracker.renderer.js"
 *   startFocusTracker() // App起動直後、一番最初に呼ぶ
 *
 * コンソールに以下のログが出る:
 *   [FocusTracker] focusin      : フォーカスが当たった要素
 *   [FocusTracker] focusout     : フォーカスが外れた要素
 *   [FocusTracker] window blur  : ウィンドウ自体がフォーカスを失った
 *   [FocusTracker] window focus : ウィンドウ自体がフォーカスを取り戻した
 *   [FocusTracker] visibility   : タブ/ウィンドウの表示状態が変わった
 *   [FocusTracker] new webview  : 新しい <webview> がDOMに追加された
 *   [FocusTracker] new window   : window.open 等で新しいウィンドウが開かれた
 *
 * 本番環境で常時動かすものではないので、調査が終わったら呼び出しを外すこと。
 */

const LOG_PREFIX = "[FocusTracker]"

function describeElement(el) {
  if (!el) return "null"
  if (el === document.body) return "<body>"
  if (el === document.documentElement) return "<html>"

  const tag = el.tagName ? el.tagName.toLowerCase() : "unknown"
  const id = el.id ? `#${el.id}` : ""
  const cls =
    typeof el.className === "string" && el.className
      ? `.${el.className.trim().split(/\s+/).join(".")}`
      : ""
  const dataMemo = el.dataset?.memoInput
    ? ` [data-memo-input=${el.dataset.memoInput}]`
    : ""
  const dataTarget = el.dataset?.target ? ` [data-target=${el.dataset.target}]` : ""

  return `${tag}${id}${cls}${dataMemo}${dataTarget}`
}

function logGroup(label, details) {
  // grouped で出すと「何が原因で発生したイベントか」の前後関係が追いやすい
  console.groupCollapsed(
    `%c${LOG_PREFIX} ${label}`,
    "color:#2563eb;font-weight:bold;",
  )
  void 0
  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      void 0
    })
  }
  // どこから呼ばれたか（呼び出し元コード）をスタックトレースで残す
  console.trace("stack")
  console.groupEnd()
}

export function startFocusTracker() {
  if (window.__focusTrackerStarted) {
    console.warn(`${LOG_PREFIX} already started`)
    return
  }
  window.__focusTrackerStarted = true

  // 1) 要素単位のフォーカス移動を全部拾う（キャプチャフェーズで拾うので取りこぼしがない）
  document.addEventListener(
    "focusin",
    (e) => {
      logGroup("focusin", {
        target: describeElement(e.target),
        relatedTarget: describeElement(e.relatedTarget),
      })
    },
    true,
  )

  document.addEventListener(
    "focusout",
    (e) => {
      logGroup("focusout", {
        target: describeElement(e.target),
        relatedTarget: describeElement(e.relatedTarget),
      })
    },
    true,
  )

  // 2) ウィンドウ自体がOSレベルでフォーカスを失った/戻った
  //    → 別ウィンドウ（Loginウィンドウなど）が前面に出た場合はここで検知できる
  window.addEventListener("blur", () => {
    logGroup("window blur", {
      activeElementBeforeBlur: describeElement(document.activeElement),
    })
  })

  window.addEventListener("focus", () => {
    logGroup("window focus", {
      activeElement: describeElement(document.activeElement),
    })
  })

  // 3) 表示状態の変化（タブ切り替え、最小化など）
  document.addEventListener("visibilitychange", () => {
    logGroup("visibility", {
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus(),
    })
  })

  // 4) 新しい <webview> がDOMに追加されたら通知
  //    AIタブ(OpenAI/DeepSeek)など、webviewが増えるたびにフォーカスを持っていく
  //    可能性が高いので、追加タイミングをここで必ず記録する
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return

        if (node.tagName === "WEBVIEW") {
          logGroup("new webview", {
            id: node.id,
            src: node.getAttribute("src"),
          })

          node.addEventListener("focus", () => {
            logGroup("webview focus", { id: node.id })
          })
          node.addEventListener("blur", () => {
            logGroup("webview blur", { id: node.id })
          })
          node.addEventListener("did-attach", () => {
            logGroup("webview did-attach", { id: node.id })
          })
        }

        // webview以外の要素の中に紛れて追加されるケースもあるので中も探す
        node.querySelectorAll?.("webview").forEach((wv) => {
          logGroup("new webview (nested)", {
            id: wv.id,
            src: wv.getAttribute("src"),
          })
        })
      })
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })

  // 5) window.open / 新規BrowserWindow が開かれた形跡を残す
  //    （画像のLoginウィンドウのような別ウィンドウが原因の場合、ここが鍵になる）
  const originalOpen = window.open
  window.open = function (...args) {
    logGroup("window.open called", { args })
    return originalOpen.apply(this, args)
  }

  // 6) 定期的にactiveElementをポーリングし、「入力できない瞬間」の直前状態を残す
  //    (イベントが発火しない特殊なフォーカス喪失=OSのIME候補ウィンドウなどを拾うため)
  let lastActive = document.activeElement
  setInterval(() => {
    if (document.activeElement !== lastActive) {
      logGroup("activeElement changed (poll)", {
        from: describeElement(lastActive),
        to: describeElement(document.activeElement),
      })
      lastActive = document.activeElement
    }
  }, 500)

  void 0
}

export function stopFocusTracker() {
  // MutationObserverやsetIntervalの完全な停止が必要な場合は
  // startFocusTracker内の変数をモジュールスコープに出して個別にdisconnect/clearする。
  // 調査用の簡易実装のため、通常はページのリロードで停止すれば十分。
  window.__focusTrackerStarted = false
  void 0
}