/**
 * focusTracker.main.js
 *
 * Electronの main プロセス側で、
 *  - 新しいBrowserWindowがいつ・どこから作られたか
 *  - どのウィンドウがフォーカスを取った/失ったか
 *  - webviewがどのウィンドウにアタッチされたか
 * を可視化するための調査用モジュール。
 *
 * 使い方（main.js の一番最初、app.whenReady()より前でOK）:
 *
 *   const { attachFocusTracker } = require("./focusTracker.main.js")
 *   attachFocusTracker()
 *
 * ※ 画像のように「Login」用の小さいウィンドウが別途開いている場合、
 *    ここで new-window / window作成のログを見れば、
 *    どのコードがそのウィンドウを作っているか特定しやすくなる。
 */

const { app, BrowserWindow, webContents } = require("electron")

const LOG_PREFIX = "[FocusTracker:main]"

function log(label, details) {
  console.log(`${LOG_PREFIX} ${label}`, details ?? "")
}

function attachWindowTracking(win, source) {
  if (!win || win.__focusTrackerAttached) return
  win.__focusTrackerAttached = true

  log("window created", {
    id: win.id,
    source,
    title: win.getTitle(),
  })

  win.on("focus", () => {
    log("window focus", { id: win.id, title: win.getTitle() })
  })

  win.on("blur", () => {
    log("window blur", { id: win.id, title: win.getTitle() })
  })

  win.on("show", () => {
    log("window show", { id: win.id })
  })

  win.on("closed", () => {
    log("window closed", { id: win.id })
  })

  // レンダラー内で新しいwindow.open / target=_blankリンクなどが
  // 呼ばれた瞬間を捕捉する（新規ウィンドウが生成される直前）
  win.webContents.setWindowOpenHandler((details) => {
    log("setWindowOpenHandler: new window requested", {
      fromWindowId: win.id,
      url: details.url,
      frameName: details.frameName,
    })
    // 挙動は変えずログだけ残す（allowのまま）
    return { action: "allow" }
  })

  // webviewがこのウィンドウにアタッチされた瞬間
  win.webContents.on("did-attach-webview", (_event, webContentsOfWebview) => {
    log("did-attach-webview", {
      hostWindowId: win.id,
      webviewWebContentsId: webContentsOfWebview.id,
      url: webContentsOfWebview.getURL(),
    })

    webContentsOfWebview.on("did-finish-load", () => {
      log("webview did-finish-load", {
        webviewWebContentsId: webContentsOfWebview.id,
        url: webContentsOfWebview.getURL(),
      })
    })
  })
}

function attachFocusTracker() {
  // すでに存在するウィンドウにフック
  BrowserWindow.getAllWindows().forEach((win) =>
    attachWindowTracking(win, "existing"),
  )

  // これから作られるウィンドウにも自動でフック
  app.on("browser-window-created", (_event, win) => {
    attachWindowTracking(win, "browser-window-created")
  })

  // アプリ全体でどのwebContentsがOSフォーカスを持っているかも記録
  app.on("browser-window-focus", (_event, win) => {
    log("app: browser-window-focus", { id: win.id, title: win.getTitle() })
  })

  app.on("browser-window-blur", (_event, win) => {
    log("app: browser-window-blur", { id: win.id, title: win.getTitle() })
  })

  console.log(`${LOG_PREFIX} started. ウィンドウ/フォーカスの動きを監視中...`)
}

module.exports = { attachFocusTracker }