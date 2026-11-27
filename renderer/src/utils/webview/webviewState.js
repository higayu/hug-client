// src/utils/webviewState.js
// WebView状態管理ユーティリティ（安全版）
// - 固定ID "hugview" 依存を排除（表示中webviewを探す）
// - setActiveWebview呼び出しのたびにリスナーが増える問題を回避（WeakSet）
// - dom-ready 済みでも通知されるように即dispatch
// - closeTab等でDOMから消えた参照を自動的に無効化

let activeWebview = null;

// 同じwebviewにイベントを二重登録しないため
const hooked = new WeakSet();

/**
 * アクティブ変更イベントを安全にdispatch
 */
function dispatchActiveChanged(vw, reason = "") {
  if (!vw || !document.contains(vw)) return;

  let url = "";
  try {
    if (typeof vw.getURL === "function") {
      url = vw.getURL();
    }
  } catch {
    // dom-ready前などは取れないことがあるので黙殺
  }

  if (reason) {
    void 0;
  } else {
    void 0;
  }

  document.dispatchEvent(
    new CustomEvent("active-webview-changed", {
      detail: { webview: vw, url }
    })
  );
}

/**
 * 表示中（= .hidden が付いていない）webviewを探す
 * ※あなたの実装が hidden クラスで表示切替している前提
 */
function findVisibleWebview() {
  return document.querySelector("webview:not(.hidden)") || null;
}

/**
 * 何かしらのwebviewを探す（保険）
 */
function findAnyWebview() {
  return document.querySelector("webview") || null;
}

/**
 * 現在のアクティブwebviewを取得
 */
export function getActiveWebview() {
  console.group("🔍 getActiveWebview() 呼び出し");

  // activeがある & DOM上に存在するならそれを返す
  if (activeWebview && document.contains(activeWebview)) {
    try {
      let url = "";
      if (typeof activeWebview.getURL === "function") {
        try {
          url = activeWebview.getURL();
        } catch {
          // dom-ready前などは正常系として扱う
          console.groupEnd();
          return activeWebview;
        }
      }
      if (url) void 0;
    } finally {
      console.groupEnd();
    }
    return activeWebview;
  }

  // activeが無い/消えている → 表示中webviewから復元
  const visible = findVisibleWebview();
  if (visible) {
    activeWebview = visible;
    void 0;
    console.groupEnd();
    return activeWebview;
  }

  // 最後の保険：存在する最初のwebview
  const any = findAnyWebview();
  if (any) {
    activeWebview = any;
    console.warn("⚠ visible が無いので先頭webviewを active として復元:", any.id);
    console.groupEnd();
    return activeWebview;
  }

  activeWebview = null;
  console.warn("⚠ webview が見つかりません");
  console.groupEnd();
  return null;
}

/**
 * アクティブwebviewを更新（タブ切り替え時などに使用）
 */
export function setActiveWebview(vw) {
  void 0;
  if (!vw || !document.contains(vw)) {
    activeWebview = null;
    console.warn("⚠ setActiveWebview: vw が無効（null または DOM外）");
    return;
  }

  activeWebview = vw;
  void 0;

  // 初回だけイベントを仕込む（積み増し防止）
  if (!hooked.has(vw)) {
    hooked.add(vw);

    // dom-ready（初回DOM構築）
    vw.addEventListener("dom-ready", () => dispatchActiveChanged(vw, "dom-ready"));

    // 遷移系（URL変更を拾う）
    vw.addEventListener("did-navigate", () => dispatchActiveChanged(vw, "did-navigate"));
    vw.addEventListener("did-navigate-in-page", () => dispatchActiveChanged(vw, "did-navigate-in-page"));

    // ロード完了（動的描画後も拾えることがある）
    vw.addEventListener("did-finish-load", () => dispatchActiveChanged(vw, "did-finish-load"));
  }

  // 切替時にも即通知（dom-ready 済みでも反応する）
  dispatchActiveChanged(vw, "setActiveWebview");
}

/**
 * 現在のアクティブIDを取得（デバッグ用途）
 */
export function getActiveId() {
  const id = activeWebview && document.contains(activeWebview) ? activeWebview.id : "(none)";
  void 0;
  return id;
}

/**
 * WebContents ID を取得（キャッシュ削除に必須）
 */
export function getActiveWebContentsId() {
  // 参照が死んでいたら復元を試みる
  if (!activeWebview || !document.contains(activeWebview)) {
    console.warn("⚠ activeWebview が null/DOM外 → 復元を試みます");
    const vw = getActiveWebview();
    if (!vw) return null;
  }

  if (typeof activeWebview.getWebContentsId !== "function") {
    console.warn("⚠ getWebContentsId() が存在しません");
    return null;
  }

  try {
    const id = activeWebview.getWebContentsId();
    void 0;
    return id;
  } catch (e) {
    console.error("💥 getWebContentsId 実行中に例外:", e);
    return null;
  }
}
